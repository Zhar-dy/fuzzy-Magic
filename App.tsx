
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
        title: "I. The Core Problem",
        text: "The interactive entertainment industry is currently facing a 'Complexity Wall.' In legacy RPGs, character behavior is dictated by rigid, binary decision trees. You are either 'Attacking' or 'Idle.' This creates a 'spreadsheet' experience where players easily identify patterns and the illusion of life is broken within minutes. In our RPG, we replace these binary gates with a spectrum of truth. While traditional games force an entity to make a binary choice, our system allows for nuanced, simultaneous states of existence, ensuring that the 'Shadow Golems' you face are not just scripts, but cognitive entities that perceive the battlefield in shades of grey."
    },
    {
        title: "II. The Fuzzy Logic Solution",
        text: "Our solution is the implementation of the Mamdani Inference Engine—a mathematical bridge between raw sensors and human-like intuition. Unlike standard AI, our entities use linguistic variables like 'Close,' 'Wounded,' or 'Aggressive.' For example, our 'Aggression Vector' doesn't just toggle on; it calculates membership across multiple rules. A Golem might be 40% 'Cautious' and 60% 'Tactical' simultaneously. This process—fuzzification of inputs, inference via our rule database, and centroid defuzzification—results in a precise aggression score that translates into organic, non-linear movement and attack patterns that feel frighteningly human."
    },
    {
        title: "III. The Player Benefits",
        text: "The primary benefit for the player is the emergence of 'Unscripted Dialogue.' In most games, high-level play becomes a chore of memorizing boss patterns. In 'Fuzzy Guardian,' the AI respects your agency. If you adopt a defensive stance, the fuzzy logic identifies your membership in the 'Turtle' state and adapts by increasing its pressure to break your guard. If you are reckless, it senses your energy depletion and waits for the optimal moment to strike. This creates a high-stakes psychological engagement where the player isn't just fighting a machine, but is involved in a dynamic tactical exchange that evolves based on their unique playstyle."
    },
    {
        title: "IV. Product & Research Tool",
        text: "Beyond entertainment, this project serves as a high-fidelity 'Glass Box' research tool. Most modern AI is a black box; our system is entirely transparent. By visualizing the live Mamdani pipeline in the 'Matrix Dashboard,' AI researchers and game designers can observe exactly how specific environmental stimuli translate into cognitive shifts. This makes it an invaluable platform for studying human-AI interaction, stress-testing behavioral models in real-time, and developing explainable AI systems that can be tuned with surgical precision without the need for black-box neural network training."
    },
    {
        title: "V. The Growth Roadmap",
        text: "Launching a concept this complex requires a 4-phase strategic roadmap. Phase One: The Foundation—establishing the performant Three JS rendering and Mamdani engine you see here. Phase Two: The Behavioral Library—expanding our rule database from simple combat into social interactions and contextual economies. Phase Three: Integration Tooling—releasing the logic dashboard as a plugin for major game engines, allowing other developers to 'fuzzify' their worlds. Finally, Phase Four: Market Scale—deploying a full-scale commercial title that proves 'Fuzzy AI' is the new gold standard for believable digital inhabitants."
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
    handleLog("Initiating high-impact market pitch narration...", "info");

    for (let i = 0; i < NARRATION_SCRIPT.length; i++) {
        if (!isNarrating) break;
        setCurrentChapter(i);
        // Use 'Puck' for a high-energy, persuasive corporate pitch voice
        const buffer = await generateSpeech(NARRATION_SCRIPT[i].text, 'Puck');
        if (!buffer) continue;

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

      {/* Cinematic Pitch Subtitles */}
      {isNarrating && currentChapter >= 0 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[70] w-full max-w-4xl px-8 pointer-events-none">
            <div className="bg-zinc-950/95 border border-cyan-500/40 backdrop-blur-3xl p-10 rounded-[3rem] shadow-[0_0_120px_rgba(6,182,212,0.15)] text-center animate-fadeIn border-t-cyan-400">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                    <h3 className="text-cyan-400 text-[11px] font-black uppercase tracking-[0.6em] text-left">Product Vision // {NARRATION_SCRIPT[currentChapter].title}</h3>
                  </div>
                  <div className="bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 text-zinc-500 text-[10px] font-mono tracking-widest">{currentChapter + 1} / {NARRATION_SCRIPT.length}</div>
                </div>
                <p className="text-zinc-100 text-2xl font-semibold leading-relaxed italic drop-shadow-xl text-balance">
                    "{NARRATION_SCRIPT[currentChapter].text}"
                </p>
                <div className="mt-8 flex flex-col items-center gap-4">
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500 shadow-[0_0_20px_cyan]" style={{ width: `${((currentChapter + 1) / NARRATION_SCRIPT.length) * 100}%` }} />
                    </div>
                    <div className="flex gap-2 h-6 items-center">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="w-1.5 bg-cyan-500/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100 + 30}%` }} />
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
              className={`font-black text-[11px] px-10 py-4 rounded-2xl uppercase tracking-[0.25em] shadow-2xl border transition-all backdrop-blur-3xl flex items-center gap-4 group ${isNarrating ? 'bg-cyan-600 text-white border-cyan-300 shadow-cyan-500/30' : 'bg-zinc-900/95 text-zinc-400 hover:text-white border-zinc-800'}`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${isNarrating ? 'bg-white' : 'bg-zinc-700 group-hover:bg-cyan-500'}`}>
                {isNarrating ? <div className="w-2 h-2 bg-cyan-600 rounded-sm" /> : <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-1" />}
              </div>
              {isNarrating ? 'Terminate Pitch' : 'Initiate Market Pitch'}
            </button>

            {gameStarted && !gameOverState.isOver && (
              <button
                onClick={() => setGameActive(!gameActive)}
                className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-bold text-[10px] px-4 py-4 rounded-2xl uppercase tracking-widest shadow-xl border border-zinc-800 transition-all backdrop-blur-xl"
              >
                {gameActive ? 'Pause' : 'Resume'}
              </button>
            )}
            {gameStarted && (
              <button
                onClick={handleReset}
                className="bg-rose-950/40 hover:bg-rose-900 text-zinc-100 font-bold text-[10px] px-4 py-4 rounded-2xl uppercase tracking-widest shadow-xl border border-rose-900/50 transition-all backdrop-blur-xl"
              >
                Restart
              </button>
            )}
            <button 
              onClick={() => setIsDashboardVisible(!isDashboardVisible)}
              className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-bold text-[10px] px-4 py-4 rounded-2xl uppercase tracking-widest shadow-xl border border-zinc-800 transition-all backdrop-blur-xl"
            >
              {isDashboardVisible ? 'Hide Matrix' : 'Show Matrix'}
            </button>

            <div className="bg-zinc-900/90 border border-zinc-800 px-6 py-3 rounded-2xl flex items-center gap-4 backdrop-blur-xl shadow-xl">
                <span className="text-amber-400 font-bold text-sm tracking-widest uppercase">GOLD: {playerState.gold}</span>
                <button 
                  onClick={() => setPlayerState(p => ({ ...p, gold: p.gold + 1000 }))}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/30 transition-colors pointer-events-auto"
                >
                  +1k
                </button>
            </div>
            
            <button 
              onClick={() => setShowLogicModal(true)}
              className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-[10px] px-6 py-4 rounded-2xl uppercase tracking-widest shadow-xl border border-zinc-800 transition-all backdrop-blur-xl"
            >
              Logic Dashboard
            </button>
         </div>
      </div>

      {showShop && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-4">
           <div className="bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-12 max-w-xl w-full shadow-2xl">
              <div className="flex justify-between items-center mb-10 border-b border-zinc-800 pb-10">
                 <div>
                    <h2 className="text-4xl font-black text-amber-500 italic uppercase tracking-tighter">Imperial Cache</h2>
                    <p className="text-[12px] text-zinc-500 tracking-widest uppercase mt-3 font-bold">Loyalty Membership: {currentDiscount.toFixed(1)}% Contextual Discount</p>
                 </div>
                 <button onClick={() => setShowShop(false)} className="text-zinc-600 hover:text-white text-5xl transition-colors">&times;</button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10 bg-zinc-950/50 p-8 rounded-[2.5rem] border border-zinc-800">
                  <div className={`flex flex-col items-center transition-all duration-300 ${highlightStat === 'hp' ? 'text-emerald-400 scale-105' : 'text-zinc-400'}`}>
                      <span className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-2">Hero Vitality</span>
                      <span className="text-3xl font-black">{Math.floor(playerState.hp)} <span className="text-sm font-bold text-zinc-600">/ {playerState.maxHp}</span></span>
                  </div>
                  <div className={`flex flex-col items-center transition-all duration-300 ${highlightStat === 'dmg' ? 'text-emerald-400 scale-105' : 'text-zinc-400'}`}>
                      <span className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-2">Casting Potency</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black">{(20 * playerState.damageMultiplier).toFixed(0)}</span>
                        <span className="text-[12px] font-bold opacity-50">({(playerState.damageMultiplier * 100).toFixed(0)}%)</span>
                      </div>
                  </div>
              </div>

              <div className="space-y-5">
                 <button onClick={() => buyItem('hp')} className="w-full bg-zinc-950/50 p-6 rounded-3xl flex justify-between items-center border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 transition-all group">
                    <div className="text-left">
                        <h3 className="font-bold text-zinc-100 uppercase text-sm tracking-widest group-hover:text-amber-400 transition-colors">Vitality Draught</h3>
                        <p className="text-[11px] text-zinc-500 mt-2 font-medium">Restores 40 Health Points. Membership active.</p>
                    </div>
                    <span className="bg-amber-600 text-black px-6 py-2.5 rounded-xl text-[12px] font-black min-w-[80px] text-center">{Math.floor(100 * (1 - currentDiscount / 100))}g</span>
                 </button>
                 <button onClick={() => buyItem('str')} className="w-full bg-zinc-950/50 p-6 rounded-3xl flex justify-between items-center border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 transition-all group">
                    <div className="text-left">
                        <h3 className="font-bold text-zinc-100 uppercase text-sm tracking-widest group-hover:text-blue-400 transition-colors">Strength Elixir</h3>
                        <p className="text-[11px] text-zinc-500 mt-2 font-medium">+20% Passive Magic Potency permanent.</p>
                    </div>
                    <span className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[12px] font-black min-w-[80px] text-center">{Math.floor(250 * (1 - currentDiscount / 100))}g</span>
                 </button>
                 <button onClick={() => buyItem('dmg')} className="w-full bg-zinc-950/50 p-6 rounded-3xl flex justify-between items-center border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all group">
                    <div className="text-left">
                        <h3 className="font-bold text-zinc-100 uppercase text-sm tracking-widest group-hover:text-emerald-400 transition-colors">Ring of Power</h3>
                        <p className="text-[11px] text-zinc-500 mt-2 font-medium">+25% Critical Mana Output permanent.</p>
                    </div>
                    <span className="bg-emerald-600 text-black px-6 py-2.5 rounded-xl text-[12px] font-black min-w-[80px] text-center">{Math.floor(300 * (1 - currentDiscount / 100))}g</span>
                 </button>
              </div>

              <div className="mt-12 pt-10 border-t border-zinc-800 flex justify-between items-center text-[12px] text-zinc-500 font-bold uppercase">
                 <span className="bg-zinc-950 px-5 py-2.5 rounded-full border border-zinc-800/50 text-amber-500 tracking-wider">WALLET: {playerState.gold}g</span>
                 <button onClick={() => setShowShop(false)} className="text-zinc-400 hover:text-white hover:underline transition-all tracking-widest">End Transaction</button>
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
            <h1 className="text-[12rem] font-black text-white/5 tracking-[0.25em] uppercase italic select-none">
              HALTED
            </h1>
            <p className="text-zinc-700 text-sm uppercase tracking-[1.5em] font-black mt-4">
              NEURAL STREAM PAUSED
            </p>
          </div>
        </div>
      )}

      {(!gameStarted || gameOverState.isOver) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-2xl p-6">
          <div className="text-center p-20 border border-zinc-800 bg-zinc-900/40 rounded-[4rem] shadow-[0_0_150px_rgba(0,0,0,0.6)] max-w-3xl w-full border-t-zinc-700/50">
            <h1 className="text-8xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-cyan-500 to-emerald-600 tracking-tighter italic uppercase drop-shadow-2xl">
              {gameOverState.isOver ? (gameOverState.won ? "GLORY" : "CRITICAL FAILURE") : "FUZZY GUARDIAN"}
            </h1>
            <p className="text-zinc-500 mb-16 text-sm uppercase tracking-[0.8em] font-black leading-relaxed">
              MAMDANI INFERENCE RPG // KEYNOTE PITCH BUILD v1.5
            </p>
            <div className="flex flex-col gap-6">
                <button 
                  onClick={startGame}
                  className="w-full py-8 bg-white text-zinc-950 font-black text-3xl rounded-[2.5rem] hover:bg-cyan-50 hover:scale-[1.04] transition-all shadow-2xl active:scale-[0.98] uppercase tracking-[0.15em]"
                >
                  {gameOverState.isOver ? 'Relaunch Experience' : 'Initialize Presentation'}
                </button>
                <div className="flex gap-6">
                   <button 
                      onClick={() => setShowLogicModal(true)}
                      className="flex-1 py-5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold text-[11px] rounded-3xl hover:text-white hover:bg-zinc-800 transition-all uppercase tracking-widest shadow-xl"
                   >
                      System Architecture
                   </button>
                   <button 
                      onClick={startNarration}
                      className="flex-1 py-5 bg-zinc-900 border border-zinc-800 text-cyan-500 font-bold text-[11px] rounded-3xl hover:text-cyan-400 hover:bg-zinc-800 transition-all uppercase tracking-widest shadow-xl"
                   >
                      Vision Pitch
                   </button>
                </div>
            </div>
            <p className="mt-16 text-[11px] text-zinc-700 font-mono tracking-[0.5em] uppercase italic opacity-40">STRICTLY CONFIDENTIAL // PROPERTY OF FUZZY LOGIC LABS</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
