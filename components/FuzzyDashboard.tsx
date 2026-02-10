import React from 'react';
import FuzzyGraph from './FuzzyGraph';
import { FuzzyMetrics } from '../types';

interface FuzzyDashboardProps {
  metrics: FuzzyMetrics | null;
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
  { name: "Empty", color: "#ef4444", type: "trapezoid", params: [-1, 0, 10, 25] },     // Red
  { name: "Low", color: "#f97316", type: "triangle", params: [15, 35, 55] },         // Orange
  { name: "Full", color: "#10b981", type: "trapezoid", params: [45, 75, 100, 101] }   // Emerald
] as const;

const AGGRESSION_SETS = [
  { name: "Passive", color: "#3b82f6", type: "trapezoid", params: [-1, 0, 25, 45] },  // Electric Blue
  { name: "Neutral", color: "#7c3aed", type: "triangle", params: [30, 50, 70] },     // Deep Purple
  { name: "Hostile", color: "#ef4444", type: "trapezoid", params: [55, 75, 100, 101] } // High Red
] as const;

const FuzzyDashboard: React.FC<FuzzyDashboardProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="h-screen w-80 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto pointer-events-auto shadow-2xl scrollbar-hide">
      <div className="border-b border-zinc-800 pb-5">
        <h2 className="text-lg font-black text-white tracking-widest uppercase italic bg-gradient-to-r from-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          Decision Matrix
        </h2>
        <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">System State:</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm transition-all duration-500 ${
                metrics.stateDescription === 'INTERRUPTING' ? 'bg-orange-500 text-black animate-pulse' :
                metrics.stateDescription === 'CONSERVING' ? 'bg-blue-600 text-white' :
                metrics.stateDescription === 'FINAL STAND' ? 'bg-red-600 text-white animate-pulse' :
                metrics.stateDescription === 'BERSERK' ? 'bg-purple-600 text-white' :
                'bg-zinc-800 text-zinc-300'
            }`}>
                {metrics.stateDescription}
            </span>
        </div>
      </div>

      <div className="space-y-4">
        <FuzzyGraph title="Proximity (Feet)" currentValue={metrics.distance} min={0} max={30} sets={[...DISTANCE_SETS]} />

        <FuzzyGraph title="Vessel Vitality" currentValue={metrics.playerHealthPct} min={0} max={100} sets={[...HEALTH_SETS]} />
        
        <FuzzyGraph title="Core Energy" currentValue={metrics.energyPct} min={0} max={100} sets={[...ENERGY_SETS]} />

        <div className="bg-[#0f1115] p-4 rounded-xl border border-zinc-800 shadow-inner">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Tactical Stance</h3>
          <div className="grid grid-cols-4 gap-3">
              {Object.entries(metrics.playerStance).map(([key, val]) => (
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

        {/* Fix typo: AGGGRESSION_SETS -> AGGRESSION_SETS */}
        <FuzzyGraph title="Aggression Vector" currentValue={metrics.aggressionOutput} min={0} max={100} sets={[...AGGRESSION_SETS]} />
      </div>

      <div className="mt-auto pt-6 border-t border-zinc-800 text-center">
        <p className="text-[8px] text-zinc-600 uppercase tracking-[0.3em] font-black italic">Mamdani Engine Active</p>
      </div>
    </div>
  );
};

export default FuzzyDashboard;