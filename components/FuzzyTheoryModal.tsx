import React from 'react';
import { FUZZY_RULES } from '../services/fuzzyLogic';

interface FuzzyTheoryModalProps {
  type: 'rules' | 'architecture' | 'math';
  onClose: () => void;
}

const FuzzyTheoryModal: React.FC<FuzzyTheoryModalProps> = ({ type, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-xl font-black text-cyan-400 tracking-tighter italic uppercase">
            {type === 'rules' ? 'AI Ruleset' : type === 'math' ? 'The Math: Fuzzification to Action' : 'System Architecture'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {type === 'rules' && (
            <div className="space-y-2">
              {FUZZY_RULES.map((rule, idx) => (
                <div key={idx} className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex gap-4 items-center">
                  <span className="text-cyan-500 font-mono text-[10px] w-6 opacity-50 font-bold">[{idx + 1}]</span>
                  <p className="text-gray-300 font-mono text-[11px] leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          )}

          {type === 'math' && (
            <div className="space-y-8 font-mono">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-cyan-500 text-black px-2 py-0.5 text-[10px] font-black">STEP 1</span>
                    <h3 className="text-cyan-400 text-xs font-bold uppercase">Fuzzification (Linguistic Mapping)</h3>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                   Membership Functions translate raw data (e.g., Distance = 4.2m) into truth values (Close = 0.9, Medium = 0.1).
                </p>
                <div className="bg-black/40 p-3 border border-gray-800 rounded text-[10px] text-cyan-200">
                    <p>Triangle(x; a, b, c) = max(0, min((x-a)/(b-a), (c-x)/(c-b)))</p>
                    <p>Trapezoid(x; a, b, c, d) = max(0, min((x-a)/(b-a), 1, (d-x)/(d-c)))</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-purple-500 text-black px-2 py-0.5 text-[10px] font-black">STEP 2</span>
                    <h3 className="text-purple-400 text-xs font-bold uppercase">Inference (Mamdani Logic)</h3>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                   Rules are evaluated using the MIN operator for conjunction (AND).
                </p>
                <div className="bg-black/40 p-3 border border-gray-800 rounded text-[10px] text-purple-200">
                    <p>IF (Health IS Critical AND Distance IS Close) THEN Aggression IS Hostile</p>
                    <p className="mt-2 text-white italic">μ_Hostile = min(μ_Critical, μ_Close)</p>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-yellow-500 text-black px-2 py-0.5 text-[10px] font-black">STEP 3</span>
                    <h3 className="text-yellow-400 text-xs font-bold uppercase">Defuzzification (Centroid Calculation)</h3>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                   We use the Weighted Average of the output membership sets to get a final crisp action value (0-100).
                </p>
                <div className="bg-black/40 p-3 border border-gray-800 rounded text-[10px] text-yellow-200">
                    <p className="text-lg">Action = Σ(μ_i * c_i) / Σ(μ_i)</p>
                    <p className="mt-1 text-[8px] text-gray-500">Where μ is the firing strength and c is the center of the set.</p>
                </div>
              </section>
            </div>
          )}

          {type === 'architecture' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                    <h4 className="text-xs font-bold text-white mb-2">Input Processing</h4>
                    <p className="text-[10px] text-gray-500">Coordinates, HP, and cooldowns are polled at 60Hz and sanitized before inference.</p>
                 </div>
                 <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
                    <h4 className="text-xs font-bold text-white mb-2">NPC Shop Logic</h4>
                    <p className="text-[10px] text-gray-500">Secondary fuzzy controller manages pricing based on total spent and current player vitality.</p>
                 </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
           <button onClick={() => type !== 'rules' && onClose()} className="px-4 py-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">Back</button>
           <button onClick={onClose} className="px-6 py-2 bg-cyan-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Understood</button>
        </div>
      </div>
    </div>
  );
};

export default FuzzyTheoryModal;