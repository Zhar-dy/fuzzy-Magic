import React from 'react';
import { FUZZY_RULES } from '../services/fuzzyLogic';

interface FuzzyTheoryModalProps {
  type: 'rules' | 'architecture';
  onClose: () => void;
}

const FuzzyTheoryModal: React.FC<FuzzyTheoryModalProps> = ({ type, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-xl font-black text-cyan-400 tracking-tighter italic uppercase">
            {type === 'rules' ? 'Logic: Knowledge Base (Rules)' : 'Fuzzy Expert System Architecture'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl font-light">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar bg-black/20">
          {type === 'rules' ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-6">
                Heuristic rules determining the Guardian's strategy:
              </p>
              <div className="space-y-2">
                {FUZZY_RULES.map((rule, idx) => (
                  <div key={idx} className="bg-gray-900/80 p-4 rounded-lg border border-gray-800 flex gap-4 items-center group hover:border-cyan-500/50 transition-all">
                    <span className="text-cyan-500 font-mono text-[10px] w-6 opacity-50 font-bold">[{idx + 1}]</span>
                    <p className="text-gray-300 font-mono text-[11px] leading-relaxed group-hover:text-cyan-100">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                  <h3 className="text-[10px] font-black text-cyan-500 uppercase mb-3 tracking-widest">1. Knowledge Base</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                    Stores the tactical rules and linguistic membership functions (Distance, HP, Magic State, and <b>Spatial Hazards</b>). 
                    Knowledge was acquired through observation of RPG player "kiting" behaviors.
                  </p>
                </section>

                <section className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                  <h3 className="text-[10px] font-black text-blue-500 uppercase mb-3 tracking-widest">2. Fuzzification</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                    Converts "Crisp" game inputs (Distance = 15m) into fuzzy values (Far = 0.8, Medium = 0.2) 
                    using Triangle and Trapezoid membership functions.
                  </p>
                </section>

                <section className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                  <h3 className="text-[10px] font-black text-purple-500 uppercase mb-3 tracking-widest">3. Inference Engine</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                    Evaluates rules using Mamdani Inference. Complex triggers like <b>"Final Stand"</b> are identified when multiple 
                    critical health premises are met simultaneously.
                  </p>
                </section>

                <section className="bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                  <h3 className="text-[10px] font-black text-yellow-500 uppercase mb-3 tracking-widest">4. Aggregation</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                    Combines the fuzzy consequences of all triggered rules using the <b>MAX</b> operator (OR) 
                    to form a single combined fuzzy set for the output.
                  </p>
                </section>
              </div>

              <section className="bg-gray-900/40 p-5 rounded-xl border border-blue-900/30 border-l-4 border-l-blue-500">
                <h3 className="text-[10px] font-black text-white uppercase mb-3 tracking-widest flex justify-between">
                  <span>5. Defuzzification</span>
                  <span className="text-blue-400 italic font-mono lowercase">[Mamdani Centroid Approximation]</span>
                </h3>
                <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                  Converts the aggregated fuzzy set back into a Crisp action value (Aggression: 0-100). 
                  High aggression forces the AI to "Close Gap" during Pressure tactics.
                </p>
              </section>

              <div className="p-4 border border-dashed border-gray-700 rounded-xl text-center">
                 <p className="text-[9px] text-gray-500 font-mono tracking-tighter uppercase">
                   SYSTEM TYPE: MAMDANI-STYLE FUZZY CONTROLLER // TRIPLE-INPUT SITUATIONAL AWARENESS
                 </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-end">
           <button 
             onClick={onClose} 
             className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
           >
              Exit Knowledge Interface
           </button>
        </div>
      </div>
    </div>
  );
};

export default FuzzyTheoryModal;