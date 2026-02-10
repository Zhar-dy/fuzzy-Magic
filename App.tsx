import React, { useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import GameScene from './components/GameScene';
import { UIOverlay } from './components/UIOverlay';
import FuzzyDashboard from './components/FuzzyDashboard';
import FuzzyTheoryModal from './components/FuzzyTheoryModal';
import { PlayerState, EnemyState, FuzzyMetrics, GameLogEntry } from './types';
import { MerchantAI } from './services/fuzzyLogic';

const INITIAL_PLAYER_STATE: PlayerState = {
  position: { x: 0, y: 0, z: 5 },
  hp: 100, maxHp: 100, magicCd: 0, maxMagicCd: 60, recentAttacks: 0, isAttacking: false,
  isDodging: false, isDefending: false, isHealing: false,
  gold: 0, totalGoldSpent: 0, damageMultiplier: 1.0
};

function App() {
  const [gameActive, setGameActive] = useState(false);
  const [gameOverState, setGameOverState] = useState<{isOver: boolean, won: boolean}>({ isOver: false, won: false });
  const [sessionKey, setSessionKey] = useState(0); 
  const [showShop, setShowShop] = useState(false);
  const [theoryModal, setTheoryModal] = useState<'rules' | 'architecture' | 'math' | null>(null);
  
  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [enemies, setEnemies] = useState<EnemyState[]>([]);

  const [metrics, setMetrics] = useState<FuzzyMetrics | null>(null);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);

  const merchant = useMemo(() => new MerchantAI(), []);
  const currentDiscount = useMemo(() => {
    return merchant.evaluate(playerState.totalGoldSpent, playerState.hp);
  }, [playerState.totalGoldSpent, playerState.hp]);

  const handleLog = useCallback((text: string, type: 'info' | 'combat' | 'ai') => {
    setLogs(prev => [...prev.slice(-19), { id: Date.now().toString() + Math.random(), text, type }]);
  }, []);

  const handleStatsUpdate = useCallback((p: PlayerState, eList: EnemyState[]) => {
    setPlayerState(prev => ({ 
        ...p, 
        gold: prev.gold, 
        totalGoldSpent: prev.totalGoldSpent, 
        damageMultiplier: prev.damageMultiplier 
    })); 
    setEnemies(eList);
  }, []);

  const handleGameOver = useCallback((won: boolean) => {
      setGameActive(false);
      setGameOverState({ isOver: true, won });
      handleLog(won ? "TRIUMPH! The dungeon is purged." : "TRAGEDY! A hero falls in the dark.", 'info');
  }, [handleLog]);

  const startGame = () => {
      setSessionKey(prev => prev + 1); 
      setEnemies([]);
      setMetrics(null);
      setLogs([{ id: 'init', text: 'You step into the abyss. May the Old Gods protect you.', type: 'info' }]);
      setGameOverState({ isOver: false, won: false });
      setGameActive(true);
      setShowShop(false);
      setPlayerState(INITIAL_PLAYER_STATE);
  };

  const buyItem = (type: 'hp' | 'str' | 'dmg') => {
    const basePrices = { hp: 100, str: 250, dmg: 300 };
    const price = Math.floor(basePrices[type] * (1 - currentDiscount / 100));

    if (playerState.gold >= price) {
      setPlayerState(p => ({
        ...p,
        gold: p.gold - price,
        totalGoldSpent: p.totalGoldSpent + price,
        hp: type === 'hp' ? Math.min(100, p.hp + 40) : p.hp,
        damageMultiplier: type === 'str' ? p.damageMultiplier + 0.2 : (type === 'dmg' ? p.damageMultiplier + 0.25 : p.damageMultiplier)
      }));
      handleLog(`A magical artifact acquired: ${type === 'hp' ? 'Health Potion' : type === 'str' ? 'Strength Elixir' : 'Ring of Power'}.`, 'info');
    } else {
      handleLog("You lack the gold for such treasures.", 'combat');
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#1a120b] overflow-hidden select-none font-serif">
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 15, 15], fov: 40 }}>
            <GameScene 
                key={sessionKey} 
                gameActive={gameActive}
                onMetricsUpdate={setMetrics}
                onLog={handleLog}
                onStatsUpdate={handleStatsUpdate}
                onGameOver={handleGameOver}
                playerStateExt={playerState}
                onOpenShop={() => setShowShop(true)}
            />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
         <UIOverlay player={playerState} enemies={enemies} logs={logs} />
         
         <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-4">
            <div className="bg-[#2c241b]/95 border-2 border-yellow-700/30 px-6 py-2 rounded-2xl flex items-center gap-4 backdrop-blur-xl shadow-2xl">
                <span className="text-yellow-500 font-black text-sm tracking-widest uppercase">GOLD: {playerState.gold}</span>
                {Math.sqrt(playerState.position.x**2 + playerState.position.z**2) < 5.5 && (
                    <span className="text-[10px] text-yellow-600 font-black uppercase tracking-[0.3em] animate-pulse border-l border-yellow-900/20 pl-4 italic">Hallowed Ground</span>
                )}
            </div>
            
            <button 
              onClick={() => setTheoryModal('math')}
              className="bg-[#3e2b1c] hover:bg-yellow-900/40 text-yellow-500 font-black text-[10px] px-6 py-2.5 rounded-2xl uppercase tracking-widest shadow-xl border-2 border-yellow-700/20 transition-all backdrop-blur-xl"
            >
              Arcane Knowledge
            </button>
         </div>
      </div>

      {showShop && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl">
           <div className="bg-[#2c241b] border-4 border-yellow-800 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_0_100px_rgba(234,179,8,0.1)]">
              <div className="flex justify-between items-center mb-10 border-b border-yellow-900/20 pb-6">
                 <div>
                    <h2 className="text-3xl font-black text-yellow-600 italic uppercase tracking-tighter">Wandering Merchant</h2>
                    <p className="text-[10px] text-yellow-900/60 font-sans tracking-widest uppercase mt-1 font-bold">Blessing of Wealth: {currentDiscount.toFixed(1)}% Discount</p>
                 </div>
                 <button onClick={() => setShowShop(false)} className="text-yellow-900/40 hover:text-yellow-500 text-4xl transition-colors font-light">&times;</button>
              </div>

              <div className="space-y-4 font-sans">
                 <button onClick={() => buyItem('hp')} className="w-full bg-black/20 p-5 rounded-[1.5rem] flex justify-between items-center border border-yellow-900/10 hover:border-yellow-600 transition-all group">
                    <div><h3 className="font-bold text-yellow-100 uppercase text-xs tracking-widest group-hover:text-yellow-400">Health Potion</h3></div>
                    <span className="bg-red-900 text-white px-5 py-2 rounded-xl text-[10px] font-black">{Math.floor(100 * (1 - currentDiscount / 100))}g</span>
                 </button>
                 <button onClick={() => buyItem('str')} className="w-full bg-black/20 p-5 rounded-[1.5rem] flex justify-between items-center border border-yellow-900/10 hover:border-yellow-600 transition-all group">
                    <div><h3 className="font-bold text-yellow-100 uppercase text-xs tracking-widest group-hover:text-yellow-400">Strength Elixir</h3></div>
                    <span className="bg-blue-900 text-white px-5 py-2 rounded-xl text-[10px] font-black">{Math.floor(250 * (1 - currentDiscount / 100))}g</span>
                 </button>
                 <button onClick={() => buyItem('dmg')} className="w-full bg-black/20 p-5 rounded-[1.5rem] flex justify-between items-center border border-yellow-900/10 hover:border-yellow-600 transition-all group">
                    <div><h3 className="font-bold text-yellow-100 uppercase text-xs tracking-widest group-hover:text-yellow-400">Ring of Power</h3></div>
                    <span className="bg-yellow-600 text-black px-5 py-2 rounded-xl text-[10px] font-black">{Math.floor(300 * (1 - currentDiscount / 100))}g</span>
                 </button>
              </div>

              <div className="mt-12 pt-6 border-t border-yellow-900/20 flex justify-between items-center text-[10px] text-yellow-900/60 font-bold uppercase">
                 <span className="bg-black/40 px-3 py-1 rounded-full">WALLET: {playerState.gold}g</span>
                 <button onClick={() => setShowShop(false)} className="text-yellow-600 hover:underline">Leave Merchant</button>
              </div>
           </div>
        </div>
      )}

      <div className="absolute inset-y-0 right-0 z-20 pointer-events-auto">
          <FuzzyDashboard metrics={metrics} />
      </div>

      {theoryModal && (
        <FuzzyTheoryModal type={theoryModal as any} onClose={() => setTheoryModal(null)} />
      )}

      {(!gameActive) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#1a120b]/95 backdrop-blur-2xl p-6">
          <div className="text-center p-16 border-4 border-yellow-900/20 bg-[#2c241b]/50 rounded-[3rem] shadow-2xl max-w-2xl w-full">
            <h1 className="text-7xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 via-yellow-600 to-red-800 tracking-tighter italic uppercase">
              {gameOverState.isOver ? (gameOverState.won ? "GLORIOUS" : "FALLEN") : "FUZZY_SOULS"}
            </h1>
            <p className="text-yellow-900/60 mb-12 text-[10px] uppercase tracking-[0.5em] font-black">
              Ancient Scrolls & Tactical Divination
            </p>
            <button 
              onClick={startGame}
              className="w-full py-6 bg-gradient-to-br from-yellow-700 to-red-900 rounded-[2rem] text-white font-black text-2xl hover:scale-[1.02] transition-all shadow-2xl active:scale-[0.98] uppercase tracking-widest"
            >
              Begin Pilgrimage
            </button>
            <p className="mt-8 text-[9px] text-yellow-900/40 font-mono tracking-[0.3em] uppercase italic">The Weaver watches your every thread</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;