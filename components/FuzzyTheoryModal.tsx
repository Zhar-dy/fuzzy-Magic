import React from 'react';
import { FUZZY_RULES } from '../services/fuzzyLogic';

interface FuzzyTheoryModalProps {
  type: 'rules' | 'architecture' | 'math';
  onClose: () => void;
}

const FuzzyTheoryModal: React.FC<FuzzyTheoryModalProps> = ({ type, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
            {type === 'rules' ? 'Logic Ruleset' : type === 'math' ? 'The Fuzzy Pipeline' : 'System Architecture'}
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
          {type === 'math' && (
            <div className="flex flex-col gap-8 relative">
              {/* Connecting Line */}
              <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 opacity-20 hidden md:block" />

              {/* STEP 1: INPUT */}
              <div className="relative pl-0 md:pl-16">
                 <div className="hidden md:flex absolute left-3 top-0 w-6 h-6 bg-zinc-900 border-2 border-blue-500 rounded-full items-center justify-center z-10">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                 </div>
                 <div className="bg-zinc-950/50 border border-blue-900/30 p-5 rounded-2xl">
                    <h3 className="text-blue-400 font-black text-xs uppercase tracking-widest mb-3">01. Crisp Input</h3>
                    <p className="text-[10px] text-zinc-500 mb-4">Raw sensor data from the game engine is collected. This data is precise but lacks context.</p>
                    <div className="flex gap-4">
                        <div className="bg-black/50 border border-zinc-800 p-3 rounded-lg text-center min-w-[100px]">
                            <span className="block text-[9px] text-zinc-500 uppercase font-bold">Distance</span>
                            <span className="text-xl font-mono text-white">4.2<span className="text-xs text-zinc-600">m</span></span>
                        </div>
                        <div className="bg-black/50 border border-zinc-800 p-3 rounded-lg text-center min-w-[100px]">
                            <span className="block text-[9px] text-zinc-500 uppercase font-bold">Energy</span>
                            <span className="text-xl font-mono text-white">15<span className="text-xs text-zinc-600">%</span></span>
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
                    <h3 className="text-blue-300 font-black text-xs uppercase tracking-widest mb-3">02. Fuzzification</h3>
                    <p className="text-[10px] text-zinc-500 mb-4">Inputs are mapped to overlapping linguistic curves (Sets). A single value can belong to multiple sets.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative h-16 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-end px-2 pb-2">
                             {/* Mock Graph */}
                             <div className="absolute inset-0 flex items-end opacity-20">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <polygon points="0,100 20,0 40,100" fill="#3b82f6" />
                                    <polygon points="30,100 50,0 70,100" fill="#a855f7" />
                                </svg>
                             </div>
                             <div className="w-full flex justify-between text-[9px] font-mono relative z-10">
                                 <span className="text-blue-400">Close: 0.85</span>
                                 <span className="text-purple-400">Med: 0.15</span>
                             </div>
                        </div>
                         <div className="relative h-16 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-end px-2 pb-2">
                             <div className="absolute inset-0 flex items-end opacity-20">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <polygon points="0,100 0,0 30,100" fill="#ef4444" />
                                </svg>
                             </div>
                             <div className="w-full flex justify-between text-[9px] font-mono relative z-10">
                                 <span className="text-red-400">Low Energy: 1.0</span>
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
                    <h3 className="text-purple-400 font-black text-xs uppercase tracking-widest mb-3">03. Inference Engine</h3>
                    <p className="text-[10px] text-zinc-500 mb-4">Rules are evaluated. The "Strength" of a rule is limited by its weakest input (MIN operator).</p>
                    <div className="space-y-2 font-mono text-[10px]">
                        <div className="bg-zinc-900 p-3 rounded border-l-2 border-purple-500 flex justify-between items-center opacity-50">
                            <span>IF <span className="text-blue-400">Close (0.85)</span> AND <span className="text-emerald-400">Healthy (1.0)</span> THEN <span className="text-red-500">Attack</span></span>
                            <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-400">Strength: 0.85</span>
                        </div>
                        <div className="bg-zinc-900 p-3 rounded border-l-2 border-red-500 flex justify-between items-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                             {/* Winner */}
                            <span>IF <span className="text-orange-400">Low Energy (1.0)</span> THEN <span className="text-blue-400">Retreat</span></span>
                            <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded font-bold border border-red-900/50">Strength: 1.0</span>
                        </div>
                    </div>
                 </div>
              </div>

               {/* STEP 4: DEFUZZIFICATION */}
               <div className="relative pl-0 md:pl-16">
                 <div className="hidden md:flex absolute left-3 top-0 w-6 h-6 bg-zinc-900 border-2 border-emerald-500 rounded-full items-center justify-center z-10">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                 </div>
                 <div className="bg-zinc-950/50 border border-emerald-900/30 p-5 rounded-2xl">
                    <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-3">04. Defuzzification (Output)</h3>
                    <p className="text-[10px] text-zinc-500 mb-4">All active rules contribute to the final decision. The centroid (Center of Mass) of the aggregate area determines the final action value.</p>
                    <div className="flex items-center gap-6">
                         <div className="flex-1 bg-zinc-900 h-2 rounded-full overflow-hidden flex">
                            {/* Visual representation of weighted sum */}
                            <div className="w-[20%] bg-blue-500/30"></div>
                            <div className="w-[60%] bg-red-500/10"></div>
                            <div className="w-[20%] bg-emerald-500/10"></div>
                            
                            {/* Centroid Marker */}
                            <div className="w-1 h-full bg-white relative">
                                <div className="absolute -top-1 -left-1 w-3 h-3 bg-white rounded-full"></div>
                            </div>
                         </div>
                         <div className="text-right">
                             <div className="text-[9px] text-zinc-500 uppercase font-bold">Final Aggression</div>
                             <div className="text-2xl font-black text-white">15<span className="text-sm text-zinc-600">/100</span></div>
                             <div className="text-[9px] text-blue-400 font-bold uppercase mt-1">STATE: RETREATING</div>
                         </div>
                    </div>
                 </div>
              </div>

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