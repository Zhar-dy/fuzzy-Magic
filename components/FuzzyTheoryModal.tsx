
import React from 'react';
import { FUZZY_RULES_DB } from '../services/fuzzyLogic';

interface FuzzyTheoryModalProps {
  onClose: () => void;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">
    {children}
  </h3>
);

const FuzzyTheoryModal: React.FC<FuzzyTheoryModalProps> = ({ onClose }) => {
  const aggressiveRules = FUZZY_RULES_DB.filter(r => r.type === 'aggressive');
  const passiveRules = FUZZY_RULES_DB.filter(r => r.type === 'passive');
  const neutralRules = FUZZY_RULES_DB.filter(r => r.type === 'neutral');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
      <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
              Logic Dashboard <span className="text-zinc-600 text-sm not-italic ml-2">// SYSTEM ARCHITECTURE</span>
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white text-2xl transition-colors">&times;</button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar bg-zinc-900/40 space-y-12">
          
          {/* I. Pipeline Explanation */}
          <section>
             <SectionTitle>I. The Fuzzy Inference Pipeline</SectionTitle>
             <div className="space-y-12">
                
                {/* Step 1: Crisp Input */}
                <div className="relative pl-8 border-l-2 border-zinc-800">
                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-zinc-900" />
                   <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Step 1: Crisp Input</h4>
                   <p className="text-xs text-zinc-400 mb-4 font-mono max-w-2xl">
                     The system receives raw numerical data from game sensors. These are exact, "crisp" values (e.g., distance in meters, health in percentage).
                   </p>
                   <div className="flex gap-4">
                      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col items-center min-w-[120px]">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold">Distance</span>
                          <span className="text-2xl font-black text-white">6.5<span className="text-sm text-zinc-600 font-normal">m</span></span>
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col items-center min-w-[120px]">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold">Health</span>
                          <span className="text-2xl font-black text-white">45<span className="text-sm text-zinc-600 font-normal">%</span></span>
                      </div>
                   </div>
                </div>

                {/* Step 2: Fuzzification */}
                <div className="relative pl-8 border-l-2 border-zinc-800">
                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-500 border-4 border-zinc-900" />
                   <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">Step 2: Fuzzification</h4>
                   <p className="text-xs text-zinc-400 mb-4 font-mono max-w-2xl">
                     Crisp inputs are mapped to linguistic fuzzy sets (e.g., "Close", "Medium"). A single input can belong to multiple sets to varying degrees (0.0 to 1.0).
                   </p>
                   
                   {/* Visualization */}
                   <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden max-w-2xl">
                        <div className="absolute top-2 right-4 text-[10px] font-mono text-zinc-600">INPUT: DISTANCE = 6.5m</div>
                        <svg viewBox="0 0 400 120" className="w-full h-auto">
                            {/* Grid Lines */}
                            <line x1="0" y1="100" x2="400" y2="100" stroke="#333" strokeWidth="1" />
                            <line x1="0" y1="20" x2="400" y2="20" stroke="#333" strokeWidth="1" strokeDasharray="4 4" />
                            <text x="5" y="15" fill="#666" fontSize="10" fontFamily="monospace">1.0</text>
                            
                            {/* Sets: Close (Red Trapezoid) 0-4-8 */}
                            {/* Mapping 0-20m to 0-400px. 1m = 20px */}
                            {/* Close: -1,0 to 4,8. 4m=80px, 8m=160px */}
                            <path d="M0,100 L0,20 L80,20 L160,100" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="2" />
                            <text x="40" y="115" fill="#ef4444" fontSize="10" fontWeight="bold">CLOSE</text>

                            {/* Medium (Amber Triangle) 4-10-16. 80px - 200px - 320px */}
                            <path d="M80,100 L200,20 L320,100" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="2" />
                            <text x="200" y="115" fill="#f59e0b" fontSize="10" fontWeight="bold" textAnchor="middle">MEDIUM</text>

                            {/* Input Line at 6.5m -> 130px */}
                            <line x1="130" y1="100" x2="130" y2="10" stroke="#fff" strokeWidth="2" strokeDasharray="4 2" />
                            
                            {/* Intersection Points */}
                            {/* At 6.5m (130px): Close (80-160) & Medium (80-200) overlap */}
                            <circle cx="130" cy="50" r="4" fill="#ef4444" />
                            <text x="140" y="50" fill="#ef4444" fontSize="10" fontWeight="bold">0.35</text>

                            <circle cx="130" cy="70" r="4" fill="#f59e0b" />
                            <text x="140" y="70" fill="#f59e0b" fontSize="10" fontWeight="bold">0.45</text>
                        </svg>
                   </div>
                </div>

                {/* Step 3: Inference */}
                <div className="relative pl-8 border-l-2 border-zinc-800">
                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-zinc-900" />
                   <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">Step 3: Inference Engine</h4>
                   <p className="text-xs text-zinc-400 mb-4 font-mono max-w-2xl">
                     Rules are evaluated using fuzzy logic operators. The "AND" operator uses the MINIMUM value of its inputs to determine the firing strength of the rule.
                   </p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                          <div className="text-[10px] text-zinc-500 font-bold mb-2 uppercase">Rule A (Aggressive)</div>
                          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                             <div className="text-center">
                                <div className="text-red-500 font-bold">Close</div>
                                <div>0.35</div>
                             </div>
                             <div className="text-zinc-600 font-bold">AND</div>
                             <div className="text-center">
                                <div className="text-emerald-500 font-bold">Healthy</div>
                                <div>0.80</div>
                             </div>
                             <div className="text-zinc-400">→</div>
                             <div className="text-center bg-zinc-900 p-2 rounded border border-zinc-800">
                                <div className="text-red-400 font-bold">ATTACK</div>
                                <div className="text-emerald-400 font-bold">MIN = 0.35</div>
                             </div>
                          </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                          <div className="text-[10px] text-zinc-500 font-bold mb-2 uppercase">Rule B (Neutral)</div>
                          <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                             <div className="text-center">
                                <div className="text-amber-500 font-bold">Medium</div>
                                <div>0.45</div>
                             </div>
                             <div className="text-zinc-600 font-bold">AND</div>
                             <div className="text-center">
                                <div className="text-emerald-500 font-bold">Healthy</div>
                                <div>0.80</div>
                             </div>
                             <div className="text-zinc-400">→</div>
                             <div className="text-center bg-zinc-900 p-2 rounded border border-zinc-800">
                                <div className="text-purple-400 font-bold">TACTICAL</div>
                                <div className="text-emerald-400 font-bold">MIN = 0.45</div>
                             </div>
                          </div>
                      </div>
                   </div>
                </div>

                {/* Step 4: Defuzzification */}
                <div className="relative pl-8 border-l-2 border-zinc-800">
                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500 border-4 border-zinc-900" />
                   <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-2">Step 4: Defuzzification (Centroid)</h4>
                   <p className="text-xs text-zinc-400 mb-4 font-mono max-w-2xl">
                     The firing strengths are aggregated using the "Height Method". This calculates the center of gravity of the outputs to produce a final crisp aggression score.
                   </p>
                   
                   <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 max-w-2xl">
                      <div className="flex items-end gap-2 mb-4">
                         <div className="text-3xl font-black text-white">41.8</div>
                         <div className="text-xs text-zinc-500 font-bold uppercase mb-1">Final Score</div>
                      </div>
                      
                      {/* Visual Calculation */}
                      <div className="w-full h-8 bg-zinc-900 rounded border border-zinc-800 relative mb-2">
                          {/* Centroid Marker */}
                          <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]" style={{ left: '41.8%' }} />
                          {/* Contributing Weights Visual */}
                          <div className="absolute top-2 bottom-2 left-[15%] w-2 bg-blue-500/50 rounded-full" />
                          <div className="absolute top-2 bottom-2 left-[50%] w-2 bg-purple-500/50 rounded-full" />
                          <div className="absolute top-2 bottom-2 left-[95%] w-2 bg-red-500/50 rounded-full" />
                      </div>
                      
                      <div className="text-[10px] font-mono text-zinc-500 flex justify-between px-1">
                          <span>Passive (15)</span>
                          <span>Neutral (50)</span>
                          <span>Aggressive (95)</span>
                      </div>
                      
                      <div className="mt-4 p-3 bg-zinc-900 rounded border border-zinc-800 text-[10px] font-mono text-zinc-400">
                          Formula: <span className="text-zinc-300">(0.35 * 95 + 0.45 * 50) / (0.35 + 0.45) = 41.8</span>
                          <br/>
                          <span className="text-emerald-400 mt-1 block">Result: TACTICAL BEHAVIOR</span>
                      </div>
                   </div>
                </div>

             </div>
          </section>

          {/* II. Ruleset */}
          <section>
            <SectionTitle>II. Complete Rule Database</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-red-900/30 pb-2">Aggressive Rules ({aggressiveRules.length})</h4>
                {aggressiveRules.map(r => (
                  <div key={r.id} className="bg-red-900/5 border border-red-900/20 p-2 rounded hover:bg-red-900/10 transition-colors">
                    <div className="text-[9px] font-bold text-red-400">{r.id}</div>
                    <div className="text-[8px] text-zinc-500 font-mono">{r.description}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-900/30 pb-2">Passive Rules ({passiveRules.length})</h4>
                {passiveRules.map(r => (
                  <div key={r.id} className="bg-blue-900/5 border border-blue-900/20 p-2 rounded hover:bg-blue-900/10 transition-colors">
                    <div className="text-[9px] font-bold text-blue-400">{r.id}</div>
                    <div className="text-[8px] text-zinc-500 font-mono">{r.description}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest border-b border-purple-900/30 pb-2">Neutral Rules ({neutralRules.length})</h4>
                {neutralRules.map(r => (
                  <div key={r.id} className="bg-purple-900/5 border border-purple-900/20 p-2 rounded hover:bg-purple-900/10 transition-colors">
                    <div className="text-[9px] font-bold text-purple-400">{r.id}</div>
                    <div className="text-[8px] text-zinc-500 font-mono">{r.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
        
        <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
           <button onClick={onClose} className="px-8 py-3 bg-zinc-100 text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Close Architecture</button>
        </div>
      </div>
    </div>
  );
};

export default FuzzyTheoryModal;
