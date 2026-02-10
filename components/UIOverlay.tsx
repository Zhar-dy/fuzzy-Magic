import React from 'react';
import { PlayerState, GameLogEntry, EnemyState } from '../types';

interface UIOverlayProps {
  player: PlayerState;
  enemies: EnemyState[];
  logs: GameLogEntry[];
}

const Minimap: React.FC<{ player: PlayerState, enemies: EnemyState[] }> = ({ player, enemies }) => {
  const mapSize = 140;
  const radius = mapSize / 2;
  const scale = radius / 40; // 40m range

  return (
    <div className="relative pointer-events-auto group">
      <div 
        className="rounded-2xl bg-zinc-950/90 border border-zinc-800 shadow-2xl backdrop-blur-xl relative overflow-hidden"
        style={{ width: mapSize, height: mapSize }}
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        
        {/* Player Pointer */}
        <div 
          className="absolute w-3 h-3 bg-cyan-500 rounded-full border-2 border-white z-20 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
          style={{ top: radius - 6, left: radius - 6 }}
        />

        {/* Enemies */}
        {enemies.map(enemy => {
          const relX = (enemy.position.x - player.position.x) * scale;
          const relY = (enemy.position.z - player.position.z) * scale;
          const distSq = relX * relX + relY * relY;
          const maxDistSq = (radius - 8) ** 2;
          
          let drawX = relX;
          let drawY = relY;
          
          if (distSq > maxDistSq) {
              const angle = Math.atan2(relY, relX);
              drawX = Math.cos(angle) * (radius - 8);
              drawY = Math.sin(angle) * (radius - 8);
          }

          return (
            <div 
              key={enemy.id}
              className="absolute w-2.5 h-2.5 bg-rose-500 rounded-full border border-black z-10 transition-all duration-300 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              style={{ top: radius + drawY - 5, left: radius + drawX - 5 }}
            />
          );
        })}

        {/* Merchant/Sanctuary */}
        {(() => {
           const relX = (0 - player.position.x) * scale;
           const relY = (0 - player.position.z) * scale;
           const distSq = relX * relX + relY * relY;
           const maxDistSq = (radius - 8) ** 2;
           let drawX = relX; let drawY = relY;
           if (distSq > maxDistSq) {
              const angle = Math.atan2(relY, relX);
              drawX = Math.cos(angle) * (radius - 8);
              drawY = Math.sin(angle) * (radius - 8);
           }
           return (
            <div 
              className="absolute w-3 h-3 bg-amber-500 rounded-sm rotate-45 border border-black z-15 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ top: radius + drawY - 6, left: radius + drawX - 6 }}
            />
           );
        })()}
      </div>
      <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest text-right mt-2 mr-1">Scanning...</div>
    </div>
  );
};

export const UIOverlay: React.FC<UIOverlayProps> = ({ player, enemies, logs }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between font-sans">
      <div />

      {/* Right Side UI: Aligned to bottom-right to avoid Dashboard toggle */}
      <div className="flex justify-end items-end w-full h-full gap-8">
        
        {/* Logs: Centered-Right */}
        <div className="max-w-sm w-full h-56 flex flex-col justify-end pointer-events-auto">
            <div className="bg-zinc-950/80 p-5 rounded-3xl backdrop-blur-xl border border-zinc-800 max-h-full overflow-y-auto flex flex-col-reverse custom-scrollbar shadow-2xl">
                {logs.slice().reverse().map((log) => (
                    <div key={log.id} className={`text-[11px] py-2 border-b border-zinc-800/20 last:border-0 leading-relaxed font-medium ${log.type === 'combat' ? 'text-rose-400 font-bold' : log.type === 'ai' ? 'text-emerald-400 italic opacity-80' : 'text-zinc-300'}`}>
                        <span className="opacity-40 uppercase text-[8px] mr-2 font-black tracking-widest">[{log.type}]</span>
                        <span>{log.text}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Hero Status: Bottom-Right */}
        <div className="flex flex-col gap-6 items-end pointer-events-auto">
          
          <div className="bg-zinc-950/90 border border-zinc-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl w-72">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
              <h2 className="text-zinc-100 font-black text-xs tracking-widest uppercase italic">Interface Status</h2>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between text-[10px] font-bold mb-2 uppercase text-zinc-500">
                <span>Vitality Check</span>
                <span className="text-zinc-100">{Math.floor(player.hp)}%</span>
              </div>
              <div className="h-4 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 rounded-md shadow-inner ${player.hp > 30 ? 'bg-gradient-to-r from-emerald-600 to-cyan-500' : 'bg-rose-600'}`} 
                  style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-[10px] font-bold mb-2 uppercase text-zinc-500">
                <span>Mana Integration</span>
                <span className={player.magicCd > 0 ? 'text-amber-500' : 'text-cyan-400'}>
                  {player.magicCd > 0 ? 'CALIBRATING' : 'READY'}
                </span>
              </div>
              <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div 
                  className={`h-full transition-all duration-300 ${player.magicCd > 0 ? 'bg-amber-600' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'}`} 
                  style={{ width: `${Math.max(0, 100 - (player.magicCd/player.maxMagicCd * 100))}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 space-y-2 text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex justify-between"><span>WASD</span> <span className="text-zinc-400">MOVE</span></div>
                <div className="flex justify-between"><span>SHIFT</span> <span className="text-zinc-400">DASH</span></div>
                <div className="flex justify-between"><span>Q</span> <span className="text-zinc-400">GUARD</span></div>
                <div className="flex justify-between"><span>F</span> <span className="text-zinc-400">MEND</span></div>
                <div className="flex justify-between"><span>SPACE</span> <span className="text-zinc-400">STRIKE</span></div>
                <div className="flex justify-between"><span>E</span> <span className="text-zinc-400">SPELL</span></div>
              </div>
            </div>
          </div>

          <Minimap player={player} enemies={enemies} />
        </div>
      </div>
    </div>
  );
};
