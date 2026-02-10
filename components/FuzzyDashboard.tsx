
import React from 'react';
import FuzzyGraph from './FuzzyGraph';
import { FuzzyMetrics } from '../types';

interface FuzzyDashboardProps {
  metrics: FuzzyMetrics | null;
}

const FuzzyDashboard: React.FC<FuzzyDashboardProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 bg-black/80 backdrop-blur-md border border-gray-700 p-4 flex flex-col gap-4 overflow-y-auto rounded-xl pointer-events-auto shadow-2xl">
      <div className="border-b border-gray-600 pb-2">
        <h2 className="text-xl font-bold text-white tracking-tighter uppercase italic">Decision Matrix</h2>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Tactical State:</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm transition-all duration-500 ${
                metrics.stateDescription === 'PREDATORY' ? 'bg-red-600 text-white animate-pulse' :
                metrics.stateDescription === 'SAFE MOVE' ? 'bg-blue-600 text-white' :
                metrics.stateDescription === 'FINAL STAND' ? 'bg-indigo-600 text-white animate-pulse' :
                metrics.stateDescription === 'EXHAUSTED' ? 'bg-blue-900 text-gray-300' :
                metrics.stateDescription === 'BERSERK' ? 'bg-purple-600 text-white' :
                'bg-green-600 text-white'
            }`}>
                {metrics.stateDescription}
            </span>
        </div>
      </div>

      <FuzzyGraph title="Input: Distance" currentValue={metrics.distance} min={0} max={30} sets={[
        { name: "Close", color: "#ef4444", type: "trapezoid", params: [-1, 0, 4, 8] },
        { name: "Medium", color: "#f59e0b", type: "triangle", params: [4, 10, 16] },
        { name: "Far", color: "#10b981", type: "trapezoid", params: [10, 16, 100, 100] }
      ]} />

      <FuzzyGraph title="Input: Energy %" currentValue={metrics.energyPct} min={0} max={100} sets={[
        { name: "Empty", color: "#ef4444", type: "trapezoid", params: [-1, 0, 10, 25] },
        { name: "Low", color: "#f59e0b", type: "triangle", params: [15, 35, 55] },
        { name: "Full", color: "#10b981", type: "trapezoid", params: [45, 75, 100, 101] }
      ]} />

      <FuzzyGraph title="Input: Player HP %" currentValue={metrics.playerHealthPct} min={0} max={100} sets={[
        { name: "Critical", color: "#ef4444", type: "trapezoid", params: [-1, 0, 30, 40] },
        { name: "Healthy", color: "#10b981", type: "trapezoid", params: [60, 80, 100, 101] }
      ]} />

      <FuzzyGraph title="Output: Aggression" currentValue={metrics.aggressionOutput} min={0} max={100} sets={[
        { name: "Passive", color: "#3b82f6", type: "trapezoid", params: [-1, 0, 25, 45] },
        { name: "Neutral", color: "#8b5cf6", type: "triangle", params: [30, 50, 70] },
        { name: "Hostile", color: "#ef4444", type: "trapezoid", params: [55, 75, 100, 101] }
      ]} />

      <div className="mt-auto pt-4 border-t border-gray-800 text-center">
        <p className="text-[8px] text-gray-500 uppercase tracking-widest font-mono">Fuzzy Engine Ready</p>
      </div>
    </div>
  );
};

export default FuzzyDashboard;
