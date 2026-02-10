export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  position: Vector3;
  hp: number;
  maxHp: number;
  magicCd: number;
  maxMagicCd: number;
  recentAttacks: number;
  isAttacking: boolean;
}

export interface EnemyState {
  position: Vector3;
  hp: number;
  maxHp: number;
  color: string;
}

export interface FuzzyMetrics {
  distance: number;
  healthPct: number;
  playerHealthPct: number;
  playerAggro: number;
  playerMagic: number;
  hazardProximity: number;
  aggressionOutput: number;
  stateDescription: string;
  fuzzyDist: { close: number; medium: number; far: number };
  fuzzyHealth: { critical: number; wounded: number; healthy: number };
  fuzzyPlayerHealth: { critical: number; wounded: number; healthy: number };
  fuzzyAggro: { calm: number; fight: number; spamming: number };
  fuzzyMagic: { armed: number; recharging: number; spent: number };
  fuzzyHazard: { inDanger: number; safe: number };
  fuzzyAggression: { passive: number; neutral: number; aggressive: number };
}

export interface GameLogEntry {
  id: string;
  text: string;
  type: 'info' | 'combat' | 'ai';
}