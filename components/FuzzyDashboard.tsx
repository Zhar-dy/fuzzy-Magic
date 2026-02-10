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
        <h2 className="text-xl font-bold text-white tracking-tighter">FUZZY AI BRAIN</h2>
        <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Decision State:</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded shadow-sm transition-colors duration-500 ${
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
        title="Input: Enemy HP %" 
        currentValue={metrics.healthPct} 
        min={0} 
        max={100}
        sets={[
            { name: "Critical", color: "#ef4444", type: "trapezoid", params: [-1, 0, 30, 40] },
            { name: "Wounded", color: "#f59e0b", type: "triangle", params: [30, 50, 70] },
            { name: "Healthy", color: "#10b981", type: "trapezoid", params: [60, 80, 100, 101] }
        ]}
      />

      <FuzzyGraph 
        title="Input: Player Magic" 
        currentValue={metrics.playerMagic} 
        min={0} 
        max={120}
        sets={[
            { name: "Armed", color: "#22c55e", type: "trapezoid", params: [-1, 0, 10, 30] },
            { name: "Recharging", color: "#eab308", type: "triangle", params: [20, 60, 100] },
            { name: "Spent", color: "#ef4444", type: "trapezoid", params: [80, 110, 120, 121] }
        ]}
      />

      <FuzzyGraph 
        title="Output: Aggression Score" 
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
            <span>Decision Core</span>
            <span className="text-cyan-500 animate-pulse text-[8px]">● Live Feed</span>
        </div>
      </div>
    </div>
  );
};

export default FuzzyDashboard;