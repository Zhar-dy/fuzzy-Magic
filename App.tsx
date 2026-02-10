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
  const [isDashboardVisible, setIsDashboardVisible] = useState(true);
  
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
      handleLog(won ? "TRIUMPH! The abyss is purged." : "TRAGEDY! The hero has been consumed.", 'info');
  }, [handleLog]);

  const startGame = () => {
      setSessionKey(prev => prev + 1); 
      setEnemies([]);
      setMetrics(null);
      setLogs([{ id: 'init', text: 'Initiating tactical divination. The Shadow Golems approach.', type: 'info' }]);
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
      handleLog(`Acquired ${type === 'hp' ? 'Vitality Draught' : type === 'str' ? 'Strength Elixir' : 'Ring of Power'}.`, 'info');
    } else {
      handleLog("Insufficient gold for this relic.", 'combat');
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#09090b] overflow-hidden select-none font-sans text-zinc-100">
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
         
         <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-4">
            <button 
              onClick={() => setIsDashboardVisible(!isDashboardVisible)}
              className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-bold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-widest shadow-xl border border-zinc-800 transition-all backdrop-blur-xl"
            >
              {isDashboardVisible ? 'Hide Matrix' : 'Show Matrix'}
            </button>

            <div className="bg-zinc-900/90 border border-zinc-800 px-6 py-2 rounded-xl flex items-center gap-4 backdrop-blur-xl shadow-xl">
                <span className="text-amber-400 font-bold text-sm tracking-widest uppercase">GOLD: {playerState.gold}</span>
                {Math.sqrt(playerState.position.x**2 + playerState.position.z**2) < 5.5 && (
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse border-l border-zinc-800 pl-4 italic">Sanctuary</span>
                )}
            </div>
            
            <button 
              onClick={() => setTheoryModal('math')}
              className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-[10px] px-6 py-2.5 rounded-xl uppercase tracking-widest shadow-xl border border-zinc-800 transition-all backdrop-blur-xl"
            >
              Arcane Knowledge
            </button>
         </div>
      </div>

      {showShop && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-4">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
                 <div>
                    <h2 className="text-2xl font-black text-amber-500 italic uppercase tracking-tighter">Imperial Cache</h2>
                    <p className="text-[10px] text-zinc-500 tracking-widest uppercase mt-1">Loyalty Discount: {currentDiscount.toFixed(1)}%</p>
                 </div>
                 <button onClick={() => setShowShop(false)} className="text-zinc-600 hover:text-white text-3xl transition-colors">&times;</button>
              </div>

              <div className="space-y-4">
                 <button onClick={() => buyItem('hp')} className="w-full bg-zinc-950/50 p-5 rounded-2xl flex justify-between items-center border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 transition-all group">
                    <div><h3 className="font-bold text-zinc-100 uppercase text-xs tracking-widest group-hover:text-amber-400 transition-colors">Vitality Draught</h3></div>
                    <span className="bg-amber-600 text-black px-4 py-1.5 rounded-lg text-[10px] font-black">{Math.floor(100 * (1 - currentDiscount / 100))}g</span>
                 </button>
                 <button onClick={() => buyItem('str')} className="w-full bg-zinc-950/50 p-5 rounded-2xl flex justify-between items-center border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 transition-all group">
                    <div><h3 className="font-bold text-zinc-100 uppercase text-xs tracking-widest group-hover:text-blue-400 transition-colors">Strength Elixir</h3></div>
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black">{Math.floor(250 * (1 - currentDiscount / 100))}g</span>
                 </button>
                 <button onClick={() => buyItem('dmg')} className="w-full bg-zinc-950/50 p-5 rounded-2xl flex justify-between items-center border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all group">
                    <div><h3 className="font-bold text-zinc-100 uppercase text-xs tracking-widest group-hover:text-emerald-400 transition-colors">Ring of Power</h3></div>
                    <span className="bg-emerald-600 text-black px-4 py-1.5 rounded-lg text-[10px] font-black">{Math.floor(300 * (1 - currentDiscount / 100))}g</span>
                 </button>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase">
                 <span className="bg-zinc-950 px-3 py-1 rounded-full">GOLD: {playerState.gold}g</span>
                 <button onClick={() => setShowShop(false)} className="text-amber-500 hover:underline">Exit Trade</button>
              </div>
           </div>
        </div>
      )}

      {/* Decision Matrix Dashboard on the Left */}
      {isDashboardVisible && (
        <div className="absolute inset-y-0 left-0 z-20 pointer-events-auto">
            <FuzzyDashboard metrics={metrics} />
        </div>
      )}

      {theoryModal && (
        <FuzzyTheoryModal type={theoryModal as any} onClose={() => setTheoryModal(null)} />
      )}

      {!gameActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-2xl p-6">
          <div className="text-center p-12 border border-zinc-800 bg-zinc-900/40 rounded-[2.5rem] shadow-2xl max-w-xl w-full">
            <h1 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-blue-500 to-emerald-600 tracking-tighter italic uppercase">
              {gameOverState.isOver ? (gameOverState.won ? "DOMINANCE" : "FALLEN") : "DECISION MATRIX"}
            </h1>
            <p className="text-zinc-500 mb-10 text-[10px] uppercase tracking-[0.4em] font-black">
              NEURAL BATTLE INTERFACE // FUZZY SOULS
            </p>
            <button 
              onClick={startGame}
              className="w-full py-5 bg-zinc-100 text-zinc-950 font-black text-xl rounded-2xl hover:bg-white hover:scale-[1.02] transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest"
            >
              Initialize Hero
            </button>
            <p className="mt-8 text-[9px] text-zinc-600 font-mono tracking-widest uppercase italic">The Logic Engine Awaits Your Command</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
