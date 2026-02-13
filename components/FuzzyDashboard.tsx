
import React, { useState } from 'react';
import FuzzyGraph from './FuzzyGraph';
import { FuzzyMetrics } from '../types';

interface FuzzyDashboardProps {
  metrics: FuzzyMetrics | null;
  manualEnemyEnergy: number;
  setManualEnemyEnergy: (val: number) => void;
  isAutoRegen: boolean;
  setIsAutoRegen: (val: boolean) => void;
  onOpenDetails: () => void;
}

// Decision Matrix Aesthetic Palette
const DISTANCE_SETS = [
  { name: "Close", color: "#ef4444", type: "trapezoid", params: [-1, 0, 4, 8] },      // Red
  { name: "Medium", color: "#f59e0b", type: "triangle", params: [4, 10, 16] },      // Amber
  { name: "Far", color: "#14b8a6", type: "trapezoid", params: [10, 16, 100, 100] }   // Teal
] as const;

const HEALTH_SETS = [
  { name: "Critical", color: "#dc2626", type: "trapezoid", params: [-1, 0, 30, 40] }, // Crimson
  { name: "Healthy", color: "#10b981", type: "trapezoid", params: [60, 80, 100, 101] } // Emerald
] as const;

const ENERGY_SETS = [
  { name: "Empty", color: "#ef4444", type: "trapezoid", params: [-1, 0, 10, 20] },     // Red
  { name: "Low", color: "#f97316", type: "triangle", params: [15, 35, 55] },         // Orange
  { name: "Full", color: "#10b981", type: "trapezoid", params: [50, 70, 100, 101] }   // Emerald
] as const;

const AGGRESSION_SETS = [
  { name: "Passive", color: "#3b82f6", type: "trapezoid", params: [-1, 0, 25, 45] },  // Electric Blue
  { name: "Neutral", color: "#7c3aed", type: "triangle", params: [30, 50, 70] },     // Deep Purple
  { name: "Hostile", color: "#ef4444", type: "trapezoid", params: [55, 75, 100, 101] } // High Red
] as const;

const DEFAULT_METRICS: FuzzyMetrics = {
    distance: 20,
    healthPct: 100,
    playerHealthPct: 100,
    energyPct: 100,
    aggressionOutput: 0,
    stateDescription: "SEARCHING",
    activeRuleDescription: "Initializing...",
    activeRules: [],
    playerStance: { normal: 1, defensive: 0, dodging: 0, healing: 0 },
    playerAggro: 0, playerMagic: 0, hazardProximity: 0,
    fuzzyDist: { close: 0, medium: 0, far: 1 },
    fuzzyHealth: { critical: 0, wounded: 0, healthy: 1 },
    fuzzyPlayerHealth: { critical: 0, wounded: 0, healthy: 1 },
    fuzzyEnergy: { empty: 0, low: 0, full: 1 },
    fuzzyAggression: { passive: 1, neutral: 0, aggressive: 0 },
    fuzzyAggro: { calm: 1, fight: 0, spamming: 0 },
    fuzzyMagic: { armed: 0, recharging: 0, spent: 0 },
    fuzzyHazard: { inDanger: 0, safe: 1 }
};

const FuzzyDashboard: React.FC<FuzzyDashboardProps> = ({ 
    metrics, 
    manualEnemyEnergy, setManualEnemyEnergy, 
    isAutoRegen, setIsAutoRegen
}) => {
  const [activeTab, setActiveTab] = useState<'graphs' | 'pipeline'>('graphs');

  // Use default metrics if null to ensure dashboard always renders structure
  const activeMetrics = metrics || DEFAULT_METRICS;
  const isOffline = !metrics;

  return (
    <div className="h-screen w-80 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto pointer-events-auto shadow-2xl scrollbar-hide relative transition-opacity duration-500">
      {isOffline && (
        <div className="absolute inset-0 z-50 bg-zinc-950/60 backdrop-blur-[1px] flex flex-col gap-3 items-center justify-center pointer-events-none text-center p-6">
            <div className="bg-zinc-900 border border-zinc-700 px-5 py-3 rounded-xl shadow-2xl">
                <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest animate-pulse block">Awaiting Signal...</span>
            </div>
            <div className="bg-black/40 border border-white/5 px-3 py-2 rounded-lg backdrop-blur-md">
                 <p className="text-[9px] text-zinc-400 font-mono leading-relaxed">
                   NO HOSTILE SIGNATURES DETECTED<br/>
                   <span className="text-zinc-600">NEURAL LINK STANDBY</span>
                 </p>
            </div>
        </div>
      )}

      {/* DEBUG CONTROL PANEL */}
      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-700 space-y-3">
          <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">Debug Override</h3>
          
          <div className="flex justify-between items-center">
             <label className="text-[10px] text-zinc-400 uppercase font-bold">Auto Regen</label>
             <input 
                type="checkbox" 
                checked={isAutoRegen} 
                onChange={(e) => setIsAutoRegen(e.target.checked)}
                className="accent-cyan-500 cursor-pointer"
             />
          </div>

          <div className="space-y-1">
             <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>ENERGY LVL</span>
                <span className={isAutoRegen ? 'opacity-50' : 'text-cyan-400'}>{manualEnemyEnergy}%</span>
             </div>
             <input 
                type="range" 
                min="0" max="100" 
                value={manualEnemyEnergy}
                onChange={(e) => !isAutoRegen && setManualEnemyEnergy(parseInt(e.target.value))}
                disabled={isAutoRegen}
                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${isAutoRegen ? 'bg-zinc-800' : 'bg-cyan-900'}`}
                style={{ opacity: isAutoRegen ? 0.3 : 1 }}
             />
          </div>
      </div>

      <div className="border-b border-zinc-800 pb-5">
        <h2 className="text-lg font-black text-white tracking-widest uppercase italic bg-gradient-to-r from-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          Fuzzy RPG
        </h2>
        <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">System State:</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm transition-all duration-500 ${
                activeMetrics.stateDescription === 'INTERRUPTING' ? 'bg-orange-500 text-black animate-pulse' :
                activeMetrics.stateDescription === 'CONSERVING' ? 'bg-blue-600 text-white' :
                activeMetrics.stateDescription === 'FINAL STAND' ? 'bg-red-600 text-white animate-pulse' :
                activeMetrics.stateDescription === 'BERSERK' ? 'bg-purple-600 text-white' :
                'bg-zinc-800 text-zinc-300'
            }`}>
                {activeMetrics.stateDescription}
            </span>
        </div>
        
        {/* TABS */}
        <div className="flex bg-zinc-900/50 p-1 rounded-lg mt-4 border border-zinc-800">
          <button 
             onClick={() => setActiveTab('graphs')}
             className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'graphs' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
             Metrics
          </button>
          <button 
             onClick={() => setActiveTab('pipeline')}
             className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'pipeline' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
             Logic
          </button>
        </div>
      </div>

      {activeTab === 'graphs' ? (
        <div className="space-y-4 animate-fadeIn">
            <FuzzyGraph 
                title="Proximity (Feet)" 
                info="Input: Distance to Player. < 8ft triggers 'Close' logic."
                currentValue={activeMetrics.distance} 
                min={0} max={30} 
                sets={[...DISTANCE_SETS]} 
            />

            <FuzzyGraph 
                title="Vessel Vitality" 
                info="Input: AI Health %. < 30% triggers 'Critical' survival."
                currentValue={activeMetrics.playerHealthPct} 
                min={0} max={100} 
                sets={[...HEALTH_SETS]} 
            />
            
            <FuzzyGraph 
                title="Core Energy" 
                info="Input: Stamina. Low energy forces 'Passive' recharge."
                currentValue={activeMetrics.energyPct} 
                min={0} max={100} 
                sets={[...ENERGY_SETS]} 
            />

            <FuzzyGraph 
                title="Aggression Vector" 
                info="Output: Final aggression score. >55 attacks."
                currentValue={activeMetrics.aggressionOutput} 
                min={0} max={100} 
                sets={[...AGGRESSION_SETS]} 
            />

            <div className="bg-[#0f1115] p-4 rounded-xl border border-zinc-800 shadow-inner">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Tactical Stance</h3>
            <div className="grid grid-cols-4 gap-3">
                {Object.entries(activeMetrics.playerStance).map(([key, val]: [string, number]) => (
                    <div key={key} className="flex flex-col items-center">
                        <div className="h-12 w-2.5 bg-zinc-950 rounded-full relative overflow-hidden border border-zinc-800">
                            <div 
                                className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${val > 0.5 ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]' : 'bg-zinc-900'}`} 
                                style={{ height: `${val * 100}%` }}
                            />
                        </div>
                        <span className="text-[7px] text-zinc-600 uppercase mt-2 font-black">{key}</span>
                    </div>
                ))}
            </div>
            </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn relative pb-4">
            {/* Connection Line */}
            <div className="absolute left-3 top-4 bottom-4 w-px bg-zinc-800 z-0" />
            
            {/* Step 1: Inputs */}
            <div className="relative z-10 pl-8">
                 <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-900 border border-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                 </div>
                 <h3 className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-2">01. Crisp Input</h3>
                 <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: 'Dist', val: activeMetrics.distance.toFixed(1) + 'm' },
                        { label: 'Energy', val: activeMetrics.energyPct.toFixed(0) + '%' },
                        { label: 'HP', val: activeMetrics.healthPct.toFixed(0) + '%' },
                    ].map((item, i) => (
                        <div key={i} className="bg-zinc-900 border border-zinc-800 p-2 rounded text-center">
                            <div className="text-[8px] text-zinc-500 font-bold uppercase">{item.label}</div>
                            <div className="text-[10px] text-zinc-200 font-mono">{item.val}</div>
                        </div>
                    ))}
                 </div>
            </div>

            {/* Step 2: Fuzzification */}
            <div className="relative z-10 pl-8">
                 <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-900 border border-purple-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                 </div>
                 <h3 className="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-2">02. Fuzzification</h3>
                 <div className="space-y-2">
                    <div className="bg-zinc-900 border border-zinc-800 p-2 rounded">
                        <div className="flex justify-between text-[8px] text-zinc-500 font-bold uppercase mb-1">
                            <span>Distance Membership</span>
                        </div>
                        <div className="flex gap-1 h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full transition-all" style={{ width: `${activeMetrics.fuzzyDist.close * 33}%`, opacity: activeMetrics.fuzzyDist.close || 0.1 }} />
                            <div className="bg-amber-500 h-full transition-all" style={{ width: `${activeMetrics.fuzzyDist.medium * 33}%`, opacity: activeMetrics.fuzzyDist.medium || 0.1 }} />
                            <div className="bg-teal-500 h-full transition-all" style={{ width: `${activeMetrics.fuzzyDist.far * 33}%`, opacity: activeMetrics.fuzzyDist.far || 0.1 }} />
                        </div>
                        <div className="flex justify-between text-[7px] text-zinc-600 font-mono mt-1">
                            <span>C: {activeMetrics.fuzzyDist.close.toFixed(1)}</span>
                            <span>M: {activeMetrics.fuzzyDist.medium.toFixed(1)}</span>
                            <span>F: {activeMetrics.fuzzyDist.far.toFixed(1)}</span>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Step 3: Inference */}
            <div className="relative z-10 pl-8">
                 <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-900 border border-emerald-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                 </div>
                 <h3 className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-2">03. Inference</h3>
                 <div className="bg-zinc-900 border border-zinc-800 rounded p-2 min-h-[80px] max-h-[160px] overflow-y-auto custom-scrollbar">
                    {activeMetrics.activeRules.length > 0 ? (
                        activeMetrics.activeRules.map((rule, i) => (
                            <div key={i} className={`text-[9px] mb-1.5 pb-1.5 border-b border-zinc-800/50 last:border-0 last:mb-0 last:pb-0 ${i === 0 ? 'text-white' : 'text-zinc-500'}`}>
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-bold">Rule {rule.ruleIndex}</span>
                                    <span className={`px-1 rounded text-[7px] font-bold uppercase ${
                                        rule.type === 'aggressive' ? 'bg-red-900/30 text-red-500' :
                                        rule.type === 'passive' ? 'bg-blue-900/30 text-blue-500' : 'bg-purple-900/30 text-purple-500'
                                    }`}>{rule.type}</span>
                                </div>
                                <div className="text-[8px] opacity-80 truncate">{rule.name}</div>
                                <div className="text-[7px] font-mono text-zinc-600 mt-0.5">Strength: {rule.strength.toFixed(2)}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-[8px] text-zinc-600 italic text-center py-4">No dominant rules firing</div>
                    )}
                 </div>
            </div>

            {/* Step 4: Defuzzification */}
            <div className="relative z-10 pl-8">
                 <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-900 border border-amber-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                 </div>
                 <h3 className="text-[9px] text-amber-400 font-black uppercase tracking-widest mb-2">04. Defuzzification</h3>
                 <div className="bg-zinc-900 border border-zinc-800 p-2 rounded">
                    <div className="relative h-6 bg-zinc-950 rounded border border-zinc-800 mb-2 overflow-hidden flex">
                        <div className="bg-blue-500/30 flex-1 h-full border-r border-zinc-800/20" />
                        <div className="bg-purple-500/30 flex-1 h-full border-r border-zinc-800/20" />
                        <div className="bg-red-500/30 flex-1 h-full" />
                        {/* Centroid */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10 shadow-[0_0_8px_white]" style={{ left: `${activeMetrics.aggressionOutput}%` }} />
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-[7px] text-zinc-500 uppercase font-bold">Aggression</div>
                            <div className="text-sm font-mono text-white leading-none">{activeMetrics.aggressionOutput.toFixed(1)}</div>
                        </div>
                        <div className="text-right">
                             <div className="text-[7px] text-zinc-500 uppercase font-bold">State</div>
                             <div className={`text-[9px] font-black uppercase ${
                                 activeMetrics.stateDescription === 'RUTHLESS' ? 'text-red-500' : 
                                 activeMetrics.stateDescription === 'CONSERVING' ? 'text-blue-500' : 'text-zinc-300'
                             }`}>{activeMetrics.stateDescription}</div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-zinc-800 text-center">
        <p className="text-[8px] text-zinc-600 uppercase tracking-[0.3em] font-black italic">Mamdani Engine Active</p>
      </div>
    </div>
  );
};

export default FuzzyDashboard;
