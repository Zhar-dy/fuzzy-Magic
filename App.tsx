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
      handleLog(won ? "VICTORY! The Twin Guardians fall." : "DEFEAT! Slain in the boundary.", 'info');
  }, [handleLog]);

  const startGame = () => {
      setSessionKey(prev => prev + 1); 
      setEnemies([]);
      setMetrics(null);
      setLogs([{ id: 'init', text: 'Battle Started! [WASD] Move, [SPACE] Melee, [E] Context Action.', type: 'info' }]);
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
      handleLog(`Purchased ${type.toUpperCase()} for ${price}g.`, 'info');
    } else {
      handleLog("Insufficient gold!", 'combat');
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
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

      {/* Control Hints Left (Cleaned up) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
         <div className="bg-black/60 border border-gray-700 p-3 rounded-lg backdrop-blur text-[10px] font-mono text-gray-400 space-y-1">
            <p><b className="text-white uppercase">Context [E]:</b></p>
            <p className="text-green-400">Safe Zone: Shop</p>
            <p className="text-cyan-400">Battlefield: Magic</p>
            <p className="mt-2"><b className="text-white">[SPACE]</b> Melee</p>
            <p><b className="text-white">[WASD]</b> Move</p>
         </div>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
         <UIOverlay player={playerState} enemies={enemies} logs={logs} />
         
         {/* Top HUD Area */}
         <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2">
            <div className="bg-black/80 border border-yellow-600/50 px-4 py-2 rounded-full flex items-center gap-3 backdrop-blur shadow-lg">
                <span className="text-yellow-500 font-black">💰 {playerState.gold}g</span>
                {Math.sqrt(playerState.position.x**2 + playerState.position.z**2) < 5.5 && (
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest animate-pulse border-l border-white/10 pl-3">Merchant Range</span>
                )}
            </div>
            
            <button 
              onClick={() => setTheoryModal('math')}
              className="bg-cyan-600/90 hover:bg-cyan-500 text-white font-black text-[10px] px-4 py-2.5 rounded-full uppercase tracking-widest shadow-lg border border-cyan-400/30 transition-all backdrop-blur"
            >
              📊 Logic Dashboard
            </button>
         </div>
      </div>

      {showShop && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl">
           <div className="bg-gray-900 border border-yellow-600/30 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                 <div>
                    <h2 className="text-2xl font-black text-yellow-500 italic uppercase tracking-tighter">Imperial Merchant</h2>
                    <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Loyalty Reward: {currentDiscount.toFixed(1)}% OFF</p>
                 </div>
                 <button onClick={() => setShowShop(false)} className="text-gray-500 hover:text-white text-3xl font-light">&times;</button>
              </div>

              <div className="space-y-4">
                 <div className="bg-gray-800 p-4 rounded-2xl flex justify-between items-center border border-transparent hover:border-blue-500/50 transition-all">
                    <div><h3 className="font-bold text-white uppercase text-xs">Health Potion</h3></div>
                    <button onClick={() => buyItem('hp')} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black">{Math.floor(100 * (1 - currentDiscount / 100))}g</button>
                 </div>
                 <div className="bg-gray-800 p-4 rounded-2xl flex justify-between items-center border border-transparent hover:border-purple-500/50 transition-all">
                    <div><h3 className="font-bold text-white uppercase text-xs">Strength Elixir</h3></div>
                    <button onClick={() => buyItem('str')} className="bg-purple-600 px-4 py-2 rounded-xl text-[10px] font-black">{Math.floor(250 * (1 - currentDiscount / 100))}g</button>
                 </div>
                 <div className="bg-gray-800 p-4 rounded-2xl flex justify-between items-center border border-transparent hover:border-red-500/50 transition-all">
                    <div><h3 className="font-bold text-red-400 uppercase text-xs italic">Damage Elixir</h3></div>
                    <button onClick={() => buyItem('dmg')} className="bg-red-600 px-4 py-2 rounded-xl text-[10px] font-black">{Math.floor(300 * (1 - currentDiscount / 100))}g</button>
                 </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                 <span>Wallet: {playerState.gold}g</span>
                 <button onClick={() => setShowShop(false)} className="text-yellow-500 hover:underline">Close</button>
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
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="text-center p-10 border border-white/10 bg-black/95 rounded-3xl shadow-[0_0_100px_rgba(59,130,246,0.15)] max-w-2xl w-full">
            <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-tighter italic uppercase">
              {gameOverState.isOver ? (gameOverState.won ? "DOMINATED" : "FALLEN") : "TWIN GUARDIANS"}
            </h1>
            <p className="text-gray-500 mb-10 text-[10px] uppercase tracking-[0.4em] font-black">
              Logic Analytics & Context Action Update
            </p>
            <button 
              onClick={startGame}
              className="w-full py-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl text-white font-black text-2xl hover:brightness-110 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)]"
            >
              REAWAKEN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;