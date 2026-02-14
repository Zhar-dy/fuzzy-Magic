
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import GameScene from './components/GameScene';
import { UIOverlay } from './components/UIOverlay';
import FuzzyDashboard from './components/FuzzyDashboard';
import FuzzyTheoryModal from './components/FuzzyTheoryModal';
import { PlayerState, EnemyState, FuzzyMetrics, GameLogEntry } from './types';
import { MerchantAI } from './services/fuzzyLogic';
import { generateSpeech } from './services/geminiService';

const INITIAL_PLAYER_STATE: PlayerState = {
  position: { x: 0, y: 0, z: 5 },
  hp: 100, maxHp: 100, magicCd: 0, maxMagicCd: 150, recentAttacks: 0, isAttacking: false,
  isDodging: false, isDefending: false, isHealing: false,
  gold: 0, totalGoldSpent: 0, damageMultiplier: 1.0
};

const NARRATION_SCRIPT = [
    {
        title: "I. The Illusion of Life",
        text: "In most modern RPGs, you aren't fighting an enemy; you’re fighting a spreadsheet. Static 'If-Then' logic creates predictable patterns—stay at range, wait for the animation, repeat. It’s binary. It’s boring. 'Fuzzy Guardian' breaks this cycle by removing the 'switch' and replacing it with a 'spectrum'. Our enemies don't just react; they perceive the battlefield in shades of grey."
    },
    {
        title: "II. The Fuzzy Brain",
        text: "Take our 'Aggression Vector'. Instead of a simple 'Attack' or 'Flee' command, we use Mamdani Inference. Our Golems calculate membership in multiple states simultaneously. A Golem might be 40% 'Exhausted' and 60% 'Tactical'. It doesn't just stop moving; it slows down, retreats slightly, and waits for its Energy membership to transition back to 'Full'. This fuzzy bridge between sensors and actions creates emergent behaviors that weren't explicitly programmed."
    },
    {
        title: "III. The Adaptive Edge",
        text: "For you, the player, this means every encounter is a unique dialogue. The AI adapts to your stance. If you're a defensive turtle, it bullies you. If you're an aggressive caster, it punishes your cooldowns. You aren't just clicking buttons; you're engaging with a system that respects your skill and punishes your patterns. This is the future of adaptive RPG combat—logical, unpredictable, and alive."
    }
];

function App() {
  const [gameActive, setGameActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOverState, setGameOverState] = useState<{isOver: boolean, won: boolean}>({ isOver: false, won: false });
  const [resetSignal, setResetSignal] = useState(0); 
  const [showShop, setShowShop] = useState(false);
  const [showLogicModal, setShowLogicModal] = useState(false);
  const [isDashboardVisible, setIsDashboardVisible] = useState(true);
  
  // Narration State
  const [isNarrating, setIsNarrating] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(-1);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [manualEnemyEnergy, setManualEnemyEnergy] = useState(50);
  const [isAutoRegen, setIsAutoRegen] = useState(true);

  const [playerState, setPlayerState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [enemies, setEnemies] = useState<EnemyState[]>([]);

  const [metrics, setMetrics] = useState<FuzzyMetrics | null>(null);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);

  const [highlightStat, setHighlightStat] = useState<'hp' | 'dmg' | null>(null);

  const merchant = useMemo(() => new MerchantAI(), []);
  const currentDiscount = useMemo(() => {
    return merchant.evaluate(playerState.totalGoldSpent, playerState.hp);
  }, [playerState.totalGoldSpent, playerState.hp]);

  const handleLog = useCallback((text: string, type: 'info' | 'combat' | 'ai') => {
    setLogs(prev => [...prev.slice(-19), { id: Date.now().toString() + Math.random(), text, type }]);
  }, []);

  const handleStatsUpdate = useCallback((p: PlayerState, eList: EnemyState[]) => {
    setPlayerState(prev => ({ 
        ...prev, 
        ...p,
        gold: p.gold 
    })); 
    setEnemies(eList);
  }, []);

  const handleGameOver = useCallback((won: boolean) => {
      setGameActive(false);
      setGameOverState({ isOver: true, won });
      handleLog(won ? "TRIUMPH! The abyss is purged." : "TRAGEDY! The hero has been consumed.", 'info');
  }, [handleLog]);

  const startGame = () => {
      setResetSignal(prev => prev + 1);
      setEnemies([]);
      setMetrics(null);
      setLogs([{ id: 'init', text: 'Initiating tactical divination. The Shadow Golems approach.', type: 'info' }]);
      setGameOverState({ isOver: false, won: false });
      setGameActive(true);
      setShowShop(false);
      setPlayerState(INITIAL_PLAYER_STATE);
      setGameStarted(true);
      setManualEnemyEnergy(50);
      setIsAutoRegen(true);
  };

  const handleReset = () => {
    setGameActive(false);
    setPlayerState(INITIAL_PLAYER_STATE);
    setEnemies([]);
    setMetrics(null);
    setLogs([{ id: 'reset', text: 'Simulation reset. Entities respawned.', type: 'info' }]);
    setGameOverState({ isOver: false, won: false });
    setResetSignal(prev => prev + 1);
    setTimeout(() => {
        setGameActive(true);
    }, 50);
  };

  const stopNarration = useCallback(() => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
    setIsNarrating(false);
    setCurrentChapter(-1);
  }, []);

  const startNarration = async () => {
    if (isNarrating) {
        stopNarration();
        return;
    }

    setIsNarrating(true);
    handleLog("AI Narrator initiated. Tuning logic stream...", "info");

    for (let i = 0; i < NARRATION_SCRIPT.length; i++) {
        setCurrentChapter(i);
        const buffer = await generateSpeech(NARRATION_SCRIPT[i].text, 'Puck');
        if (!buffer) break;

        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        audioSourceRef.current = source;

        const playPromise = new Promise((resolve) => {
            source.onended = resolve;
        });

        source.start();
        await playPromise;
        if (!isNarrating) break;
    }

    setIsNarrating(false);
    setCurrentChapter(-1);
  };

  const buyItem = (type: 'hp' | 'str' | 'dmg') => {
    if (type === 'hp' && playerState.hp >= playerState.maxHp) {
        handleLog("Vitality is already at maximum capacity.", 'info');
        return;
    }

    const basePrices = { hp: 100, str: 250, dmg: 300 };
    const price = Math.floor(basePrices[type] * (1 - currentDiscount / 100));

    if (playerState.gold >= price) {
      setPlayerState(p => ({
        ...p,
        gold: p.gold - price,
        totalGoldSpent: p.totalGoldSpent + price,
        hp: type === 'hp' ? Math.min(p.maxHp, p.hp + 40) : p.hp,
        damageMultiplier: type === 'str' ? p.damageMultiplier + 0.2 : (type === 'dmg' ? p.damageMultiplier + 0.25 : p.damageMultiplier)
      }));
      
      const statType = type === 'hp' ? 'hp' : 'dmg';
      setHighlightStat(statType);
      setTimeout(() => setHighlightStat(null), 1000);

      handleLog(`Acquired ${type === 'hp' ? 'Vitality Draught' : type === 'str' ? 'Strength Elixir' : 'Ring of Power'}.`, 'info');
    } else {
      handleLog("Insufficient gold for this relic.", 'combat');
    }
  };

  return (
    <div className="relative w-full h-screen bg-zinc-950 overflow-hidden select-none font-sans text-zinc-100">
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 15, 15], fov: 40 }}>
            <GameScene 
                gameActive={gameActive}
                onMetricsUpdate={setMetrics}
                onLog={handleLog}
                onStatsUpdate={handleStatsUpdate}
                onGameOver={handleGameOver}
                playerStateExt={playerState}
                onOpenShop={() => setShowShop(true)}
                manualEnemyEnergy={manualEnemyEnergy}
                isAutoRegen={isAutoRegen}
                resetSignal={resetSignal}
            />
        </Canvas>
      </div>

      {/* Narration Subtitles Overlay */}
      {isNarrating && currentChapter >= 0 && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-[70] w-full max-w-2xl px-8 pointer-events-none">
            <div className="bg-zinc-950/80 border border-cyan-500/30 backdrop-blur-xl p-6 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] text-center animate-fadeIn">
                <h3 className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.5em] mb-3">AI Commentary // {NARRATION_SCRIPT[currentChapter].title}</h3>
                <p className="text-zinc-100 text-lg font-medium leading-relaxed italic">
                    "{NARRATION_SCRIPT[currentChapter].text}"
                </p>
                <div className="mt-4 flex justify-center">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-1 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="absolute inset-0 z-10 pointer-events-none">
         <UIOverlay player={playerState} enemies={enemies} logs={logs} />
         
         <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-4">
            <button 
              onClick={startNarration}
              className={`font-bold text-[10px] px-6 py-2.5 rounded-xl uppercase tracking-widest shadow-xl border transition-all backdrop-blur-xl flex items-center gap-2 ${isNarrating ? 'bg-cyan-500 text-zinc-950 border-cyan-400 animate-pulse' : 'bg-zinc-900/90 text-zinc-400 hover:text-white border-zinc-800'}`}
            >
              {isNarrating ? <div className="w-2 h-2 bg-zinc-950 rounded-full animate-ping" /> : null}
              {isNarrating ? 'Stop Narrator' : 'Play Presentation'}
            </button>

            {gameStarted && !gameOverState.isOver && (
              <button
                onClick={() => setGameActive(!gameActive)}
                className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-bold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-widest shadow-xl border border-zinc-800 transition-all backdrop-blur-xl"
              >
                {gameActive ? 'Pause' : 'Resume'}
              </button>
            )}
            {gameStarted && (
              <button
                onClick={handleReset}
                className="bg-rose-900/90 hover:bg-rose-800 text-zinc-100 font-bold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-widest shadow-xl border border-rose-800 transition-all backdrop-blur-xl"
              >
                Restart
              </button>
            )}
            <button 
              onClick={() => setIsDashboardVisible(!isDashboardVisible)}
              className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-bold text-[10px] px-4 py-2.5 rounded-xl uppercase tracking-widest shadow-xl border border-zinc-800 transition-all backdrop-blur-xl"
            >
              {isDashboardVisible ? 'Hide Matrix' : 'Show Matrix'}
            </button>

            <div className="bg-zinc-900/90 border border-zinc-800 px-6 py-2 rounded-xl flex items-center gap-4 backdrop-blur-xl shadow-xl">
                <span className="text-amber-400 font-bold text-sm tracking-widest uppercase">GOLD: {playerState.gold}</span>
                <button 
                  onClick={() => setPlayerState(p => ({ ...p, gold: p.gold + 1000 }))}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 transition-colors pointer-events-auto"
                  title="+1000 Gold"
                >
                  +1k
                </button>
            </div>
            
            <button 
              onClick={() => setShowLogicModal(true)}
              className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-[10px] px-6 py-2.5 rounded-xl uppercase tracking-widest shadow-xl border border-zinc-800 transition-all backdrop-blur-xl"
            >
              Logic Dashboard
            </button>
         </div>
      </div>

      {showShop && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-4">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-6">
                 <div>
                    <h2 className="text-2xl font-black text-amber-500 italic uppercase tracking-tighter">Imperial Cache</h2>
                    <p className="text-[10px] text-zinc-500 tracking-widest uppercase mt-1">Loyalty Discount: {currentDiscount.toFixed(1)}%</p>
                 </div>
                 <button onClick={() => setShowShop(false)} className="text-zinc-600 hover:text-white text-3xl transition-colors">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                  <div className={`flex flex-col items-center transition-all duration-300 ${highlightStat === 'hp' ? 'text-emerald-400 scale-105' : 'text-zinc-400'}`}>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Current Vitality</span>
                      <span className="text-xl font-black">{Math.floor(playerState.hp)} <span className="text-sm font-bold text-zinc-600">/ {playerState.maxHp}</span></span>
                  </div>
                  <div className={`flex flex-col items-center transition-all duration-300 ${highlightStat === 'dmg' ? 'text-emerald-400 scale-105' : 'text-zinc-400'}`}>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Magic Damage</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black">{(20 * playerState.damageMultiplier).toFixed(0)}</span>
                        <span className="text-[10px] font-bold opacity-50">({(playerState.damageMultiplier * 100).toFixed(0)}%)</span>
                      </div>
                  </div>
              </div>

              <div className="space-y-3">
                 <button onClick={() => buyItem('hp')} className="w-full bg-zinc-950/50 p-4 rounded-2xl flex justify-between items-center border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 transition-all group">
                    <div className="text-left">
                        <h3 className="font-bold text-zinc-100 uppercase text-xs tracking-widest group-hover:text-amber-400 transition-colors">Vitality Draught</h3>
                        <p className="text-[9px] text-zinc-500 mt-1 font-medium">Instantly restores 40 HP up to max capacity.</p>
                    </div>
                    <span className="bg-amber-600 text-black px-4 py-1.5 rounded-lg text-[10px] font-black min-w-[60px] text-center">{Math.floor(100 * (1 - currentDiscount / 100))}g</span>
                 </button>
                 <button onClick={() => buyItem('str')} className="w-full bg-zinc-950/50 p-4 rounded-2xl flex justify-between items-center border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 transition-all group">
                    <div className="text-left">
                        <h3 className="font-bold text-zinc-100 uppercase text-xs tracking-widest group-hover:text-blue-400 transition-colors">Strength Elixir</h3>
                        <p className="text-[9px] text-zinc-500 mt-1 font-medium">Permanently increases Magic Damage by 20%.</p>
                    </div>
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black min-w-[60px] text-center">{Math.floor(250 * (1 - currentDiscount / 100))}g</span>
                 </button>
                 <button onClick={() => buyItem('dmg')} className="w-full bg-zinc-950/50 p-4 rounded-2xl flex justify-between items-center border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all group">
                    <div className="text-left">
                        <h3 className="font-bold text-zinc-100 uppercase text-xs tracking-widest group-hover:text-emerald-400 transition-colors">Ring of Power</h3>
                        <p className="text-[9px] text-zinc-500 mt-1 font-medium">Permanently increases Magic Damage by 25%.</p>
                    </div>
                    <span className="bg-emerald-600 text-black px-4 py-1.5 rounded-lg text-[10px] font-black min-w-[60px] text-center">{Math.floor(300 * (1 - currentDiscount / 100))}g</span>
                 </button>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase">
                 <span className="bg-zinc-950 px-3 py-1 rounded-full border border-zinc-800/50 text-amber-500">AVAILABLE: {playerState.gold}g</span>
                 <button onClick={() => setShowShop(false)} className="text-zinc-400 hover:text-white hover:underline transition-colors">Exit Trade</button>
              </div>
           </div>
        </div>
      )}

      {isDashboardVisible && (
        <div className="absolute inset-y-0 left-0 z-20 pointer-events-auto">
            <FuzzyDashboard 
              metrics={metrics} 
              manualEnemyEnergy={manualEnemyEnergy}
              setManualEnemyEnergy={setManualEnemyEnergy}
              isAutoRegen={isAutoRegen}
              setIsAutoRegen={setIsAutoRegen}
              onOpenDetails={() => setShowLogicModal(true)}
            />
        </div>
      )}

      {showLogicModal && (
        <FuzzyTheoryModal onClose={() => setShowLogicModal(false)} />
      )}

      {!gameActive && gameStarted && !gameOverState.isOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="text-center animate-pulse">
            <h1 className="text-8xl font-black text-white/20 tracking-[0.2em] uppercase italic select-none">
              Paused
            </h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.5em] font-black mt-2">
              System Standby // Observation Mode
            </p>
          </div>
        </div>
      )}

      {(!gameStarted || gameOverState.isOver) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-2xl p-6">
          <div className="text-center p-12 border border-zinc-800 bg-zinc-900/40 rounded-[2.5rem] shadow-2xl max-w-xl w-full">
            <h1 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-blue-500 to-emerald-600 tracking-tighter italic uppercase">
              {gameOverState.isOver ? (gameOverState.won ? "DOMINANCE" : "FALLEN") : "FUZZY RPG"}
            </h1>
            <p className="text-zinc-500 mb-10 text-[10px] uppercase tracking-[0.4em] font-black">
              NEURAL BATTLE INTERFACE // FUZZY SOULS
            </p>
            <button 
              onClick={startGame}
              className="w-full py-5 bg-zinc-100 text-zinc-950 font-black text-xl rounded-2xl hover:bg-white hover:scale-[1.02] transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest"
            >
              {gameOverState.isOver ? 'Restart Simulation' : 'Initialize Hero'}
            </button>
            <p className="mt-8 text-[9px] text-zinc-600 font-mono tracking-widest uppercase italic">The Logic Engine Awaits Your Command</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
