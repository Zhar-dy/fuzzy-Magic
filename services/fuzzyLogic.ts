
import { FuzzyMetrics } from '../types';

export function triangle(x: number, a: number, b: number, c: number): number {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  // Guard for division by zero (vertical slopes)
  if (x < b) return (b === a) ? 1 : (x - a) / (b - a);
  return (c === b) ? 1 : (c - x) / (c - b);
}

export function trapezoid(x: number, a: number, b: number, c: number, d: number): number {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  // Guard for division by zero (vertical slopes)
  if (x < b) return (b === a) ? 1 : (x - a) / (b - a);
  return (d === c) ? 1 : (d - x) / (d - c);
}

// --- DATA DRIVEN RULE ARCHITECTURE ---

interface FuzzyContext {
  dist: { close: number; medium: number; far: number };
  health: { critical: number; wounded: number; healthy: number };
  pHealth: { critical: number; wounded: number; healthy: number };
  energy: { empty: number; low: number; full: number };
  pMagic: { armed: number; recharging: number; spent: number };
  hazard: { inDanger: number; safe: number };
  pStance: { normal: number; defensive: number; dodging: number; healing: number };
}

interface FuzzyRule {
  id: string;
  description: string;
  type: 'aggressive' | 'neutral' | 'passive';
  evaluate: (c: FuzzyContext) => number;
}

export const FUZZY_RULES_DB: FuzzyRule[] = [
  // PRIORITY / OVERRIDE RULES
  { id: 'RECHARGE', description: "Energy Empty: Must Retreat", type: 'passive', evaluate: c => c.energy.empty },
  
  // AGGRESSIVE RULES
  { id: 'SNIPER', description: "Full Energy + Far: Sniping", type: 'aggressive', evaluate: c => Math.min(c.energy.full, c.dist.far) },
  { id: 'MELEE', description: "Low Energy + Close: Desperate Melee", type: 'aggressive', evaluate: c => Math.min(c.energy.low, c.dist.close) },
  { id: 'PRESSURE', description: "Player Healthy + Medium Dist: Apply Pressure", type: 'aggressive', evaluate: c => Math.min(c.pHealth.healthy, c.dist.medium) },
  { id: 'DESPERATION', description: "Both Critical: Final Stand", type: 'aggressive', evaluate: c => Math.min(c.health.critical, c.pHealth.critical) },
  { id: 'BERSERK', description: "Critical Health: Berserk Rage", type: 'aggressive', evaluate: c => c.health.critical },
  { id: 'PUNISH_CD', description: "Player Magic Spent: Punish Cooldown", type: 'aggressive', evaluate: c => Math.min(c.pMagic.spent, c.dist.medium) },
  { id: 'BULLY', description: "Healthy + Close: Bullying", type: 'aggressive', evaluate: c => Math.min(c.health.healthy, c.dist.close) },
  { id: 'PUNISH_HEAL', description: "Player Healing + Close: Interrupt!", type: 'aggressive', evaluate: c => Math.min(c.pStance.healing, c.dist.close) },
  { id: 'STALKING', description: "Far + Player Weak: Stalking", type: 'aggressive', evaluate: c => Math.min(c.dist.far, c.pMagic.spent) },
  { id: 'FULL_ENERGY', description: "Energy Full: Unleash Power", type: 'aggressive', evaluate: c => c.energy.full * 0.8 },
  { id: 'CONFIDENCE', description: "Healthy: Confidence", type: 'aggressive', evaluate: c => c.health.healthy },
  { id: 'SURVIVAL_INSTINCT', description: "Wounded: Survival Aggression", type: 'aggressive', evaluate: c => c.health.wounded },
  { id: 'PREDATORY', description: "Player Wounded: Predatory Instinct", type: 'aggressive', evaluate: c => Math.min(c.pHealth.wounded, c.health.healthy) },

  // PASSIVE / DEFENSIVE RULES
  { id: 'CORNERED', description: "Cornered by Hazard", type: 'passive', evaluate: c => Math.min(c.dist.close, c.hazard.inDanger) },
  { id: 'FEAR', description: "Player Armed + Close: Fear", type: 'passive', evaluate: c => Math.min(c.pMagic.armed, c.dist.close) },
  { id: 'WAIT_DODGE', description: "Player Dodging: Wait it out", type: 'passive', evaluate: c => Math.min(c.pStance.dodging, c.dist.far) },
  { id: 'FEAR_SHIELD', description: "Shield Up + Critical: Panic", type: 'passive', evaluate: c => Math.min(c.pStance.defensive, c.health.critical) },
  { id: 'SAFE_REPOS', description: "In Danger: Repositioning", type: 'passive', evaluate: c => Math.min(c.hazard.inDanger, c.health.healthy) },

  // NEUTRAL RULES
  { id: 'TACTICAL', description: "Player Defending: Tactical Wait", type: 'neutral', evaluate: c => Math.min(c.pStance.defensive, c.health.healthy) }
];

export const FUZZY_RULES = FUZZY_RULES_DB.map(r => r.description);

export class FuzzyAI {
  public distance = { close: 0, medium: 0, far: 0 };
  public health = { critical: 0, wounded: 0, healthy: 0 };
  public playerHealth = { critical: 0, wounded: 0, healthy: 0 };
  public energy = { empty: 0, low: 0, full: 0 };
  public playerMagic = { armed: 0, recharging: 0, spent: 0 };
  public hazardProximity = { inDanger: 0, safe: 0 };
  public playerStance = { normal: 0, defensive: 0, dodging: 0, healing: 0 };
  public aggressionFuzzy = { passive: 0, neutral: 0, aggressive: 0 };
  public aggression = 0;
  public state = "IDLE";
  public activeRule = "Searching...";

  evaluate(
    dist: number, 
    hpPercent: number, 
    playerHpPercent: number, 
    magicCd: number, 
    hazardDist: number, 
    energyPct: number,
    isDodging: boolean,
    isDefending: boolean,
    isHealing: boolean
  ): FuzzyMetrics {
    // 1. FUZZIFICATION
    this.distance.close = trapezoid(dist, -1, 0, 4, 8); 
    this.distance.medium = triangle(dist, 4, 10, 16);
    // Fixed: Use Infinity for Far set so it doesn't drop off after 100m
    this.distance.far = trapezoid(dist, 10, 16, Infinity, Infinity);

    this.health.critical = trapezoid(hpPercent, -1, 0, 30, 40);
    this.health.wounded = triangle(hpPercent, 30, 50, 70);
    this.health.healthy = trapezoid(hpPercent, 60, 80, 100, 101);

    this.playerHealth.critical = trapezoid(playerHpPercent, -1, 0, 30, 40);
    this.playerHealth.wounded = triangle(playerHpPercent, 30, 50, 70);
    this.playerHealth.healthy = trapezoid(playerHpPercent, 60, 80, 100, 101);

    this.energy.empty = trapezoid(energyPct, -1, 0, 10, 20);
    this.energy.low = triangle(energyPct, 15, 35, 55);
    this.energy.full = trapezoid(energyPct, 50, 70, 100, 101);

    this.playerMagic.armed = trapezoid(magicCd, -1, 0, 10, 30);
    this.playerMagic.recharging = triangle(magicCd, 20, 60, 100);
    this.playerMagic.spent = trapezoid(magicCd, 80, 110, 120, 121);

    this.hazardProximity.inDanger = trapezoid(hazardDist, -1, 0, 3, 5);
    this.hazardProximity.safe = trapezoid(hazardDist, 4, 6, 100, 100);

    this.playerStance.dodging = isDodging ? 1 : 0;
    this.playerStance.defensive = isDefending ? 1 : 0;
    this.playerStance.healing = isHealing ? 1 : 0;
    this.playerStance.normal = (!isDodging && !isDefending && !isHealing) ? 1 : 0;

    // Create Context for Rules
    const context: FuzzyContext = {
      dist: this.distance,
      health: this.health,
      pHealth: this.playerHealth,
      energy: this.energy,
      pMagic: this.playerMagic,
      hazard: this.hazardProximity,
      pStance: this.playerStance
    };

    // 2. INFERENCE (Data-Driven Iteration)
    let maxHigh = 0;
    let maxMed = 0;
    let maxLow = 0;
    
    let highestFiringStrength = -1;
    let currentBestRule = "Searching...";
    
    // Track Recharge rule specifically for override logic
    let rechargeStrength = 0;

    // --- NEW: Active Rules Collection ---
    const firingRules: { name: string; strength: number; type: string; ruleIndex: number }[] = [];

    for (let i = 0; i < FUZZY_RULES_DB.length; i++) {
      const rule = FUZZY_RULES_DB[i];
      const strength = rule.evaluate(context);
      
      if (strength > 0.01) {
          firingRules.push({ name: rule.description, strength, type: rule.type, ruleIndex: i + 1 });
      }

      // Track specific recharge rule
      if (rule.id === 'RECHARGE') {
        rechargeStrength = strength;
      }

      // Track Max for Height Method
      if (rule.type === 'aggressive') maxHigh = Math.max(maxHigh, strength);
      else if (rule.type === 'neutral') maxMed = Math.max(maxMed, strength);
      else if (rule.type === 'passive') maxLow = Math.max(maxLow, strength);

      // Track "Active Rule" for self-explanation
      if (strength > highestFiringStrength) {
        highestFiringStrength = strength;
        currentBestRule = rule.description;
      }
    }

    // Sort active rules by strength
    firingRules.sort((a, b) => b.strength - a.strength);
    
    this.activeRule = currentBestRule;

    // 3. LOGICAL OVERRIDE
    if (rechargeStrength > 0.5) {
        this.aggression = 0;
        this.state = "CONSERVING";
        this.activeRule = "Energy Critical: Forced Recharge";
        
        this.aggressionFuzzy.passive = 1;
        this.aggressionFuzzy.neutral = 0;
        this.aggressionFuzzy.aggressive = 0;
    } else {
        // 4. DEFUZZIFICATION (Height Method)
        const numerator = (maxLow * 15) + (maxMed * 50) + (maxHigh * 95);
        const denominator = maxLow + maxMed + maxHigh;

        if (denominator === 0) this.aggression = 50;
        else this.aggression = numerator / denominator;

        this.aggressionFuzzy.passive = trapezoid(this.aggression, -1, 0, 25, 45);
        this.aggressionFuzzy.neutral = triangle(this.aggression, 30, 50, 70);
        this.aggressionFuzzy.aggressive = trapezoid(this.aggression, 55, 75, 100, 101);

        // State Mapping
        if (this.aggression > 80) this.state = "RUTHLESS";
        else if (this.aggression > 55) this.state = "AGGRESSIVE";
        else if (this.aggression > 35) this.state = "TACTICAL";
        else this.state = "DEFENSIVE";
        
        // Specific State Overrides based on Active Rule Context
        if (this.activeRule.includes("Sniping")) this.state = "SNIPING";
        if (this.activeRule.includes("Interrupt")) this.state = "INTERRUPTING";
        if (this.activeRule.includes("Final Stand")) this.state = "FINAL STAND";
    }

    return {
      distance: dist, healthPct: hpPercent, playerHealthPct: playerHpPercent, playerAggro: 0, playerMagic: magicCd,
      hazardProximity: hazardDist, energyPct: energyPct, aggressionOutput: this.aggression, stateDescription: this.state,
      activeRuleDescription: this.activeRule,
      activeRules: firingRules,
      playerStance: { ...this.playerStance },
      fuzzyDist: { ...this.distance }, fuzzyHealth: { ...this.health }, fuzzyPlayerHealth: { ...this.playerHealth },
      fuzzyAggro: { calm: 0, fight: 0, spamming: 0 }, fuzzyMagic: { ...this.playerMagic },
      fuzzyHazard: { ...this.hazardProximity }, fuzzyEnergy: { ...this.energy }, fuzzyAggression: { ...this.aggressionFuzzy }
    };
  }
}

export class MerchantAI {
  evaluate(totalGoldSpent: number, playerHpPct: number): number {
    // Fixed: Use Infinity to keep VIP discount at max level for anything over 1000 spent
    const vipLevel = trapezoid(totalGoldSpent, 100, 300, Infinity, Infinity); 
    const sympathy = trapezoid(playerHpPct, -1, 0, 30, 50);

    const vipDiscount = vipLevel * 30;
    const sympathyDiscount = sympathy * 15;
    
    return Math.min(45, vipDiscount + sympathyDiscount);
  }
}
