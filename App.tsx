
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
      handleLog(won ? "VICTORY! Boundary secure." : "SYSTEM FAILURE: Operator offline.", 'info');
  }, [handleLog]);

  const startGame = () => {
      setSessionKey(prev => prev + 1); 
      setEnemies([]);
      setMetrics(null);
      setLogs([{ id: 'init', text: 'System reboot complete. Defense protocol initiated.', type: 'info' }]);
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
      handleLog(`Hardware upgrade acquired: ${type.toUpperCase()} module.`, 'info');
    } else {
      handleLog("Insufficient credits for module upgrade.", 'combat');
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#020205] overflow-hidden select-none font-sans">
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

      {/* Main UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
         <UIOverlay player={playerState} enemies={enemies} logs={logs} />
         
         <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-4">
            <div className="bg-black/80 border border-yellow-600/30 px-6 py-2 rounded-2xl flex items-center gap-4 backdrop-blur-xl shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                <span className="text-yellow-500 font-black text-sm tracking-widest">CREDITS: {playerState.gold}</span>
                {Math.sqrt(playerState.position.x**2 + playerState.position.z**2) < 5.5 && (
                    <span className="text-[10px] text-green-400 font-black uppercase tracking-[0.3em] animate-pulse border-l border-white/10 pl-4">Sanctuary Sync</span>
                )}
            </div>
            
            <button 
              onClick={() => setTheoryModal('math')}
              className="bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 font-black text-[10px] px-6 py-2.5 rounded-2xl uppercase tracking-widest shadow-lg border border-cyan-400/30 transition-all backdrop-blur-xl"
            >
              System Logic
            </button>
         </div>
      </div>

      {showShop && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-[#020205]/90 backdrop-blur-xl">
           <div className="bg-[#0a0a0f] border border-yellow-600/20 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_0_100px_rgba(234,179,8,0.05)]">
              <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                 <div>
                    <h2 className="text-3xl font-black text-yellow-500 italic uppercase tracking-tighter">Imperial Cache</h2>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mt-1">Loyalty Discount Applied: {currentDiscount.toFixed(1)}%</p>
                 </div>
                 <button onClick={() => setShowShop(false)} className="text-gray-600 hover:text-white text-4xl transition-colors font-light">&times;</button>
              </div>

              <div className="space-y-4">
                 <button onClick={() => buyItem('hp')} className="w-full bg-white/5 p-5 rounded-[1.5rem] flex justify-between items-center border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                    <div><h3 className="font-bold text-white uppercase text-xs tracking-widest group-hover:text-blue-400 transition-colors">Vitality Core</h3></div>
                    <span className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black">{Math.floor(100 * (1 - currentDiscount / 100))}c</span>
                 </button>
                 <button onClick={() => buyItem('str')} className="w-full bg-white/5 p-5 rounded-[1.5rem] flex justify-between items-center border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                    <div><h3 className="font-bold text-white uppercase text-xs tracking-widest group-hover:text-purple-400 transition-colors">Kinetic Amp</h3></div>
                    <span className="bg-purple-600 text-white px-5 py-2 rounded-xl text-[10px] font-black">{Math.floor(250 * (1 - currentDiscount / 100))}c</span>
                 </button>
                 <button onClick={() => buyItem('dmg')} className="w-full bg-white/5 p-5 rounded-[1.5rem] flex justify-between items-center border border-white/5 hover:border-red-500/50 hover:bg-red-500/5 transition-all group">
                    <div><h3 className="font-bold text-red-400 uppercase text-xs italic tracking-widest group-hover:text-red-500 transition-colors">Overclock Drive</h3></div>
                    <span className="bg-red-600 text-white px-5 py-2 rounded-xl text-[10px] font-black">{Math.floor(300 * (1 - currentDiscount / 100))}c</span>
                 </button>
              </div>

              <div className="mt-12 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                 <span className="bg-gray-900 px-3 py-1 rounded-full">CREDITS: {playerState.gold}c</span>
                 <button onClick={() => setShowShop(false)} className="text-yellow-500 font-black uppercase hover:underline">Exit Cache</button>
              </div>
           </div>
        </div>
      )}

      {/* Fuzzy Dashboard Sidebar */}
      <div className="absolute inset-y-0 right-0 z-20 pointer-events-auto">
          <FuzzyDashboard metrics={metrics} />
      </div>

      {theoryModal && (
        <FuzzyTheoryModal type={theoryModal as any} onClose={() => setTheoryModal(null)} />
      )}

      {/* Menu / Game Over Screen */}
      {(!gameActive) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#020205]/95 backdrop-blur-2xl p-6">
          <div className="text-center p-16 border border-white/5 bg-white/[0.02] rounded-[3rem] shadow-[0_0_150px_rgba(59,130,246,0.1)] max-w-2xl w-full">
            <h1 className="text-7xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 tracking-tighter italic uppercase">
              {gameOverState.isOver ? (gameOverState.won ? "DOMINANCE" : "TERMINATED") : "FUZZY_GUARD"}
            </h1>
            <p className="text-gray-500 mb-12 text-[10px] uppercase tracking-[0.5em] font-black">
              NEURAL INTERFACE & BATTLE LOGIC ENGINE
            </p>
            <button 
              onClick={startGame}
              className="w-full py-6 bg-gradient-to-br from-blue-600 to-purple-700 rounded-[2rem] text-white font-black text-2xl hover:scale-[1.02] transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)] active:scale-[0.98]"
            >
              INITIALIZE DEFENSE
            </button>
            <p className="mt-8 text-[9px] text-gray-600 font-mono tracking-widest uppercase italic">Unauthorized Access Prohibited // Division Alpha</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
