import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  Sparkles, 
  Torus, 
  Environment, 
  Float, 
  ContactShadows,
  Html,
  Grid
} from '@react-three/drei';
import * as THREE from 'three';
import { FuzzyAI } from '../services/fuzzyLogic';
import { PlayerState, EnemyState, FuzzyMetrics, Vector3 } from '../types';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends THREE.Group {}
    }
  }
}

const PLAYER_SPEED = 0.15;
const SAFE_ZONE_RADIUS = 5.5;
const MERCHANT_INTERACT_RADIUS = 3.0;
const ENEMY_STOP_DISTANCE = 2.2; 
const ENEMY_SEPARATION_STRENGTH = 0.05;

const HitEffect: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.multiplyScalar(1.1);
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.opacity *= 0.85;
      }
    }
    if (ringRef.current) {
        ringRef.current.scale.multiplyScalar(1.15);
        ringRef.current.rotation.z += 0.1;
        if (ringRef.current.material instanceof THREE.MeshBasicMaterial) {
             ringRef.current.material.opacity *= 0.8;
        }
    }
  });

  return (
    <group position={position}>
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" transparent opacity={1} emissive="#fbbf24" emissiveIntensity={8} />
        </mesh>
        <mesh ref={ringRef} rotation={[Math.PI/2, 0, 0]}>
            <ringGeometry args={[0.4, 0.6, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
        <Sparkles count={8} scale={2} size={8} speed={0.4} color="#fcd34d" />
    </group>
  );
};

const Scenery = React.memo(() => {
  const props = useMemo(() => {
    return new Array(40).fill(0).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const dist = 35 + Math.random() * 25; 
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const scale = 0.8 + Math.random() * 2.5;
        const type = Math.random();
        return { x, z, scale, type };
    });
  }, []);

  return (
    <group>
        {props.map((p, i) => (
            <group key={i} position={[p.x, 0, p.z]} scale={p.scale}>
                {p.type < 0.4 ? (
                    <mesh position={[0, 1.5, 0]}>
                        <coneGeometry args={[0.8, 3, 5]} />
                        <meshStandardMaterial color="#3f6212" roughness={0.8} />
                    </mesh>
                ) : p.type < 0.7 ? (
                    <mesh position={[0, 0.5, 0]} rotation={[Math.random(), Math.random(), Math.random()]}>
                        <dodecahedronGeometry args={[1, 0]} />
                        <meshStandardMaterial color="#57534e" roughness={0.9} />
                    </mesh>
                ) : (
                    <mesh position={[0, 2, 0]}>
                        <boxGeometry args={[0.8, 4, 0.8]} />
                        <meshStandardMaterial color="#d6d3d1" roughness={0.6} />
                    </mesh>
                )}
            </group>
        ))}
    </group>
  );
});

const NPCMerchant: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh position={[0, 1.2, 0]}>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#52525b" metalness={1} roughness={0} emissive="#06b6d4" emissiveIntensity={1} />
      </mesh>
    </Float>
    <mesh position={[0, 0.2, 0]}>
      <cylinderGeometry args={[0.8, 0.8, 0.2, 8]} />
      <meshStandardMaterial color="#27272a" />
    </mesh>
    <pointLight position={[0, 1.5, 0]} color="#06b6d4" intensity={3} distance={10} />
    <Sparkles count={40} scale={3} size={4} speed={0.3} color="#06b6d4" />
  </group>
);

const MagePlayer = ({ playerRef }: { playerRef: React.MutableRefObject<any> }) => {
  const staffRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const [isHealing, setIsHealing] = useState(false);

  useFrame((state) => {
    const { isAttacking, isDefending, flashTimer, isHealing: healingState } = playerRef.current;
    
    if (healingState !== isHealing) setIsHealing(healingState);

    if (staffRef.current) {
      const targetRot = isAttacking ? -0.8 : 0.2;
      staffRef.current.rotation.x = THREE.MathUtils.lerp(staffRef.current.rotation.x, targetRot, 0.2);
      staffRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.05 + (isAttacking ? 0.3 : 0);
    }

    if (shieldRef.current) {
        shieldRef.current.visible = isDefending;
        shieldRef.current.rotation.y += 0.05;
        shieldRef.current.scale.setScalar(THREE.MathUtils.lerp(shieldRef.current.scale.x, isDefending ? 1 : 0, 0.2));
    }

    if (bodyRef.current && bodyRef.current.material instanceof THREE.MeshStandardMaterial) {
        if (flashTimer > 0) {
            bodyRef.current.material.emissive.setHex(0xff0000);
            bodyRef.current.material.emissiveIntensity = flashTimer * 3;
            playerRef.current.flashTimer--;
        } else if (isAttacking) {
            bodyRef.current.material.emissive.setHex(0x06b6d4);
            bodyRef.current.material.emissiveIntensity = 2.0;
        } else if (healingState) {
            bodyRef.current.material.emissive.setHex(0x4ade80);
            bodyRef.current.material.emissiveIntensity = 1.0;
        } else {
            bodyRef.current.material.emissive.setHex(0x06b6d4);
            bodyRef.current.material.emissiveIntensity = 0.5;
        }
    }
  });

  return (
    <group>
      <mesh ref={bodyRef} position={[0, 0.75, 0]}>
        <coneGeometry args={[0.5, 1.5, 8]} />
        <meshStandardMaterial color="#18181b" roughness={0.5} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.22]} />
        <meshStandardMaterial color="#52525b" />
      </mesh>
      <group ref={staffRef} position={[0.6, 0.8, 0.2]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 2.2]} />
          <meshStandardMaterial color="#09090b" />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <octahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={8} />
        </mesh>
        <pointLight position={[0, 1.2, 0]} color="#06b6d4" intensity={2} distance={5} />
      </group>
      <group ref={shieldRef} scale={[0,0,0]}>
        <mesh position={[0, 0.8, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.0, 0.03, 16, 64]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={5} transparent opacity={0.5} />
        </mesh>
      </group>
      
      {/* Healing Particles */}
      {isHealing && (
        <group position={[0, 0.1, 0]}>
            <Sparkles count={40} scale={2.5} size={5} speed={1.5} opacity={0.7} color="#4ade80" />
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.1, 0]}>
                 <ringGeometry args={[0.6, 1.5, 32]} />
                 <meshBasicMaterial color="#4ade80" transparent opacity={0.15} side={THREE.DoubleSide} />
            </mesh>
            <pointLight position={[0, 1, 0]} color="#4ade80" intensity={3} distance={4} />
        </group>
      )}
    </group>
  );
};

const GuardianEnemy: React.FC<{ 
  enemyId: string; 
  enemyRef: React.RefObject<THREE.Group> | null; 
  position: [number, number, number];
  isAttacking: boolean;
  hp: number;
  maxHp: number;
  energy: number;
  }> = ({ enemyId, enemyRef, position, isAttacking, hp, maxHp, energy }) => {
  const torsoRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const eyesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Arm Animation
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.position.y = 1.2 + Math.sin(t * 3) * 0.1;
      rightArmRef.current.position.y = 1.2 + Math.sin(t * 3 + Math.PI) * 0.1;
      leftArmRef.current.rotation.z = 0.2 + Math.sin(t * 2) * 0.05;
      rightArmRef.current.rotation.z = -0.2 - Math.sin(t * 2) * 0.05;
    }

    // Body Material Logic
    if (torsoRef.current && torsoRef.current.material instanceof THREE.MeshStandardMaterial) {
      if (isAttacking) {
          torsoRef.current.material.emissive.setHex(0xff1111);
          torsoRef.current.material.emissiveIntensity = 2 + Math.sin(t * 15) * 2;
      } else {
          // Dim body when low energy
          const energyFactor = Math.max(0.3, energy / 100);
          torsoRef.current.material.color.setHSL(0.07, 0.05, 0.45 * energyFactor);
          torsoRef.current.material.emissive.setHex(0x000000);
          torsoRef.current.material.emissiveIntensity = 0;
      }
    }

    // Eye Logic
    if (eyesRef.current) {
        // Aggressive: Red & Bright | Passive: Amber | Low Energy: Dim/Grey
        const isLowEnergy = energy < 20;
        const targetColor = isAttacking ? "#ef4444" : (isLowEnergy ? "#57534e" : "#f59e0b");
        const targetIntensity = isAttacking ? 8 : (isLowEnergy ? 0.5 : 4);

        eyesRef.current.children.forEach((child) => {
            if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                child.material.color.set(targetColor);
                child.material.emissive.set(targetColor);
                child.material.emissiveIntensity = THREE.MathUtils.lerp(child.material.emissiveIntensity, targetIntensity, 0.1);
            }
        });
    }
  });

  if (!enemyRef) return null;

  return (
    <group ref={enemyRef} name={enemyId} position={position}>
      {/* Bigger Health Bar */}
      <Html position={[0, 3.2, 0]} center distanceFactor={12} zIndexRange={[100, 0]}>
          <div className="w-24 h-3 bg-zinc-900/90 rounded-sm border border-zinc-600 overflow-hidden backdrop-blur-sm pointer-events-none shadow-lg">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.6)] transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
            />
          </div>
      </Html>

      {/* Main Golem Body */}
      <group>
        <mesh ref={torsoRef} position={[0, 1.1, 0]}>
            <dodecahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>

        {/* Head */}
        <group position={[0, 1.9, 0]}>
            <mesh>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color="#57534e" roughness={0.9} />
            </mesh>
            {/* Glowing Eyes Group */}
            <group ref={eyesRef}>
                <mesh position={[-0.12, 0.05, 0.26]}>
                    <sphereGeometry args={[0.08]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={4} />
                </mesh>
                <mesh position={[0.12, 0.05, 0.26]}>
                    <sphereGeometry args={[0.08]} />
                    <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={4} />
                </mesh>
            </group>
        </group>

        <mesh ref={leftArmRef} position={[-0.9, 1.2, 0]}>
            <boxGeometry args={[0.5, 0.8, 0.5]} />
            <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.9, 1.2, 0]}>
            <boxGeometry args={[0.5, 0.8, 0.5]} />
            <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>
      </group>
      
      {/* Ambient Red Glow for Aggro */}
      {isAttacking && (
         <pointLight position={[0, 1.5, 0.5]} color="#ef4444" intensity={2} distance={5} />
      )}
    </group>
  );
};

const GameScene: React.FC<{ 
    onMetricsUpdate: any, onLog: any, onStatsUpdate: any, 
    gameActive: boolean, onGameOver: any, playerStateExt: PlayerState, onOpenShop: () => void,
    manualEnemyEnergy: number, isAutoRegen: boolean, resetSignal: number
}> = ({ onMetricsUpdate, onLog, onStatsUpdate, gameActive, onGameOver, playerStateExt, onOpenShop, manualEnemyEnergy, isAutoRegen, resetSignal }) => {
  const playerRef = useRef({ 
    ...playerStateExt, 
    x: playerStateExt.position.x, 
    z: playerStateExt.position.z, 
    isAttacking: false, 
    attackTimer: 0,
    isDodging: false,
    dodgeTimer: 0,
    isDefending: false,
    isHealing: false,
    healTimer: 0,
    flashTimer: 0
  });
  
  const [enemies, setEnemies] = useState<EnemyState[]>([]);
  const [effects, setEffects] = useState<any[]>([]);
  const [enemyVisualStates, setEnemyVisualStates] = useState<Record<string, { isAttacking: boolean }>>({});
  
  const enemyRefs = useRef<{ [key: string]: React.RefObject<THREE.Group> }>({});
  const aiInstances = useRef<{ [key: string]: FuzzyAI }>({});
  const enemyAttackCooldowns = useRef<Record<string, number>>({});
  
  const throttleCounter = useRef(0);
  const mousePosRef = useRef(new THREE.Vector3());
  const keys = useRef<any>({});
  const { camera, raycaster, pointer } = useThree();
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const playerMesh = useRef<THREE.Group>(null);

  // --- PROJECTILE SYSTEM (Ref-based for performance/race-condition fix) ---
  const projectilesGroupRef = useRef<THREE.Group>(null);
  const projectilesData = useRef<Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; id: number; startTime: number }>>([]);

  const spawnEnemies = useCallback(() => {
    const newEnemies: EnemyState[] = [];
    enemyRefs.current = {};
    aiInstances.current = {};
    enemyAttackCooldowns.current = {};

    for (let i = 0; i < 1; i++) {
        const id = `golem_${Date.now()}_${i}`;
        const angle = Math.random() * Math.PI * 2;
        const radius = 22 + Math.random() * 6; 
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        // Hostile from Start: Start with full energy
        newEnemies.push({ id, position: { x, y: 0, z }, hp: 100, maxHp: 100, energy: 100, color: '#ef4444' });
        
        enemyRefs.current[id] = React.createRef<THREE.Group>();
        aiInstances.current[id] = new FuzzyAI();
        enemyAttackCooldowns.current[id] = 0;
    }
    setEnemies(newEnemies);
    onLog("The stone giants awaken. Steel your heart.", "info");
  }, [onLog]);

  // Handle Game Reset Signal (Optimized Restart)
  useEffect(() => {
    if (resetSignal > 0) {
        // Reset Player Position & internal stats
        playerRef.current.x = 0;
        playerRef.current.z = 5;
        playerRef.current.hp = 100;
        playerRef.current.magicCd = 0;
        
        // Clear Projectiles
        if (projectilesGroupRef.current) {
            projectilesGroupRef.current.clear();
        }
        projectilesData.current = [];

        // Respawn Enemies
        spawnEnemies();
    }
  }, [resetSignal, spawnEnemies]);

  useEffect(() => {
    if (gameActive && enemies.length === 0 && resetSignal === 0) {
        spawnEnemies();
    }
  }, [gameActive, enemies.length, spawnEnemies, resetSignal]);

  useEffect(() => {
    playerRef.current.gold = playerStateExt.gold;
    playerRef.current.damageMultiplier = playerStateExt.damageMultiplier;
    playerRef.current.hp = playerStateExt.hp;
    playerRef.current.maxMagicCd = playerStateExt.maxMagicCd; 
  }, [playerStateExt]);

  const handleEnemyDamage = useCallback((enemyId: string, dmg: number) => {
    setEnemies(prev => {
        const target = prev.find(e => e.id === enemyId);
        if (!target) return prev;
        const newHp = Math.max(0, target.hp - dmg);
        if (newHp <= 0) {
            onLog(`The golem shatters. Golden coins remain.`, "combat");
            playerRef.current.gold += 100; 
            delete enemyRefs.current[enemyId];
            delete aiInstances.current[enemyId];
            delete enemyAttackCooldowns.current[enemyId];
            return prev.filter(e => e.id !== enemyId);
        }
        return prev.map(e => e.id === enemyId ? { ...e, hp: newHp } : e);
    });
  }, [onLog]);

  const performDodge = useCallback(() => {
      if (!gameActive || playerRef.current.dodgeTimer > 0) return;
      playerRef.current.isDodging = true;
      playerRef.current.dodgeTimer = 30;
  }, [gameActive]);

  const performHeal = useCallback(() => {
      if (!gameActive || playerRef.current.healTimer > 0) return;
      playerRef.current.isHealing = true;
      playerRef.current.healTimer = 120;
      onLog("Channeling restorative energy...", "info");
  }, [gameActive, onLog]);

  const spawnPlayerProjectile = useCallback(() => {
    if (!gameActive || playerRef.current.magicCd > 0) return;

    // Sanctuary Logic: Prevent attacks inside safe zone
    const distSq = playerRef.current.x**2 + playerRef.current.z**2;
    if (distSq < SAFE_ZONE_RADIUS**2) {
        onLog("The Sanctuary forbids violence.", "info");
        return;
    }
    
    // Trigger Casting Animation
    playerRef.current.isAttacking = true; 
    playerRef.current.attackTimer = 15; // Animation duration
    playerRef.current.magicCd = playerRef.current.maxMagicCd; 
    
    // Create Mesh directly for Three.js scene
    if (projectilesGroupRef.current) {
        const dir = new THREE.Vector3().subVectors(mousePosRef.current, new THREE.Vector3(playerRef.current.x, 0, playerRef.current.z)).normalize();
        
        const geometry = new THREE.IcosahedronGeometry(0.3, 0);
        const material = new THREE.MeshStandardMaterial({ color: "#06b6d4", emissive: "#06b6d4", emissiveIntensity: 10 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(playerRef.current.x, 1.2, playerRef.current.z);
        mesh.rotation.set(Math.PI / 4, 0, Math.PI / 4);
        
        // Add point light child
        const light = new THREE.PointLight("#06b6d4", 6, 4);
        mesh.add(light);

        projectilesGroupRef.current.add(mesh);
        
        projectilesData.current.push({
            mesh,
            velocity: new THREE.Vector3(dir.x * 0.6, 0, dir.z * 0.6),
            id: Date.now() + Math.random(),
            startTime: Date.now()
        });
    }
  }, [gameActive, onLog]);

  const handleContextKey = useCallback(() => {
    const distSq = playerRef.current.x**2 + playerRef.current.z**2;
    if (distSq < MERCHANT_INTERACT_RADIUS**2) {
      onOpenShop();
    } else {
      spawnPlayerProjectile();
    }
  }, [onOpenShop, spawnPlayerProjectile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        keys.current[e.code] = true; 
        if (e.code === 'KeyE') handleContextKey();
        if (e.code === 'ShiftLeft') performDodge();
        if (e.code === 'KeyF') performHeal();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keys.current[e.code] = false;
        if (e.code === 'KeyQ') playerRef.current.isDefending = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleContextKey, performDodge, performHeal]);

  const triggerDamageFlash = () => {
    playerRef.current.flashTimer = 20;
    setEffects(prev => [...prev, { id: Date.now() + Math.random(), pos: [playerRef.current.x, 1, playerRef.current.z] }]);
    setTimeout(() => {
        setEffects(prev => prev.slice(1));
    }, 800);
  };

  useFrame((state) => {
    if (!gameActive) return;
    const p = playerRef.current;
    
    // --- PROJECTILE PHYSICS LOOP ---
    if (projectilesGroupRef.current) {
        const now = Date.now();
        const targets = Object.values(enemyRefs.current);
        // We use a separate array to mark IDs for removal to avoid mutating while iterating
        const idsToRemove = new Set<number>();

        projectilesData.current.forEach(proj => {
            // Move
            proj.mesh.position.add(proj.velocity);
            proj.mesh.rotation.y += 0.4;

            // Lifetime check
            if (now - proj.startTime > 3000) {
                idsToRemove.add(proj.id);
                return;
            }

            // Collision Check
            for (const targetRef of targets) {
                if (targetRef?.current) {
                    const targetId = targetRef.current.name;
                    const targetPos = targetRef.current.position;
                    const dx = proj.mesh.position.x - targetPos.x;
                    const dz = proj.mesh.position.z - targetPos.z;
                    // INCREASED COLLISION RADIUS to 4 (distance 2) for better reliability
                    if (dx * dx + dz * dz < 4) {
                         // DAMAGE INCREASED TO 20 (5 hits to kill 100HP enemy)
                         handleEnemyDamage(targetId, 20 * playerRef.current.damageMultiplier);
                         idsToRemove.add(proj.id);
                         break; // Hit one enemy max
                    }
                }
            }
        });

        // Cleanup Dead Projectiles
        if (idsToRemove.size > 0) {
            projectilesData.current = projectilesData.current.filter(p => {
                if (idsToRemove.has(p.id)) {
                    projectilesGroupRef.current?.remove(p.mesh);
                    // Dispose geometries/materials to avoid memory leaks
                    if (p.mesh.geometry) p.mesh.geometry.dispose();
                    if (Array.isArray(p.mesh.material)) p.mesh.material.forEach(m => m.dispose());
                    else p.mesh.material.dispose();
                    return false;
                }
                return true;
            });
        }
    }
    
    if (enemies.length === 0 && resetSignal === 0) return; 

    raycaster.setFromCamera(pointer, camera); 
    const intersect = new THREE.Vector3(); 
    raycaster.ray.intersectPlane(floorPlane.current, intersect); 
    mousePosRef.current.copy(intersect);

    p.isDefending = !!keys.current['KeyQ'];

    const move = new THREE.Vector3(0, 0, 0);
    if (!p.isHealing) {
        if (keys.current['KeyW']) move.z -= 1; if (keys.current['KeyS']) move.z += 1; if (keys.current['KeyD']) move.x += 1; if (keys.current['KeyA']) move.x -= 1;
    }
    
    let currentMoveSpeed = PLAYER_SPEED;
    if (p.isDodging) currentMoveSpeed *= 2.5;
    if (p.isDefending) currentMoveSpeed *= 0.3;

    if (move.length() > 0) move.normalize().multiplyScalar(currentMoveSpeed);
    p.x += move.x; p.z += move.z;

    if (p.attackTimer > 0) p.attackTimer--; else p.isAttacking = false;
    if (p.dodgeTimer > 0) {
        p.dodgeTimer--;
        if (p.dodgeTimer < 15) p.isDodging = false;
    }
    if (p.healTimer > 0) {
        p.healTimer--;
        if (p.healTimer === 0) {
            p.hp = Math.min(100, p.hp + 20);
            p.isHealing = false;
            onLog("Vitality restored.", "info");
        }
    }
    
    if (p.magicCd > 0 && !p.isHealing) {
        p.magicCd = Math.max(0, p.magicCd - 0.5);
    }

    const pDistSq = p.x*p.x + p.z*p.z;
    const isPlayerSafe = pDistSq < SAFE_ZONE_RADIUS**2;

    let frameMetrics: FuzzyMetrics | null = null;
    const nextVisualStates: Record<string, { isAttacking: boolean }> = {};
    const nextEnemies = enemies.map(e => {
        const ai = aiInstances.current[e.id];
        if (!ai) return e;

        const dx = p.x - e.position.x;
        const dz = p.z - e.position.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        // --- ENERGY LOGIC UPDATE ---
        let currentEnergy = e.energy;
        if (!isAutoRegen) {
             currentEnergy = manualEnemyEnergy;
        }

        const metrics = ai.evaluate(
            Math.min(dist, 30), 
            (e.hp / 50) * 100, 
            p.hp, 
            p.magicCd, 
            10, 
            currentEnergy,
            p.isDodging,
            p.isDefending,
            p.isHealing
        );
        if (!frameMetrics) frameMetrics = metrics;

        const newPos = { ...e.position };
        const dCenterSq = newPos.x*newPos.x + newPos.z*newPos.z;

        const separation = new THREE.Vector3(0,0,0);
        enemies.forEach(other => { 
            if (other.id === e.id) return;
            const dEnemyDistSq = (e.position.x - other.position.x)**2 + (e.position.z - other.position.z)**2;
            if (dEnemyDistSq < 4) {
                separation.x += ((e.position.x - other.position.x) / dEnemyDistSq) * ENEMY_SEPARATION_STRENGTH;
                separation.z += ((e.position.z - other.position.z) / dEnemyDistSq) * ENEMY_SEPARATION_STRENGTH;
            }
        });

        if (dCenterSq < (SAFE_ZONE_RADIUS + 0.2)**2) {
            const pushDir = new THREE.Vector2(newPos.x, newPos.z).normalize();
            newPos.x = pushDir.x * (SAFE_ZONE_RADIUS + 0.5);
            newPos.z = pushDir.y * (SAFE_ZONE_RADIUS + 0.5);
        } else if (!isPlayerSafe) {
            const angle = Math.atan2(dz, dx);
            const finalSpeed = 0.012 + Math.max(0, (metrics.aggressionOutput - 20) * 0.003);
            const cooldown = enemyAttackCooldowns.current[e.id] || 0;
            
            if (dist < 3.2 && metrics.aggressionOutput > 40 && cooldown <= 0) {
                nextVisualStates[e.id] = { isAttacking: true };
                enemyAttackCooldowns.current[e.id] = 120;
                
                // --- CONSUMPTION LOGIC ---
                // Significant energy cost for attacking
                if (isAutoRegen) {
                     currentEnergy = Math.max(0, currentEnergy - 35);
                }

                let damage = 10;
                if (p.isDefending) damage *= 0.2;
                if (p.isHealing) damage *= 1.5;
                if (p.isDodging) damage = 0;

                if (damage > 0) {
                  p.hp -= damage;
                  triggerDamageFlash();
                  onLog(`Integrity compromised! -${Math.floor(damage)} Vitality`, 'combat');
                }
                newPos.x = THREE.MathUtils.lerp(newPos.x, p.x, 0.2);
                newPos.z = THREE.MathUtils.lerp(newPos.z, p.z, 0.2);
            } else if (metrics.energyPct < 25 || metrics.stateDescription === 'CONSERVING') {
                // Retreat Logic
                newPos.x -= Math.cos(angle) * finalSpeed;
                newPos.z -= Math.sin(angle) * finalSpeed;
                nextVisualStates[e.id] = { isAttacking: false };
            } else if (dist > ENEMY_STOP_DISTANCE) {
                newPos.x += Math.cos(angle) * finalSpeed;
                newPos.z += Math.sin(angle) * finalSpeed;
                nextVisualStates[e.id] = { isAttacking: false };
            } else {
                nextVisualStates[e.id] = { isAttacking: false };
            }
            if (enemyAttackCooldowns.current[e.id] > 0) enemyAttackCooldowns.current[e.id]--;
        } else {
            newPos.x += (Math.random() - 0.5) * 0.02;
            newPos.z += (Math.random() - 0.5) * 0.02;
            nextVisualStates[e.id] = { isAttacking: false };
        }
        newPos.x += separation.x;
        newPos.z += separation.z;

        // --- DYNAMIC REGEN LOGIC ---
        let nextEnergy = currentEnergy;
        if (isAutoRegen) {
             let regenRate = 0.03; // Lower base rate
             if (metrics.stateDescription === 'CONSERVING' || metrics.stateDescription === 'PASSIVE') {
                 regenRate = 0.15; // Reward backing off
             }
             nextEnergy = Math.min(100, currentEnergy + regenRate);
        } else {
             // If manual, strictly stick to input value
             nextEnergy = manualEnemyEnergy;
        }

        return { ...e, position: newPos, energy: nextEnergy };
    });

    setEnemies(nextEnemies);
    setEnemyVisualStates(nextVisualStates);

    if (playerMesh.current) {
        playerMesh.current.position.set(p.x, 0, p.z);
        playerMesh.current.lookAt(mousePosRef.current.x, 0, mousePosRef.current.z);
    }
    
    const targetCamPos = new THREE.Vector3(p.x, 15, p.z + 14);
    camera.position.lerp(targetCamPos, 0.08); 
    camera.lookAt(p.x, 0, p.z);
    
    if (p.hp <= 0) onGameOver(false);

    throttleCounter.current++;
    if (throttleCounter.current % 10 === 0) {
        if (frameMetrics) onMetricsUpdate(frameMetrics);
        onStatsUpdate({ ...p, position: { x: p.x, y: 0, z: p.z } }, nextEnemies);
    }
  });

  return (
    <>
      <color attach="background" args={['#e0f2fe']} />
      <fog attach="fog" args={['#e0f2fe', 15, 60]} />
      <Environment preset="park" />
      
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.8} color="#fff7ed" castShadow />
      
      <Scenery />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
          <planeGeometry args={[150, 150]} />
          <meshStandardMaterial color="#ecfccb" roughness={0.8} />
      </mesh>
      
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        sectionSize={2} 
        cellSize={1} 
        cellColor="#84cc16" 
        sectionColor="#65a30d" 
        cellThickness={0.5}
        sectionThickness={1}
        position={[0, 0.01, 0]}
      />
      
      <Torus args={[SAFE_ZONE_RADIUS, 0.05, 16, 128]} rotation={[Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={4} transparent opacity={0.6} />
      </Torus>

      <NPCMerchant position={[0, 0, 0]} />
      
      <group ref={playerMesh}>
        <MagePlayer playerRef={playerRef} />
        <pointLight position={[0, 2, 0]} color="#06b6d4" intensity={2} distance={8} />
      </group>
      
      {enemies.map(e => (
        <GuardianEnemy 
          key={e.id} 
          enemyId={e.id} 
          enemyRef={enemyRefs.current[e.id] || null} 
          position={[e.position.x, 0, e.position.z]}
          isAttacking={enemyVisualStates[e.id]?.isAttacking || false}
          hp={e.hp}
          maxHp={e.maxHp}
          energy={e.energy}
        />
      ))}

      {effects.map(eff => (
          <HitEffect key={eff.id} position={eff.pos} />
      ))}
      
      {/* Container for Projectiles managed via Ref */}
      <group ref={projectilesGroupRef} />

      <ContactShadows 
        position={[0, -0.01, 0]} 
        opacity={0.4} 
        scale={40} 
        blur={2} 
        far={5} 
        color="#000000"
      />
    </>
  );
};

export default GameScene;