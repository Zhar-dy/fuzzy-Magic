import React from 'react';
import { FUZZY_RULES } from '../services/fuzzyLogic';

interface FuzzyTheoryModalProps {
  type: 'rules' | 'architecture' | 'math';
  onClose: () => void;
}

const FuzzyTheoryModal: React.FC<FuzzyTheoryModalProps> = ({ type, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
            {type === 'rules' ? 'Logic Ruleset' : type === 'math' ? 'Fuzzy Calculus' : 'System Architecture'}
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

          {type === 'math' && (
            <div className="space-y-10 font-mono">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white px-2.5 py-1 text-[9px] font-black rounded">01</span>
                    <h3 className="text-blue-400 text-xs font-black uppercase tracking-widest">Fuzzification</h3>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-2xl">
                   Translating crisp inputs (e.g., Distance = 4.2m) into linguistic truth values (Close = 0.82, Medium = 0.18).
                </p>
                <div className="bg-zinc-950 p-5 border border-zinc-800 rounded-xl text-[10px] text-blue-200/80 leading-loose shadow-inner">
                    <p>Triangle(x; a, b, c) = max(0, min((x-a)/(b-a), (c-x)/(c-b)))</p>
                    <p>Trapezoid(x; a, b, c, d) = max(0, min((x-a)/(b-a), 1, (d-x)/(d-c)))</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-purple-600 text-white px-2.5 py-1 text-[9px] font-black rounded">02</span>
                    <h3 className="text-purple-400 text-xs font-black uppercase tracking-widest">Inference Logic</h3>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-2xl">
                   Evaluating rule firing strength using the MIN operator (T-Norm) for logical conjunction.
                </p>
                <div className="bg-zinc-950 p-5 border border-zinc-800 rounded-xl text-[10px] text-purple-200/80 leading-loose shadow-inner">
                    <p>RULE: IF (Energy IS Low AND Health IS Critical) THEN Aggression IS Passive</p>
                    <p className="mt-2 text-zinc-100 italic">μ_Firing = min(μ_LowEnergy, μ_CriticalHealth)</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-emerald-600 text-white px-2.5 py-1 text-[9px] font-black rounded">03</span>
                    <h3 className="text-emerald-400 text-xs font-black uppercase tracking-widest">Defuzzification</h3>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed max-w-2xl">
                   Aggregating all active rules into a final crisp output using Weighted Average (Centroid Approximation).
                </p>
                <div className="bg-zinc-950 p-6 border border-zinc-800 rounded-xl text-[11px] text-emerald-200/80 text-center shadow-inner">
                    <p className="text-2xl font-black mb-2">Σ(μ_i * c_i) / Σ(μ_i)</p>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Aggregate Weighted Sum // Output Crisp Control</p>
                </div>
              </section>
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
