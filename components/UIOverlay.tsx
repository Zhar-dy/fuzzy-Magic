
import React from 'react';
import { PlayerState, GameLogEntry, EnemyState } from '../types';

interface UIOverlayProps {
  player: PlayerState;
  enemies: EnemyState[];
  logs: GameLogEntry[];
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ player, enemies, logs }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Section: Player Status & Controls */}
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-3 max-w-xs pointer-events-auto">
          <div className="bg-black/80 border border-blue-500/50 p-4 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-blue-400 font-black text-[10px] tracking-[0.2em] uppercase">Operator Status</h2>
            </div>
            
            {/* HP Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] font-mono mb-1.5">
                <span className="text-blue-200/60 uppercase">Vitality</span>
                <span className="text-white font-bold">{Math.floor(player.hp)} / {player.maxHp}</span>
              </div>
              <div className="h-3 bg-gray-900 rounded-full p-0.5 border border-white/5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                  style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Mana / Magic CD Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-[10px] font-mono mb-1.5">
                <span className="text-cyan-200/60 uppercase">Buffer Link</span>
                <span className={player.magicCd > 0 ? 'text-orange-400' : 'text-cyan-400'}>
                  {player.magicCd > 0 ? 'SYNCING...' : 'READY'}
                </span>
              </div>
              <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${player.magicCd > 0 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'}`} 
                  style={{ width: `${Math.max(0, 100 - (player.magicCd/player.maxMagicCd * 100))}%` }}
                />
              </div>
            </div>

            {/* Controls Sub-Panel */}
            <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5">
              <p className="text-[9px] font-black text-white/40 mb-2 tracking-widest uppercase italic">Command Interface</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono">
                <div className="flex justify-between"><span className="text-cyan-500 font-bold">WASD</span> <span className="text-gray-500">MOVE</span></div>
                <div className="flex justify-between"><span className="text-cyan-500 font-bold">SHIFT</span> <span className="text-gray-500">DODGE</span></div>
                <div className="flex justify-between"><span className="text-cyan-500 font-bold">Q</span> <span className="text-gray-500">BLOCK</span></div>
                <div className="flex justify-between"><span className="text-cyan-500 font-bold">F</span> <span className="text-gray-500">REPAIR</span></div>
                <div className="flex justify-between"><span className="text-cyan-500 font-bold">SPACE</span> <span className="text-gray-500">STRIKE</span></div>
                <div className="flex justify-between"><span className="text-cyan-500 font-bold">E</span> <span className="text-gray-500">MAGIC</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Right: Enemy Threat Monitor */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          {enemies.length > 0 && (
             <div className="bg-black/60 border border-red-500/30 p-3 rounded-xl backdrop-blur-md">
                <h3 className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-red-500 rounded-sm animate-ping" />
                   Active Threats
                </h3>
                <div className="space-y-3">
                  {enemies.map(enemy => (
                    <div key={enemy.id} className="space-y-1">
                      <div className="flex justify-between text-[8px] font-mono text-gray-400">
                        <span className="uppercase">Guardian_ID: {enemy.id.split('_')[2]}</span>
                        <span className="text-red-400 font-bold">{Math.ceil(enemy.hp)}%</span>
                      </div>
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-red-600 transition-all duration-500"
                          style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Center: Distance Indicators (Keep existing but polish) */}
      <div className="absolute inset-0 overflow-hidden">
        {enemies.map((enemy) => {
          const dx = enemy.position.x - player.position.x;
          const dz = enemy.position.z - player.position.z;
          const dist = Math.sqrt(dx*dx + dz*dz);
          const angle = Math.atan2(dz, dx);
          if (dist < 6) return null;

          return (
            <div key={enemy.id} className="absolute top-1/2 left-1/2 pointer-events-none">
              <div 
                className="absolute w-24 h-24 flex items-center justify-center transition-all duration-300"
                style={{ transform: `rotate(${angle}rad) translate(180px)` }}
              >
                <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[10px] border-l-red-500 border-b-[4px] border-b-transparent shadow-[0_0_8px_rgba(239,68,68,1)]" />
                <div 
                  className="absolute text-[8px] text-red-400 font-black tracking-tighter ml-14 bg-black/80 px-1.5 py-0.5 rounded-sm border border-red-900/40 backdrop-blur-sm"
                  style={{ transform: `rotate(${-angle}rad)` }}
                >
                  {Math.floor(dist)}M
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Combat Logs */}
      <div className="max-w-md h-40 overflow-hidden flex flex-col justify-end pointer-events-auto">
        <div className="bg-black/60 p-3 rounded-2xl backdrop-blur-md border border-white/5 max-h-full overflow-y-auto flex flex-col-reverse custom-scrollbar">
            {logs.slice().reverse().map((log) => (
                <div key={log.id} className={`text-[10px] py-1 border-b border-white/5 last:border-0 font-mono flex gap-3 ${log.type === 'combat' ? 'text-red-300' : log.type === 'ai' ? 'text-purple-300 italic' : 'text-gray-400'}`}>
                    <span className="opacity-40 font-bold shrink-0">[{log.type.toUpperCase()}]</span>
                    <span className="leading-relaxed">{log.text}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
