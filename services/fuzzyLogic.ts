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
  "IF Energy IS Empty THEN Aggression IS Passive (Recharge)",
  "IF Energy IS Full AND Distance IS Far THEN Aggression IS Hostile (Ranged Sniper)",
  "IF Energy IS Low AND Distance IS Close THEN Aggression IS Hostile (Melee Strike)",
  "IF PlayerHP IS Healthy AND Distance IS Medium THEN Aggression IS Hostile (Pressure)",
  "IF Health IS Critical AND PlayerHP IS Critical THEN Aggression IS Hostile (Final Stand)",
  "IF Distance IS Close AND NearHazard IS InDanger THEN Aggression IS Passive (Cornered)",
  "IF Health IS Critical THEN Aggression IS Hostile (Berserk)",
  "IF PlayerMagic IS Spent AND Distance IS Medium THEN Aggression IS Hostile (Punish Cooldown)",
  "IF PlayerMagic IS Armed AND Distance IS Close THEN Aggression IS Passive (Fear)",
  "IF Health IS Healthy AND Distance IS Close THEN Aggression IS Hostile (Bully)",
  "IF PlayerHP IS Wounded AND Health IS Healthy THEN Aggression IS Hostile (Predatory)",
  "IF Hazard IS InDanger AND Health IS Healthy THEN Aggression IS Passive (Safe Reposition)",
  "IF Distance IS Far AND PlayerMagic IS Spent THEN Aggression IS Hostile (Stalking)",
  "IF Distance IS Medium AND PlayerMagic IS Armed THEN Aggression IS Passive (Cautious Approach)"
];

export class FuzzyAI {
  public distance = { close: 0, medium: 0, far: 0 };
  public health = { critical: 0, wounded: 0, healthy: 0 };
  public playerHealth = { critical: 0, wounded: 0, healthy: 0 };
  public energy = { empty: 0, low: 0, full: 0 };
  public playerMagic = { armed: 0, recharging: 0, spent: 0 };
  public hazardProximity = { inDanger: 0, safe: 0 };
  public aggressionFuzzy = { passive: 0, neutral: 0, aggressive: 0 };
  public aggression = 0;
  public state = "IDLE";

  evaluate(dist: number, hpPercent: number, playerHpPercent: number, magicCd: number, hazardDist: number, energyPct: number): FuzzyMetrics {
    // 1. FUZZIFICATION
    this.distance.close = trapezoid(dist, -1, 0, 4, 8); 
    this.distance.medium = triangle(dist, 4, 10, 16);
    this.distance.far = trapezoid(dist, 10, 16, 100, 100);

    this.health.critical = trapezoid(hpPercent, -1, 0, 30, 40);
    this.health.wounded = triangle(hpPercent, 30, 50, 70);
    this.health.healthy = trapezoid(hpPercent, 60, 80, 100, 101);

    this.playerHealth.critical = trapezoid(playerHpPercent, -1, 0, 30, 40);
    this.playerHealth.wounded = triangle(playerHpPercent, 30, 50, 70);
    this.playerHealth.healthy = trapezoid(playerHpPercent, 60, 80, 100, 101);

    this.energy.empty = trapezoid(energyPct, -1, 0, 10, 25);
    this.energy.low = triangle(energyPct, 15, 35, 55);
    this.energy.full = trapezoid(energyPct, 45, 75, 100, 101);

    this.playerMagic.armed = trapezoid(magicCd, -1, 0, 10, 30);
    this.playerMagic.recharging = triangle(magicCd, 20, 60, 100);
    this.playerMagic.spent = trapezoid(magicCd, 80, 110, 120, 121);

    this.hazardProximity.inDanger = trapezoid(hazardDist, -1, 0, 3, 5);
    this.hazardProximity.safe = trapezoid(hazardDist, 4, 6, 100, 100);

    // 2. INFERENCE
    const rRecharge = this.energy.empty;
    const rSniper = Math.min(this.energy.full, this.distance.far);
    const rMelee = Math.min(this.energy.low, this.distance.close);
    const rPressure = Math.min(this.playerHealth.healthy, this.distance.medium);
    const rDesperation = Math.min(this.health.critical, this.playerHealth.critical);
    const rCornered = Math.min(this.distance.close, this.hazardProximity.inDanger);
    const rBerserk = this.health.critical;
    const rPunish = Math.min(this.playerMagic.spent, this.distance.medium);
    const rFear = Math.min(this.playerMagic.armed, this.distance.close);
    const rBully = Math.min(this.health.healthy, this.distance.close);
    
    // NEW RULES
    const rPredatory = Math.min(this.playerHealth.wounded, this.health.healthy);
    const rSafeReposition = Math.min(this.hazardProximity.inDanger, this.health.healthy);
    const rStalking = Math.min(this.distance.far, this.playerMagic.spent);
    const rCautious = Math.min(this.distance.medium, this.playerMagic.armed);

    const highAggro = Math.max(rSniper, rMelee, rPressure, rDesperation, rBerserk, rPunish, rBully, rPredatory, rStalking);
    const lowAggro = Math.max(rRecharge, rCornered, rFear, rSafeReposition, rCautious);
    const medAggro = 0.3;

    // 3. DEFUZZIFICATION
    const numerator = (lowAggro * 15) + (medAggro * 50) + (highAggro * 95);
    const denominator = lowAggro + medAggro + highAggro;

    if (denominator === 0) this.aggression = 50;
    else this.aggression = numerator / denominator;

    this.aggressionFuzzy.passive = trapezoid(this.aggression, -1, 0, 25, 45);
    this.aggressionFuzzy.neutral = triangle(this.aggression, 30, 50, 70);
    this.aggressionFuzzy.aggressive = trapezoid(this.aggression, 55, 75, 100, 101);

    if (rDesperation > 0.8) this.state = "FINAL STAND";
    else if (rCornered > 0.8) this.state = "CORNERED";
    else if (rSafeReposition > 0.8) this.state = "SAFE MOVE";
    else if (rPredatory > 0.8) this.state = "PREDATORY";
    else if (rRecharge > 0.7) this.state = "EXHAUSTED";
    else if (rBerserk > 0.8) this.state = "BERSERK";
    else if (rSniper > 0.6) this.state = "SNIPING";
    else if (this.aggression > 75) this.state = "RUTHLESS";
    else if (this.aggression > 50) this.state = "AGGRESSIVE";
    else if (this.aggression > 30) this.state = "CAUTIOUS";
    else this.state = "DEFENSIVE";

    return {
      distance: dist, healthPct: hpPercent, playerHealthPct: playerHpPercent, playerAggro: 0, playerMagic: magicCd,
      hazardProximity: hazardDist, energyPct: energyPct, aggressionOutput: this.aggression, stateDescription: this.state,
      fuzzyDist: { ...this.distance }, fuzzyHealth: { ...this.health }, fuzzyPlayerHealth: { ...this.playerHealth },
      fuzzyAggro: { calm: 0, fight: 0, spamming: 0 }, fuzzyMagic: { ...this.playerMagic },
      fuzzyHazard: { ...this.hazardProximity }, fuzzyEnergy: { ...this.energy }, fuzzyAggression: { ...this.aggressionFuzzy }
    };
  }
}

export class MerchantAI {
  evaluate(totalGoldSpent: number, playerHpPct: number): number {
    // Inputs: VIP Status (Gold spent), Sympathy (Low HP)
    const vipLevel = trapezoid(totalGoldSpent, 100, 300, 1000, 5000); // 0 to 1
    const sympathy = trapezoid(playerHpPct, -1, 0, 30, 50); // High if low HP

    // Rules
    const rVipDiscount = vipLevel; // Up to 30%
    const rSympathyDiscount = sympathy * 0.15; // Up to 15%
    
    // Aggregation (capped at 45%)
    return Math.min(45, (rVipDiscount * 30) + (rSympathyDiscount * 100));
  }
}