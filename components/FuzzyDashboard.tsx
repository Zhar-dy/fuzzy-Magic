import React, { useMemo } from 'react';
import FuzzyGraph from './FuzzyGraph';
import { FuzzyMetrics } from '../types';

interface FuzzyDashboardProps {
  metrics: FuzzyMetrics | null;
}

const DISTANCE_SETS = [
  { name: "Close", color: "#b91c1c", type: "trapezoid", params: [-1, 0, 4, 8] },
  { name: "Medium", color: "#b45309", type: "triangle", params: [4, 10, 16] },
  { name: "Far", color: "#15803d", type: "trapezoid", params: [10, 16, 100, 100] }
] as const;

const HEALTH_SETS = [
  { name: "Critical", color: "#b91c1c", type: "trapezoid", params: [-1, 0, 30, 40] },
  { name: "Healthy", color: "#15803d", type: "trapezoid", params: [60, 80, 100, 101] }
] as const;

const AGGRESSION_SETS = [
  { name: "Passive", color: "#1e40af", type: "trapezoid", params: [-1, 0, 25, 45] },
  { name: "Neutral", color: "#6d28d9", type: "triangle", params: [30, 50, 70] },
  { name: "Hostile", color: "#b91c1c", type: "trapezoid", params: [55, 75, 100, 101] }
] as const;

const FuzzyDashboard: React.FC<FuzzyDashboardProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 bg-[#2c241b]/95 backdrop-blur-md border-2 border-yellow-700/50 p-5 flex flex-col gap-4 overflow-y-auto rounded-xl pointer-events-auto shadow-2xl font-serif">
      <div className="border-b border-yellow-800 pb-3">
        <h2 className="text-xl font-bold text-yellow-500 tracking-tight uppercase italic drop-shadow-md">Arcane Calculus</h2>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-yellow-600/70 font-bold uppercase font-sans">Tactical Stance:</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm transition-all duration-500 font-sans ${
                metrics.stateDescription === 'INTERRUPTING' ? 'bg-orange-800 text-white animate-pulse' :
                metrics.stateDescription === 'CONSERVING' ? 'bg-blue-800 text-white' :
                metrics.stateDescription === 'FINAL STAND' ? 'bg-red-900 text-white animate-pulse' :
                metrics.stateDescription === 'BERSERK' ? 'bg-purple-800 text-white' :
                'bg-yellow-800 text-white'
            }`}>
                {metrics.stateDescription}
            </span>
        </div>
      </div>

      <FuzzyGraph title="Dist: Feet" currentValue={metrics.distance} min={0} max={30} sets={[...DISTANCE_SETS]} />

      <FuzzyGraph title="Hero's Vitality" currentValue={metrics.playerHealthPct} min={0} max={100} sets={[...HEALTH_SETS]} />

      <div className="bg-[#1a120b] p-3 rounded-lg border border-yellow-900/40">
        <h3 className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-3 text-center font-sans">Behavioral State</h3>
        <div className="grid grid-cols-4 gap-2">
            {Object.entries(metrics.playerStance).map(([key, val]) => (
                <div key={key} className="flex flex-col items-center">
                    <div className="h-10 w-2.5 bg-black rounded-full relative overflow-hidden border border-yellow-900/20">
                        <div 
                            className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${val > 0.5 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-gray-800'}`} 
                            style={{ height: `${val * 100}%` }}
                        />
                    </div>
                    <span className="text-[7px] text-yellow-700 uppercase mt-1.5 font-sans font-bold">{key}</span>
                </div>
            ))}
        </div>
      </div>

      <FuzzyGraph title="Aggression Output" currentValue={metrics.aggressionOutput} min={0} max={100} sets={[...AGGRESSION_SETS]} />

      <div className="mt-auto pt-4 border-t border-yellow-900/40 text-center">
        <p className="text-[8px] text-yellow-800 uppercase tracking-[0.2em] font-sans font-black italic">Neural Web Synchronized</p>
      </div>
    </div>
  );
};

export default FuzzyDashboard;