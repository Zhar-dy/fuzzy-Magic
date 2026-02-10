import React from 'react';
import FuzzyGraph from './FuzzyGraph';
import { FuzzyMetrics, EnemyState } from '../types';

interface FuzzyDashboardProps {
  metrics: FuzzyMetrics | null;
  enemy: EnemyState;
}

const FuzzyDashboard: React.FC<FuzzyDashboardProps> = ({ metrics, enemy }) => {
  if (!metrics) return null;

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 bg-black/80 backdrop-blur-md border-l border-gray-700 p-4 flex flex-col gap-4 overflow-y-auto rounded-xl pointer-events-auto">
      <div className="border-b border-gray-600 pb-2">
        <h2 className="text-xl font-bold text-white tracking-tighter uppercase italic">Fuzzy AI Brain</h2>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Decision State:</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded shadow-sm transition-colors duration-500 ${
                metrics.stateDescription === 'FINAL STAND' ? 'bg-indigo-600 text-white animate-pulse' :
                metrics.stateDescription === 'CORNERED' ? 'bg-gray-600 text-white' :
                metrics.stateDescription === 'BERSERK' ? 'bg-purple-600 text-white animate-pulse' :
                metrics.stateDescription === 'RUTHLESS' ? 'bg-red-600 text-white' :
                metrics.stateDescription === 'AGGRESSIVE' ? 'bg-orange-600 text-white' :
                metrics.stateDescription === 'CAUTIOUS' ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'
            }`}>
                {metrics.stateDescription}
            </span>
        </div>
      </div>

      <FuzzyGraph 
        title="Input: Distance" 
        currentValue={metrics.distance} 
        min={0} 
        max={30}
        sets={[
            { name: "Close", color: "#ef4444", type: "trapezoid", params: [-1, 0, 4, 8] },
            { name: "Medium", color: "#f59e0b", type: "triangle", params: [4, 10, 16] },
            { name: "Far", color: "#10b981", type: "trapezoid", params: [10, 16, 100, 100] }
        ]}
      />

      <FuzzyGraph 
        title="Input: Player HP %" 
        currentValue={metrics.playerHealthPct} 
        min={0} 
        max={100}
        sets={[
            { name: "Critical", color: "#ef4444", type: "trapezoid", params: [-1, 0, 30, 40] },
            { name: "Wounded", color: "#f59e0b", type: "triangle", params: [30, 50, 70] },
            { name: "Healthy", color: "#10b981", type: "trapezoid", params: [60, 80, 100, 101] }
        ]}
      />

      <FuzzyGraph 
        title="Input: Hazard Dist" 
        currentValue={metrics.hazardProximity} 
        min={0} 
        max={15}
        sets={[
            { name: "InDanger", color: "#ef4444", type: "trapezoid", params: [-1, 0, 3, 5] },
            { name: "Safe", color: "#10b981", type: "trapezoid", params: [4, 6, 100, 100] }
        ]}
      />

      <FuzzyGraph 
        title="Output: Aggression" 
        currentValue={metrics.aggressionOutput} 
        min={0} 
        max={100}
        sets={[
            { name: "Passive", color: "#3b82f6", type: "trapezoid", params: [-1, 0, 25, 45] },
            { name: "Neutral", color: "#8b5cf6", type: "triangle", params: [30, 50, 70] },
            { name: "Hostile", color: "#ef4444", type: "trapezoid", params: [55, 75, 100, 101] }
        ]}
      />

      <div className="mt-auto pt-4 border-t border-gray-800">
        <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold tracking-widest">
            <span>Decision Core v2.0</span>
            <span className="text-cyan-500 animate-pulse text-[8px]">● Live Feed</span>
        </div>
      </div>
    </div>
  );
};

export default FuzzyDashboard;