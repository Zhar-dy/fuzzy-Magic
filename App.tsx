import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import GameScene from './components/GameScene';
import { UIOverlay } from './components/UIOverlay';
import FuzzyDashboard from './components/FuzzyDashboard';
import FuzzyTheoryModal from './components/FuzzyTheoryModal';
import { PlayerState, EnemyState, FuzzyMetrics, GameLogEntry } from './types';

const INITIAL_PLAYER_STATE: PlayerState = {
  position: { x: 0, y: 0, z: 5 },
  hp: 100, maxHp: 100, magicCd: 0, maxMagicCd: 120, recentAttacks: 0, isAttacking: false
};

const INITIAL_ENEMY_STATE: EnemyState = {
  position: { x: 0, y: 0, z: -5 },
  hp: 100, maxHp: 100, color: '#ff4444'
};

function App() {
  const [gameActive, setGameActive] = useState(false);
  const [gameOverState, setGameOverState] = useState<{isOver: boolean, won: boolean}>({ isOver: false, won: false });
  const [sessionKey, setSessionKey] = useState(0); 
  
  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [enemyState, setEnemyState] = useState<EnemyState>(INITIAL_ENEMY_STATE);

  const [metrics, setMetrics] = useState<FuzzyMetrics | null>(null);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  
  // Menu visibility states
  const [theoryModal, setTheoryModal] = useState<'rules' | 'architecture' | null>(null);

  const handleLog = useCallback((text: string, type: 'info' | 'combat' | 'ai') => {
    setLogs(prev => [...prev.slice(-19), { id: Date.now().toString() + Math.random(), text, type }]);
  }, []);

  const handleStatsUpdate = useCallback((p: PlayerState, e: EnemyState) => {
    setPlayerState(p);
    setEnemyState(e);
  }, []);

  const handleGameOver = useCallback((won: boolean) => {
      setGameActive(false);
      setGameOverState({ isOver: true, won });
      handleLog(won ? "VICTORY! The Guardian falls." : "DEFEAT! You were slain.", 'info');
  }, [handleLog]);

  const startGame = () => {
      // Complete state flush
      setSessionKey(prev => prev + 1); 
      setPlayerState(INITIAL_PLAYER_STATE);
      setEnemyState(INITIAL_ENEMY_STATE);
      setMetrics(null);
      setLogs([{ id: 'init', text: 'Battle Started! Use WASD to Move, SPACE to Hit, E for Magic.', type: 'info' }]);
      setGameOverState({ isOver: false, won: false });
      setGameActive(true);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 15, 15], fov: 40 }}>
            <GameScene 
                key={sessionKey} 
                gameActive={gameActive}
                onMetricsUpdate={setMetrics}
                onLog={handleLog}
                onStatsUpdate={handleStatsUpdate}
                onGameOver={handleGameOver}
            />
        </Canvas>
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
         <UIOverlay player={playerState} enemy={enemyState} logs={logs} />
      </div>

      {/* Right Side Dashboard */}
      <div className="absolute inset-y-0 right-0 z-20 pointer-events-auto">
          <FuzzyDashboard metrics={metrics} enemy={enemyState} />
      </div>

      {/* Deep-Dive Theory Modals */}
      {theoryModal && (
        <FuzzyTheoryModal 
          type={theoryModal} 
          onClose={() => setTheoryModal(null)} 
        />
      )}

      {/* Main Menu / Game Over Screen */}
      {(!gameActive) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="text-center p-10 border border-white/10 bg-black/95 rounded-3xl shadow-[0_0_100px_rgba(59,130,246,0.15)] max-w-2xl w-full">
            <h1 className="text-6xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 tracking-tighter italic">
              {gameOverState.isOver ? (gameOverState.won ? "VICTORY" : "TERMINATED") : "FUZZY GUARDIAN"}
            </h1>
            <p className="text-gray-500 mb-10 text-[10px] uppercase tracking-[0.4em] font-black">
              {gameOverState.isOver 
                ? (gameOverState.won ? "The AI Knowledge Base was insufficient." : "You failed to adapt to the logic sets.") 
                : "Real-time Fuzzy Expert System Visualization"}
            </p>
            
            <div className="grid grid-cols-2 gap-6 text-left text-xs text-gray-400 mb-10 bg-gray-900/50 p-6 rounded-2xl border border-gray-800 shadow-inner font-mono">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                  <span><b>Goal:</b> Destroy the Guardian</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span><b>Move:</b> WASD / Arrows</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  <span><b>Melee:</b> Spacebar</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                  <span><b>Magic:</b> E (120f CD)</span>
                </div>
                <div className="col-span-2 text-center text-[9px] mt-6 text-gray-600 uppercase tracking-widest font-black border-t border-gray-800 pt-5">
                    Observe the "Fuzzy AI Brain" on the right to understand decision sets.
                </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={startGame}
                className="w-full py-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl text-white font-black text-2xl hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_15px_40px_rgba(59,130,246,0.25)] border-b-4 border-blue-900"
              >
                {gameOverState.isOver ? "REINITIALIZE ARENA" : "ACTIVATE SIMULATION"}
              </button>

              <div className="flex gap-4 mt-4">
                <button 
                  onClick={() => setTheoryModal('rules')}
                  className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-cyan-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-cyan-900/50 transition-all hover:border-cyan-400 shadow-lg"
                >
                  Knowledge Base Rules
                </button>
                <button 
                  onClick={() => setTheoryModal('architecture')}
                  className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-purple-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-900/50 transition-all hover:border-purple-400 shadow-lg"
                >
                  System Architecture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;