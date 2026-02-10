
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { triangle, trapezoid } from '../services/fuzzyLogic';

// Use readonly modifiers to allow compatibility with 'as const' data definitions in consumers
interface FuzzyGraphProps {
  title: string;
  currentValue: number;
  min: number;
  max: number;
  sets: readonly {
    readonly name: string;
    readonly color: string;
    readonly type: 'triangle' | 'trapezoid';
    readonly params: readonly number[];
  }[];
}

const FuzzyGraph: React.FC<FuzzyGraphProps> = ({ title, currentValue, min, max, sets }) => {
  
  // Strict clamp to ensure marker never leaves the visual container
  const clampedValue = Math.max(min, Math.min(max, currentValue));

  const data = useMemo(() => {
    const points = [];
    const steps = 60; 
    const step = (max - min) / steps; 
    for (let i = 0; i <= steps; i++) {
      const x = min + i * step;
      const point: any = { x };
      sets.forEach(set => {
        if (set.type === 'triangle') {
          point[set.name] = triangle(x, set.params[0], set.params[1], set.params[2]);
        } else {
          point[set.name] = trapezoid(x, set.params[0], set.params[1], set.params[2], set.params[3]);
        }
      });
      points.push(point);
    }
    return points;
  }, [min, max, sets]);

  return (
    <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-700 shadow-xl backdrop-blur-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-1.5 rounded border border-cyan-900/30">
          {currentValue.toFixed(1)}
        </span>
      </div>
      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 1, left: 1, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="x" 
              type="number" 
              hide 
              domain={[min, max]} 
              padding={{ left: 0, right: 0 }}
              scale="linear"
            />
            <YAxis hide domain={[0, 1.1]} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #444', fontSize: '10px' }}
                itemStyle={{ padding: 0 }}
                labelStyle={{ color: '#aaa' }}
                isAnimationActive={false}
            />
            {sets.map((set) => (
              <Area
                key={set.name}
                type="monotone"
                dataKey={set.name}
                stroke={set.color}
                fill={set.color}
                fillOpacity={0.2}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
            <ReferenceLine 
              x={clampedValue} 
              stroke="#fff" 
              strokeWidth={2} 
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center border-t border-gray-800 pt-1">
          {sets.map(s => (
              <div key={s.name} className="flex items-center gap-1">
                  <div className="w-2 h-0.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                  <span className="text-[8px] text-gray-500 font-bold uppercase">{s.name}</span>
              </div>
          ))}
      </div>
    </div>
  );
};

export default FuzzyGraph;
