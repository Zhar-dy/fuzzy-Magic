
import React from 'react';
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
    isAutoRegen, setIsAutoRegen,
    onOpenDetails
}) => {
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

        <button 
            onClick={onOpenDetails}
            className="w-full mt-4 bg-zinc-900 hover:bg-zinc-800 text-cyan-400 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg border border-cyan-900/30 transition-all flex items-center justify-center gap-2 group shadow-lg"
        >
            <span>Live Logic Pipeline</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      <div className="space-y-4">
        <FuzzyGraph 
            title="Proximity (Feet)" 
            info="Input: Distance to Player. < 8ft triggers 'Close' set logic (Melee)."
            currentValue={activeMetrics.distance} 
            min={0} max={30} 
            sets={[...DISTANCE_SETS]} 
        />

        <FuzzyGraph 
            title="Vessel Vitality" 
            info="Input: AI Health %. Drops below 30% activate 'Critical' survival rules."
            currentValue={activeMetrics.playerHealthPct} 
            min={0} max={100} 
            sets={[...HEALTH_SETS]} 
        />
        
        <FuzzyGraph 
            title="Core Energy" 
            info="Input: Stamina. Low energy forces 'Passive' state to recharge."
            currentValue={activeMetrics.energyPct} 
            min={0} max={100} 
            sets={[...ENERGY_SETS]} 
        />

        <FuzzyGraph 
            title="Aggression Vector" 
            info="Output: Final aggression score (0-100). >55 initiates attack sequences."
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

      <div className="mt-auto pt-6 border-t border-zinc-800 text-center">
        <p className="text-[8px] text-zinc-600 uppercase tracking-[0.3em] font-black italic">Mamdani Engine Active</p>
      </div>
    </div>
  );
};

export default FuzzyDashboard;
