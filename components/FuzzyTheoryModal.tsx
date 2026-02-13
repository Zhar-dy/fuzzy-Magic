
import React from 'react';
import { FUZZY_RULES } from '../services/fuzzyLogic';
import { FuzzyMetrics } from '../types';

interface FuzzyTheoryModalProps {
  type: 'rules' | 'architecture' | 'math';
  onClose: () => void;
  metrics: FuzzyMetrics | null;
}

const FuzzyTheoryModal: React.FC<FuzzyTheoryModalProps> = ({ type, onClose, metrics }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
            {type === 'rules' ? 'Logic Ruleset' : type === 'math' ? 'The Live Logic Pipeline' : 'System Architecture'}
          </h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-white text-3xl transition-colors">&times;</button>
        </div>
        
        <div className="p-8 overflow-y-auto custom-scrollbar bg-zinc-900/40">
          {type === 'rules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FUZZY_RULES.map((rule, idx) => (
                <div key={idx} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50 flex gap-4 items-start">
                  <span className="text-blue-500 font-mono text-[9px] w-5 opacity-50 font-black mt-0.5">[{idx + 1}]</span>
                  <p className="text-zinc-300 font-mono text-[10px] leading-relaxed tracking-tight">{rule}</p>
                </div>
              ))}
            </div>
          )}

          {/* VISUAL PIPELINE DASHBOARD */}
          {type === 'math' && metrics && (
            <div className="flex flex-col gap-8 relative">
              {/* Connecting Line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 opacity-20 hidden md:block" />

              {/* STEP 1: INPUT */}
              <div className="relative pl-0 md:pl-16">
                 <div className="hidden md:flex absolute left-3 top-0 w-6 h-6 bg-zinc-900 border-2 border-blue-500 rounded-full items-center justify-center z-10">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                 </div>
                 <div className="bg-zinc-950/50 border border-blue-900/30 p-5 rounded-2xl">
                    <h3 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-3">01. Crisp Input (Real-time Sensors)</h3>
                    <div className="flex gap-4 flex-wrap">
                        <div className="bg-black/50 border border-zinc-800 p-3 rounded-lg text-center min-w-[100px]">
                            <span className="block text-[9px] text-zinc-500 uppercase font-bold">Distance</span>
                            <span className="text-xl font-mono text-white">{metrics.distance.toFixed(1)}<span className="text-xs text-zinc-600">m</span></span>
                        </div>
                        <div className="bg-black/50 border border-zinc-800 p-3 rounded-lg text-center min-w-[100px]">
                            <span className="block text-[9px] text-zinc-500 uppercase font-bold">Energy</span>
                            <span className="text-xl font-mono text-white">{metrics.energyPct.toFixed(0)}<span className="text-xs text-zinc-600">%</span></span>
                        </div>
                         <div className="bg-black/50 border border-zinc-800 p-3 rounded-lg text-center min-w-[100px]">
                            <span className="block text-[9px] text-zinc-500 uppercase font-bold">Health</span>
                            <span className="text-xl font-mono text-white">{metrics.healthPct.toFixed(0)}<span className="text-xs text-zinc-600">%</span></span>
                        </div>
                    </div>
                 </div>
              </div>

              {/* STEP 2: FUZZIFICATION */}
              <div className="relative pl-0 md:pl-16">
                 <div className="hidden md:flex absolute left-3 top-0 w-6 h-6 bg-zinc-900 border-2 border-blue-400 rounded-full items-center justify-center z-10">
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                 </div>
                 <div className="bg-zinc-950/50 border border-blue-900/30 p-5 rounded-2xl">
                    <h3 className="text-blue-300 font-black text-xs uppercase tracking-widest mb-3">02. Fuzzification (Membership)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3">
                             <div className="text-[9px] text-zinc-500 uppercase font-bold mb-2">Distance Sets</div>
                             <div className="space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-mono">
                                    <span className="text-red-400">Close</span>
                                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${metrics.fuzzyDist.close * 100}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-zinc-300">{metrics.fuzzyDist.close.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-mono">
                                    <span className="text-amber-400">Medium</span>
                                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500" style={{ width: `${metrics.fuzzyDist.medium * 100}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-zinc-300">{metrics.fuzzyDist.medium.toFixed(2)}</span>
                                </div>
                                 <div className="flex justify-between items-center text-[9px] font-mono">
                                    <span className="text-teal-400">Far</span>
                                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500" style={{ width: `${metrics.fuzzyDist.far * 100}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-zinc-300">{metrics.fuzzyDist.far.toFixed(2)}</span>
                                </div>
                             </div>
                        </div>
                        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-3">
                             <div className="text-[9px] text-zinc-500 uppercase font-bold mb-2">Energy Sets</div>
                             <div className="space-y-1">
                                <div className="flex justify-between items-center text-[9px] font-mono">
                                    <span className="text-red-400">Empty</span>
                                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${metrics.fuzzyEnergy.empty * 100}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-zinc-300">{metrics.fuzzyEnergy.empty.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-mono">
                                    <span className="text-orange-400">Low</span>
                                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500" style={{ width: `${metrics.fuzzyEnergy.low * 100}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-zinc-300">{metrics.fuzzyEnergy.low.toFixed(2)}</span>
                                </div>
                                 <div className="flex justify-between items-center text-[9px] font-mono">
                                    <span className="text-emerald-400">Full</span>
                                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${metrics.fuzzyEnergy.full * 100}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-zinc-300">{metrics.fuzzyEnergy.full.toFixed(2)}</span>
                                </div>
                             </div>
                        </div>
                    </div>
                 </div>
              </div>

              {/* STEP 3: INFERENCE */}
              <div className="relative pl-0 md:pl-16">
                 <div className="hidden md:flex absolute left-3 top-0 w-6 h-6 bg-zinc-900 border-2 border-purple-500 rounded-full items-center justify-center z-10">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                 </div>
                 <div className="bg-zinc-950/50 border border-purple-900/30 p-5 rounded-2xl">
                    <h3 className="text-purple-400 font-black text-xs uppercase tracking-widest mb-3">03. Inference Engine (Active Rules)</h3>
                    <div className="space-y-2 font-mono text-[10px]">
                        {metrics.activeRules.map((rule, i) => (
                             <div key={i} className={`bg-zinc-900 p-3 rounded border-l-2 flex justify-between items-center transition-all ${i === 0 ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)] opacity-100' : 'border-zinc-700 opacity-60'}`}>
                                <span className={i === 0 ? 'text-white font-bold' : 'text-zinc-400'}>{rule.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                        rule.type === 'aggressive' ? 'bg-red-900/30 text-red-500' : 
                                        rule.type === 'passive' ? 'bg-blue-900/30 text-blue-500' : 'bg-purple-900/30 text-purple-500'
                                    }`}>{rule.type}</span>
                                    <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-400 min-w-[80px] text-center">Str: {rule.strength.toFixed(2)}</span>
                                </div>
                             </div>
                        ))}
                        {metrics.activeRules.length === 0 && (
                            <div className="p-4 text-center text-zinc-500 italic border border-zinc-800 border-dashed rounded-lg">
                                No specific rules firing. System defaulting to base equilibrium.
                            </div>
                        )}
                    </div>
                 </div>
              </div>

               {/* STEP 4: DEFUZZIFICATION */}
               <div className="relative pl-0 md:pl-16">
                 <div className="hidden md:flex absolute left-3 top-0 w-6 h-6 bg-zinc-900 border-2 border-emerald-500 rounded-full items-center justify-center z-10">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                 </div>
                 <div className="bg-zinc-950/50 border border-emerald-900/30 p-5 rounded-2xl">
                    <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-3">04. Defuzzification (Centroid)</h3>
                    <div className="flex items-center gap-6">
                         <div className="flex-1 bg-zinc-900 h-4 rounded-full overflow-hidden flex relative border border-zinc-800">
                            {/* Visual representation of weighted sum */}
                            <div className="h-full bg-blue-500/50 transition-all duration-300" style={{ width: `${metrics.fuzzyAggression.passive * 33}%` }}></div>
                            <div className="h-full bg-purple-500/50 transition-all duration-300" style={{ width: `${metrics.fuzzyAggression.neutral * 33}%` }}></div>
                            <div className="h-full bg-red-500/50 transition-all duration-300" style={{ width: `${metrics.fuzzyAggression.aggressive * 33}%` }}></div>
                            
                            {/* Centroid Marker */}
                            <div className="w-0.5 h-full bg-white absolute top-0 bottom-0 shadow-[0_0_10px_white] transition-all duration-300 z-10" style={{ left: `${metrics.aggressionOutput}%` }}>
                                <div className="absolute -top-1 -left-1.5 w-4 h-6 bg-white rounded-sm border-2 border-zinc-900"></div>
                            </div>
                         </div>
                         <div className="text-right min-w-[120px]">
                             <div className="text-[9px] text-zinc-500 uppercase font-bold">Aggression Score</div>
                             <div className="text-2xl font-black text-white">{metrics.aggressionOutput.toFixed(1)}</div>
                             <div className={`text-[9px] font-bold uppercase mt-1 ${
                                 metrics.stateDescription === 'BERSERK' || metrics.stateDescription === 'RUTHLESS' ? 'text-red-500 animate-pulse' : 
                                 metrics.stateDescription === 'CONSERVING' ? 'text-blue-500' : 'text-zinc-400'
                             }`}>State: {metrics.stateDescription}</div>
                         </div>
                    </div>
                 </div>
              </div>

            </div>
          )}

          {/* FALLBACK FOR OFFLINE */}
          {type === 'math' && !metrics && (
             <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <p className="text-sm font-bold uppercase tracking-widest">Pipeline Offline</p>
                <p className="text-[10px] opacity-50 mt-2">Initialize simulation to view live logic stream.</p>
             </div>
          )}

          {type === 'architecture' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                    <h4 className="text-[11px] font-black text-white uppercase mb-3 tracking-widest">State Processing</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">Mamdani Inference Engine polls sensor data at 60Hz. Fuzzy metrics are recalculated every 10 frames to optimize performance and state stability.</p>
                 </div>
                 <div className="p-6 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                    <h4 className="text-[11px] font-black text-white uppercase mb-3 tracking-widest">Dynamic Equilibrium</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">The Merchant controller operates on a secondary linguistic layer, calculating loyalty and sympathy variables for adjusted gold pricing.</p>
                 </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-4">
           <button onClick={onClose} className="px-8 py-3 bg-zinc-100 text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Dismiss</button>
        </div>
      </div>
    </div>
  );
};

export default FuzzyTheoryModal;
