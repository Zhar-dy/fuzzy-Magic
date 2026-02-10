import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { triangle, trapezoid } from '../services/fuzzyLogic';

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
  const clampedValue = Math.max(min, Math.min(max, currentValue));

  const data = useMemo(() => {
    const points = [];
    const steps = 40; 
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
    <div className="bg-[#0f1115] p-4 rounded-xl border border-zinc-800 shadow-xl">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{title}</h3>
        <div className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-sm border border-cyan-900/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
          {currentValue.toFixed(1)}
        </div>
      </div>
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#18181b" vertical={false} />
            <XAxis 
              dataKey="x" 
              type="number" 
              hide 
              domain={[min, max]} 
              padding={{ left: 0, right: 0 }}
            />
            <YAxis hide domain={[0, 1.1]} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', fontSize: '9px', borderRadius: '4px' }}
                itemStyle={{ padding: 0 }}
                labelStyle={{ color: '#71717a' }}
                isAnimationActive={false}
            />
            {sets.map((set) => (
              <Area
                key={set.name}
                type="monotone"
                dataKey={set.name}
                stroke={set.color}
                fill={set.color}
                fillOpacity={0.05}
                strokeWidth={3}
                isAnimationActive={false}
              />
            ))}
            <ReferenceLine 
              x={clampedValue} 
              stroke="#ffffff" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 justify-start border-t border-zinc-800 pt-2">
          {sets.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">{s.name}</span>
              </div>
          ))}
      </div>
    </div>
  );
};

export default FuzzyGraph;
