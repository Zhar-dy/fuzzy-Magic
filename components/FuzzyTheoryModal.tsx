
import React from 'react';
import { FUZZY_RULES_DB } from '../services/fuzzyLogic';

interface FuzzyTheoryModalProps {
  onClose: () => void;
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">
    {children}
  </h3>
);

const SubSection: React.FC<{ title: string, color: string, children: React.ReactNode }> = ({ title, color, children }) => (
  <div className="mb-4">
    <h4 className={`text-[10px] font-bold ${color} uppercase tracking-wider mb-2`}>{title}</h4>
    <div className="text-[10px] text-zinc-400 font-mono leading-relaxed space-y-2">
      {children}
    </div>
  </div>
);

const FuzzyTheoryModal: React.FC<FuzzyTheoryModalProps> = ({ onClose }) => {
  const aggressiveRules = FUZZY_RULES_DB.filter(r => r.type === 'aggressive');
  const passiveRules = FUZZY_RULES_DB.filter(r => r.type === 'passive');
  const neutralRules = FUZZY_RULES_DB.filter(r => r.type === 'neutral');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
      <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
              Logic Dashboard <span className="text-zinc-600 text-sm not-italic ml-2">// SYSTEM BLUEPRINT</span>
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white text-2xl transition-colors">&times;</button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar bg-zinc-900/40 space-y-12">
          
          {/* I. Variables & Membership */}
          <section>
            <SectionTitle>I. Fuzzy Variables & Membership Functions</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800">
                <SubSection title="System Inputs (Sensors)" color="text-zinc-300">
                  <p><span className="text-cyan-400">Distance:</span> Cartesian distance between Entity and Player (0-100m).</p>
                  <p><span className="text-cyan-400">Health:</span> Current HP percentage of the Entity (0-100%).</p>
                  <p><span className="text-cyan-400">Energy:</span> Stamina resource for attacks (0-100%).</p>
                  <p><span className="text-cyan-400">Player Stance:</span> Discrete boolean states (Dodging, Defending, Healing).</p>
                </SubSection>
              </div>
              <div className="bg-zinc-950/50 p-5 rounded-xl border border-zinc-800">
                <SubSection title="Membership Functions" color="text-zinc-300">
                  <p className="mb-2">
                    <span className="text-purple-400">Triangle(x, a, b, c):</span> Linear interpolation. 
                    Used for 'middle' states like <span className="italic">Medium Distance</span> or <span className="italic">Wounded</span>. 
                    Peaks at <span className="font-bold">b</span>.
                  </p>
                  <p>
                    <span className="text-purple-400">Trapezoid(x, a, b, c, d):</span> Plateau shape. 
                    Used for boundaries like <span className="italic">Close Range</span> or <span className="italic">Full Health</span>. 
                    Stays at 1.0 between <span className="font-bold">b</span> and <span className="font-bold">c</span>.
                  </p>
                </SubSection>
              </div>
            </div>
          </section>

          {/* II. Ruleset */}
          <section>
            <SectionTitle>II. Rule Knowledge Base</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-red-900/30 pb-2">Aggressive ({aggressiveRules.length})</h4>
                {aggressiveRules.map(r => (
                  <div key={r.id} className="bg-red-900/10 border border-red-900/20 p-2 rounded">
                    <div className="text-[9px] font-bold text-red-400">{r.id}</div>
                    <div className="text-[9px] text-zinc-500 font-mono">{r.description}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-900/30 pb-2">Passive ({passiveRules.length})</h4>
                {passiveRules.map(r => (
                  <div key={r.id} className="bg-blue-900/10 border border-blue-900/20 p-2 rounded">
                    <div className="text-[9px] font-bold text-blue-400">{r.id}</div>
                    <div className="text-[9px] text-zinc-500 font-mono">{r.description}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest border-b border-purple-900/30 pb-2">Neutral ({neutralRules.length})</h4>
                {neutralRules.map(r => (
                  <div key={r.id} className="bg-purple-900/10 border border-purple-900/20 p-2 rounded">
                    <div className="text-[9px] font-bold text-purple-400">{r.id}</div>
                    <div className="text-[9px] text-zinc-500 font-mono">{r.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* III. Pipeline */}
          <section>
             <SectionTitle>III. Mamdani Inference Pipeline</SectionTitle>
             <div className="relative border-l-2 border-zinc-800 ml-3 pl-8 space-y-8 py-2">
                <div className="relative">
                   <div className="absolute -left-[39px] top-0 w-5 h-5 bg-zinc-900 border-2 border-blue-500 rounded-full flex items-center justify-center">
                     <span className="text-[8px] font-bold text-blue-500">1</span>
                   </div>
                   <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Fuzzification</h4>
                   <p className="text-[10px] text-zinc-400 font-mono">
                     Crisp sensor values are mapped to linguistic degrees (0.0 to 1.0) using the membership functions. 
                     <br/><span className="text-zinc-600">Example: Distance 6m might be 0.5 'Close' and 0.5 'Medium'.</span>
                   </p>
                </div>

                <div className="relative">
                   <div className="absolute -left-[39px] top-0 w-5 h-5 bg-zinc-900 border-2 border-purple-500 rounded-full flex items-center justify-center">
                     <span className="text-[8px] font-bold text-purple-500">2</span>
                   </div>
                   <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Inference Engine</h4>
                   <p className="text-[10px] text-zinc-400 font-mono">
                     The system evaluates every rule in the DB. The firing strength is determined by the <span className="text-purple-300">MIN</span> operator (AND logic).
                     <br/><span className="text-zinc-600">Rule: IF Close AND Low Energy THEN Melee. Strength = MIN(Close_Degree, Energy_Low_Degree).</span>
                   </p>
                </div>

                <div className="relative">
                   <div className="absolute -left-[39px] top-0 w-5 h-5 bg-zinc-900 border-2 border-emerald-500 rounded-full flex items-center justify-center">
                     <span className="text-[8px] font-bold text-emerald-500">3</span>
                   </div>
                   <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Defuzzification</h4>
                   <p className="text-[10px] text-zinc-400 font-mono">
                     We aggregate the firing strengths using the <span className="text-emerald-300">Height Method</span> (Weighted Average).
                     <br/>
                     <span className="block mt-2 p-2 bg-zinc-950 rounded border border-zinc-800">
                        Aggression = (Σ Rule_Strength * Output_Singleton) / Σ Rule_Strength
                     </span>
                     <br/>
                     Output Singletons: Passive(15), Neutral(50), Aggressive(95).
                   </p>
                </div>
             </div>
          </section>

          {/* IV. App Behavior */}
          <section>
            <SectionTitle>IV. Behavior State Machine</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[10px] font-mono">
               <div className="bg-zinc-950 p-4 border-t-2 border-blue-500 rounded-b-xl">
                  <div className="font-bold text-blue-500 mb-1">DEFENSIVE / CONSERVING</div>
                  <div className="text-zinc-500">Aggression Score &lt; 35</div>
                  <div className="mt-2 text-zinc-300">Retreats from player. Regenerates energy faster. Avoids engagement.</div>
               </div>
               <div className="bg-zinc-950 p-4 border-t-2 border-zinc-500 rounded-b-xl">
                  <div className="font-bold text-zinc-400 mb-1">TACTICAL</div>
                  <div className="text-zinc-500">Score 35 - 55</div>
                  <div className="mt-2 text-zinc-300">Maintains medium distance. Circles player. Waits for openings.</div>
               </div>
               <div className="bg-zinc-950 p-4 border-t-2 border-orange-500 rounded-b-xl">
                  <div className="font-bold text-orange-500 mb-1">AGGRESSIVE</div>
                  <div className="text-zinc-500">Score 55 - 80</div>
                  <div className="mt-2 text-zinc-300">Chases player. Initiates attacks when in range. Standard speed.</div>
               </div>
               <div className="bg-zinc-950 p-4 border-t-2 border-red-600 rounded-b-xl">
                  <div className="font-bold text-red-500 mb-1">RUTHLESS / BERSERK</div>
                  <div className="text-zinc-500">Score &gt; 80</div>
                  <div className="mt-2 text-zinc-300">High speed pursuit. Ignores safety. Relentless attack frequency.</div>
               </div>
            </div>
          </section>

        </div>
        
        <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
           <button onClick={onClose} className="px-8 py-3 bg-zinc-100 text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Close Blueprint</button>
        </div>
      </div>
    </div>
  );
};

export default FuzzyTheoryModal;
