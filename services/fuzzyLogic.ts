import { FuzzyMetrics } from '../types';

export function triangle(x: number, a: number, b: number, c: number): number {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

export function trapezoid(x: number, a: number, b: number, c: number, d: number): number {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

export const FUZZY_RULES = [
  "IF Health IS Healthy AND Distance IS Far THEN Aggression IS Neutral (Charge/Idle)",
  "IF Health IS Healthy AND Distance IS Close THEN Aggression IS Hostile (Bully)",
  "IF Health IS Critical THEN Aggression IS Hostile (BERSERK Mode)",
  "IF PlayerMagic IS Spent AND Distance IS Medium THEN Aggression IS Hostile (Punish Cooldown)",
  "IF PlayerHP IS Healthy AND Distance IS Medium THEN Aggression IS Hostile (Pressure - Close Gap)",
  "IF Health IS Critical AND PlayerHP IS Critical THEN Aggression IS Hostile (Desperation - Final Stand)",
  "IF Distance IS Close AND NearHazard IS InDanger THEN Aggression IS Passive (Cornered - Reposition)",
  "IF PlayerMagic IS Armed AND Distance IS Close THEN Aggression IS Passive (Fear/Strafing)"
];

export class FuzzyAI {
  public distance = { close: 0, medium: 0, far: 0 };
  public health = { critical: 0, wounded: 0, healthy: 0 };
  public playerHealth = { critical: 0, wounded: 0, healthy: 0 };
  public playerAggro = { calm: 0, fight: 0, spamming: 0 };
  public playerMagic = { armed: 0, recharging: 0, spent: 0 };
  public hazardProximity = { inDanger: 0, safe: 0 };
  public aggressionFuzzy = { passive: 0, neutral: 0, aggressive: 0 };
  public aggression = 0;
  public state = "IDLE";

  evaluate(dist: number, hpPercent: number, playerHpPercent: number, attackIntensity: number, magicCd: number, hazardDist: number): FuzzyMetrics {
    // --- 1. FUZZIFICATION ---
    this.distance.close = trapezoid(dist, -1, 0, 4, 8); 
    this.distance.medium = triangle(dist, 4, 10, 16);
    this.distance.far = trapezoid(dist, 10, 16, 100, 100);

    this.health.critical = trapezoid(hpPercent, -1, 0, 30, 40);
    this.health.wounded = triangle(hpPercent, 30, 50, 70);
    this.health.healthy = trapezoid(hpPercent, 60, 80, 100, 101);

    this.playerHealth.critical = trapezoid(playerHpPercent, -1, 0, 30, 40);
    this.playerHealth.wounded = triangle(playerHpPercent, 30, 50, 70);
    this.playerHealth.healthy = trapezoid(playerHpPercent, 60, 80, 100, 101);

    this.playerAggro.calm = trapezoid(attackIntensity, -1, 0, 2, 4);
    this.playerAggro.fight = triangle(attackIntensity, 2, 5, 8);
    this.playerAggro.spamming = trapezoid(attackIntensity, 5, 8, 20, 20);

    this.playerMagic.armed = trapezoid(magicCd, -1, 0, 10, 30);
    this.playerMagic.recharging = triangle(magicCd, 20, 60, 100);
    this.playerMagic.spent = trapezoid(magicCd, 80, 110, 120, 121);

    this.hazardProximity.inDanger = trapezoid(hazardDist, -1, 0, 3, 5);
    this.hazardProximity.safe = trapezoid(hazardDist, 4, 6, 100, 100);

    // --- 2. INFERENCE ---
    const r1 = Math.min(this.health.healthy, this.distance.far); // Charge
    const r2 = Math.min(this.health.healthy, this.distance.close); // Bully
    const r4 = this.health.critical; // BERSERK
    const rTacticalCharge = Math.min(this.playerMagic.spent, this.distance.medium); // Punish cooldown
    const rTacticalFear = Math.min(this.playerMagic.armed, this.distance.close); // Be careful if player is armed

    // NEW RULES
    const rPressure = Math.min(this.playerHealth.healthy, this.distance.medium); 
    const rDesperation = Math.min(this.health.critical, this.playerHealth.critical);
    const rCornered = Math.min(this.distance.close, this.hazardProximity.inDanger);

    const highAggro = Math.max(r1, r2, r4, rTacticalCharge, rPressure, rDesperation);
    const medAggro = triangle(hpPercent, 30, 50, 70); // Base wounded logic
    const lowAggro = Math.max(rTacticalFear, rCornered);

    // --- 3. DEFUZZIFICATION ---
    const numerator = (lowAggro * 15) + (medAggro * 50) + (highAggro * 95);
    const denominator = lowAggro + medAggro + highAggro;

    if (denominator === 0) this.aggression = 50;
    else this.aggression = numerator / denominator;

    this.aggressionFuzzy.passive = trapezoid(this.aggression, -1, 0, 25, 45);
    this.aggressionFuzzy.neutral = triangle(this.aggression, 30, 50, 70);
    this.aggressionFuzzy.aggressive = trapezoid(this.aggression, 55, 75, 100, 101);

    if (this.health.critical > 0.5 && this.playerHealth.critical > 0.5) this.state = "FINAL STAND";
    else if (this.hazardProximity.inDanger > 0.8 && this.distance.close > 0.5) this.state = "CORNERED";
    else if (this.health.critical > 0.5) this.state = "BERSERK";
    else if (this.aggression > 75) this.state = "RUTHLESS";
    else if (this.aggression > 50) this.state = "AGGRESSIVE";
    else if (this.aggression > 30) this.state = "CAUTIOUS";
    else this.state = "DEFENSIVE";

    return {
      distance: dist,
      healthPct: hpPercent,
      playerHealthPct: playerHpPercent,
      playerAggro: attackIntensity,
      playerMagic: magicCd,
      hazardProximity: hazardDist,
      aggressionOutput: this.aggression,
      stateDescription: this.state,
      fuzzyDist: { ...this.distance },
      fuzzyHealth: { ...this.health },
      fuzzyPlayerHealth: { ...this.playerHealth },
      fuzzyAggro: { ...this.playerAggro },
      fuzzyMagic: { ...this.playerMagic },
      fuzzyHazard: { ...this.hazardProximity },
      fuzzyAggression: { ...this.aggressionFuzzy }
    };
  }
}