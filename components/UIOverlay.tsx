
import React from 'react';
import { PlayerState, GameLogEntry, EnemyState } from '../types';

interface UIOverlayProps {
  player: PlayerState;
  enemies: EnemyState[];
  logs: GameLogEntry[];
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ player, enemies, logs }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      <div className="flex flex-col gap-2 max-w-xs">
        <div className="bg-gray-900/80 border border-blue-500 p-3 rounded-lg backdrop-blur shadow-2xl">
          <h2 className="text-blue-400 font-bold mb-1 text-[10px]">REAWAKENED STATUS</h2>
          <div className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span>VIT</span>
              <span>{Math.floor(player.hp)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${player.hp}%` }}></div>
            </div>
          </div>
          <div className="mb-1">
            <div className="flex justify-between text-[10px] mb-1">
              <span>MAGIC [E]</span>
              <span className={player.magicCd > 0 ? 'text-orange-400' : 'text-cyan-400'}>{player.magicCd > 0 ? 'CHARGING' : 'READY'}</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-100 ${player.magicCd > 0 ? 'bg-orange-500' : 'bg-cyan-400'}`} style={{ width: `${Math.max(0, 100 - (player.magicCd/player.maxMagicCd * 100))}%` }}></div>
            </div>
          </div>
          <div className="text-[8px] text-gray-500 font-mono mt-1">POWER: x{player.damageMultiplier.toFixed(2)}</div>
        </div>
      </div>

      {/* Off-screen indicators mapping */}
      <div className="absolute inset-0 overflow-hidden">
        {enemies.map((enemy) => {
          const dx = enemy.position.x - player.position.x;
          const dz = enemy.position.z - player.position.z;
          const dist = Math.sqrt(dx*dx + dz*dz);
          const angle = Math.atan2(dz, dx);
          
          // Only show indicator if enemy is relatively far
          if (dist < 8) return null;

          return (
            <div key={enemy.id} className="absolute top-1/2 left-1/2 pointer-events-none">
              <div 
                className="absolute w-20 h-20 flex items-center justify-center transition-all duration-300"
                style={{ transform: `rotate(${angle}rad) translate(140px)` }}
              >
                <div 
                  className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[12px] border-l-red-500 border-b-[6px] border-b-transparent filter drop-shadow-[0_0_8px_rgba(239,68,68,1)]"
                  style={{ transform: `rotate(0deg)` }}
                ></div>
                <div 
                  className="absolute text-[8px] text-red-400 font-black tracking-tighter ml-12 bg-black/60 px-1 rounded border border-red-900/40"
                  style={{ transform: `rotate(${-angle}rad)` }}
                >
                  {Math.floor(dist)}m
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-md h-40 overflow-hidden flex flex-col justify-end">
        <div className="bg-black/60 p-2 rounded-lg backdrop-blur-sm border border-gray-700 max-h-full overflow-y-auto flex flex-col-reverse custom-scrollbar">
            {logs.slice().reverse().map((log) => (
                <div key={log.id} className={`text-[10px] mb-0.5 font-mono ${log.type === 'combat' ? 'text-red-300' : log.type === 'ai' ? 'text-purple-300 italic' : 'text-gray-400'}`}>
                    <span className="opacity-50">[{log.type.toUpperCase()}]</span> {log.text}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
