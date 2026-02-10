import React from 'react';
import { PlayerState, GameLogEntry, EnemyState } from '../types';

interface UIOverlayProps {
  player: PlayerState;
  enemies: EnemyState[];
  logs: GameLogEntry[];
}

const Minimap: React.FC<{ player: PlayerState, enemies: EnemyState[] }> = ({ player, enemies }) => {
  const mapSize = 120;
  const radius = mapSize / 2;
  const scale = radius / 40; // 40m vision range

  return (
    <div className="relative pointer-events-auto">
      <div 
        className="rounded-full bg-[#1a120b]/90 border-2 border-yellow-700/60 shadow-2xl backdrop-blur-md relative overflow-hidden"
        style={{ width: mapSize, height: mapSize }}
      >
        {/* Terrain/Grid lines for flavor */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#8b5e34 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        
        {/* Player Dot */}
        <div 
          className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white z-20 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
          style={{ top: radius - 5, left: radius - 5 }}
        />

        {/* Enemies */}
        {enemies.map(enemy => {
          const relX = (enemy.position.x - player.position.x) * scale;
          const relY = (enemy.position.z - player.position.z) * scale;
          const distSq = relX * relX + relY * relY;
          const maxDistSq = (radius - 5) ** 2;
          
          let drawX = relX;
          let drawY = relY;
          
          if (distSq > maxDistSq) {
              const angle = Math.atan2(relY, relX);
              drawX = Math.cos(angle) * (radius - 5);
              drawY = Math.sin(angle) * (radius - 5);
          }

          return (
            <div 
              key={enemy.id}
              className="absolute w-2 h-2 bg-red-600 rounded-full border border-black z-10 transition-all duration-300"
              style={{ top: radius + drawY - 4, left: radius + drawX - 4 }}
            />
          );
        })}

        {/* Center of the World (Merchant) */}
        {true && (() => {
           const relX = (0 - player.position.x) * scale;
           const relY = (0 - player.position.z) * scale;
           const distSq = relX * relX + relY * relY;
           const maxDistSq = (radius - 5) ** 2;
           let drawX = relX; let drawY = relY;
           if (distSq > maxDistSq) {
              const angle = Math.atan2(relY, relX);
              drawX = Math.cos(angle) * (radius - 5);
              drawY = Math.sin(angle) * (radius - 5);
           }
           return (
            <div 
              className="absolute w-2 h-2 bg-yellow-600 rounded-sm rotate-45 border border-black z-15"
              style={{ top: radius + drawY - 4, left: radius + drawX - 4 }}
            />
           );
        })()}
      </div>
      <div className="text-[8px] text-yellow-700 font-bold uppercase tracking-widest text-center mt-1">Eye of the Oracle</div>
    </div>
  );
};

export const UIOverlay: React.FC<UIOverlayProps> = ({ player, enemies, logs }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between font-serif">
      {/* Top Section: Hero Status */}
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-3 max-w-xs pointer-events-auto">
          <div className="bg-[#2c241b]/95 border-2 border-yellow-700/40 p-5 rounded-2xl backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rotate-45 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              <h2 className="text-yellow-600 font-black text-xs tracking-[0.2em] uppercase">The Chosen One</h2>
            </div>
            
            {/* Vitality Bar */}
            <div className="mb-5">
              <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase text-yellow-800/80">
                <span>Vitality</span>
                <span className="text-yellow-900">{Math.floor(player.hp)} / {player.maxHp}</span>
              </div>
              <div className="h-4 bg-[#1a120b] rounded-sm p-0.5 border border-yellow-900/20 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-800 to-red-600 rounded-sm transition-all duration-500 shadow-inner" 
                  style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Mana Bar */}
            <div className="mb-5">
              <div className="flex justify-between text-[10px] font-bold mb-1.5 uppercase text-yellow-800/80">
                <span>Mana Reservoir</span>
                <span className={player.magicCd > 0 ? 'text-orange-700' : 'text-blue-700'}>
                  {player.magicCd > 0 ? 'CHANNELING...' : 'FULL'}
                </span>
              </div>
              <div className="h-2 bg-[#1a120b] rounded-full overflow-hidden border border-yellow-900/10">
                <div 
                  className={`h-full transition-all duration-300 ${player.magicCd > 0 ? 'bg-orange-700' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'}`} 
                  style={{ width: `${Math.max(0, 100 - (player.magicCd/player.maxMagicCd * 100))}%` }}
                />
              </div>
            </div>

            {/* Controls Panel */}
            <div className="mt-4 pt-4 border-t border-yellow-900/20 space-y-1 text-[9px] font-sans font-bold text-yellow-900/60 uppercase">
              <div className="grid grid-cols-2 gap-y-1">
                <div className="flex justify-between pr-4"><span>WASD</span> <span className="text-yellow-800/40">STEPS</span></div>
                <div className="flex justify-between"><span>SHIFT</span> <span className="text-yellow-800/40">EVADE</span></div>
                <div className="flex justify-between pr-4"><span>Q</span> <span className="text-yellow-800/40">WARD</span></div>
                <div className="flex justify-between"><span>F</span> <span className="text-yellow-800/40">PRAY</span></div>
                <div className="flex justify-between pr-4"><span>SPACE</span> <span className="text-yellow-800/40">SMITE</span></div>
                <div className="flex justify-between"><span>E</span> <span className="text-yellow-800/40">SPELL</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Right: Threat Monitor */}
        <div className="flex flex-col gap-4 items-end">
          {enemies.length > 0 && (
             <div className="bg-[#1a120b]/90 border border-red-900/40 p-4 rounded-xl backdrop-blur-lg min-w-[200px]">
                <h3 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 bg-red-800 animate-pulse rounded-full" />
                   Terrors Nearby
                </h3>
                <div className="space-y-4">
                  {enemies.map(enemy => (
                    <div key={enemy.id} className="space-y-1">
                      <div className="flex justify-between text-[8px] font-bold text-gray-500">
                        <span className="uppercase tracking-tighter">STONE_GOLEM</span>
                        <span className="text-red-800">{Math.ceil(enemy.hp)}%</span>
                      </div>
                      <div className="h-1.5 bg-black rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-900 transition-all duration-700"
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

      {/* Bottom Section: Logs & Minimap */}
      <div className="flex justify-between items-end w-full">
        <div className="max-w-md h-44 overflow-hidden flex flex-col justify-end pointer-events-auto">
            <div className="bg-[#2c241b]/80 p-4 rounded-2xl backdrop-blur-md border border-yellow-900/20 max-h-full overflow-y-auto flex flex-col-reverse custom-scrollbar">
                {logs.slice().reverse().map((log) => (
                    <div key={log.id} className={`text-[11px] py-1.5 border-b border-yellow-900/5 last:border-0 leading-tight ${log.type === 'combat' ? 'text-red-900 font-bold' : log.type === 'ai' ? 'text-yellow-900 italic opacity-80' : 'text-yellow-950 font-medium'}`}>
                        <span className="opacity-40 uppercase text-[9px] mr-2">[{log.type}]</span>
                        <span>{log.text}</span>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="pointer-events-auto">
           <Minimap player={player} enemies={enemies} />
        </div>
      </div>
    </div>
  );
};
