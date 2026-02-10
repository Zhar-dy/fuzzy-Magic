import React from 'react';
import { PlayerState, GameLogEntry, EnemyState } from '../types';

interface UIOverlayProps {
  player: PlayerState;
  enemy: EnemyState;
  logs: GameLogEntry[];
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ player, enemy, logs }) => {
  // Calculate relative position for the locator
  const dx = enemy.position.x - player.position.x;
  const dz = enemy.position.z - player.position.z;
  const dist = Math.sqrt(dx*dx + dz*dz);
  // In 2D screen space (where Y is down):
  // X corresponds to World X
  // Y corresponds to World Z
  const angle = Math.atan2(dz, dx); // Radians

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Left: Player Stats */}
      <div className="flex flex-col gap-2 max-w-xs">
        <div className="bg-gray-900/80 border border-blue-500 p-3 rounded-lg backdrop-blur">
          <h2 className="text-blue-400 font-bold mb-1">PLAYER STATUS</h2>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span>HP</span>
              <span>{Math.floor(player.hp)} / 100</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${player.hp}%` }}
              ></div>
            </div>
          </div>
          
          <div className="mb-2">
             <div className="flex justify-between text-xs mb-1">
              <span>MAGIC (E)</span>
              <span>{player.magicCd > 0 ? 'COOLDOWN' : 'READY'}</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ${player.magicCd > 0 ? 'bg-orange-500' : 'bg-cyan-400'}`}
                style={{ width: `${Math.max(0, 100 - (player.magicCd/player.maxMagicCd * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Screen: Enemy Locator (Only visible if enemy is slightly far) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
         {/* Ring Container */}
          <div 
             className="w-32 h-32 rounded-full border border-red-500/20 flex items-center justify-center transition-opacity duration-300"
             style={{ opacity: dist > 8 ? 0.8 : 0 }} 
          >
             <div 
                className="absolute w-full h-full"
                style={{ transform: `rotate(${angle}rad)` }}
             >
                {/* The Arrow (Pushed to the right edge of the rotation container) */}
                <div className="absolute right-[-6px] top-1/2 -translate-y-1/2">
                   <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-red-500 border-b-[6px] border-b-transparent animate-pulse filter drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]"></div>
                </div>
             </div>
          </div>
          {/* Distance Text */}
          {dist > 8 && (
             <div className="absolute mt-12 text-[10px] text-red-500/80 font-mono font-bold tracking-widest bg-black/40 px-2 rounded">
                 {dist.toFixed(0)}m
             </div>
          )}
      </div>

      {/* Bottom Left: Game Log */}
      <div className="max-w-md h-48 overflow-hidden flex flex-col justify-end">
        <div className="bg-black/60 p-2 rounded-lg backdrop-blur-sm border border-gray-700 max-h-full overflow-y-auto flex flex-col-reverse">
            {logs.slice().reverse().map((log) => (
                <div key={log.id} className={`text-xs mb-1 font-mono ${
                    log.type === 'combat' ? 'text-red-300' : 
                    log.type === 'ai' ? 'text-purple-300 italic' : 'text-gray-400'
                }`}>
                    <span className="opacity-50">[{log.type.toUpperCase()}]</span> {log.text}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};