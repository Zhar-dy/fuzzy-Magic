
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Float, Sparkles, Torus, Sphere } from '@react-three/drei';
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

// Visual feedback for when a hit occurs
const HitEffect: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.multiplyScalar(1.15);
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.opacity *= 0.85;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#ff0000" transparent opacity={0.8} emissive="#ff0000" emissiveIntensity={5} />
    </mesh>
  );
};

const NPCMerchant: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.8, 0]}>
      <capsuleGeometry args={[0.4, 1, 4, 8]} />
      <meshStandardMaterial color="#fbbf24" roughness={0.5} />
    </mesh>
    <mesh position={[0, 1.7, 0]}>
      <sphereGeometry args={[0.3]} />
      <meshStandardMaterial color="#fef3c7" />
    </mesh>
    <mesh position={[0, 2.2, 0]}>
        <torusGeometry args={[0.3, 0.05, 16, 32]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
    </mesh>
    <Sparkles count={20} scale={2} size={2} speed={0.5} color="#fbbf24" />
  </group>
);

const Projectile: React.FC<{ 
    id: number, 
    initialPosition: Vector3, 
    velocity: Vector3, 
    targets: React.RefObject<THREE.Group>[], 
    color: string, 
    isPlayer: boolean,
    onHit: (projId: number, targetId: string) => void, 
    onMiss: (id: number) => void 
}> = ({ id, initialPosition, velocity, targets, color, onHit, onMiss }) => {
  const ref = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  const pos = useRef(new THREE.Vector3(initialPosition.x, 1.2, initialPosition.z));
  const hitIds = useRef<Set<string>>(new Set());

  useFrame(() => {
    if (!ref.current) return;
    pos.current.x += velocity.x; pos.current.z += velocity.z;
    ref.current.position.copy(pos.current);
    ref.current.rotation.x += 0.2;
    if (Date.now() - startTime.current > 3000) { onMiss(id); return; }
    targets.forEach(targetRef => {
        if (targetRef?.current) {
            const targetId = targetRef.current.name;
            if (hitIds.current.has(targetId)) return;
            const targetPos = targetRef.current.position;
            const dx = pos.current.x - targetPos.x;
            const dz = pos.current.z - targetPos.z;
            if (dx * dx + dz * dz < 2.5) {
                hitIds.current.add(targetId);
                onHit(id, targetId);
            }
        }
    });
  });

  return (
    <group ref={ref}>
      <mesh><octahedronGeometry args={[0.3, 0]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} /></mesh>
      <pointLight distance={3} intensity={2} color={color} />
    </group>
  );
};

const MagePlayer = ({ playerRef }: { playerRef: React.MutableRefObject<any> }) => {
  const staffRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (staffRef.current) {
      const { isAttacking, isDefending } = playerRef.current;
      staffRef.current.rotation.x = isAttacking ? THREE.MathUtils.lerp(staffRef.current.rotation.x, -1.8, 0.4) : THREE.MathUtils.lerp(staffRef.current.rotation.x, 0.2, 0.1);
      staffRef.current.position.x = isDefending ? 0.2 : 0.5;
    }
    if (shieldRef.current) {
        shieldRef.current.visible = playerRef.current.isDefending;
        shieldRef.current.rotation.y += 0.05;
    }
    // Visual flash on damage
    if (bodyRef.current && bodyRef.current.material instanceof THREE.MeshStandardMaterial) {
        if (playerRef.current.flashTimer > 0) {
            bodyRef.current.material.emissive.setHex(0xff0000);
            bodyRef.current.material.emissiveIntensity = playerRef.current.flashTimer / 5;
            playerRef.current.flashTimer--;
        } else {
            bodyRef.current.material.emissive.setHex(0x000000);
        }
    }
  });

  return (
    <group>
      <mesh ref={bodyRef} position={[0, 0.75, 0]}>
        <coneGeometry args={[0.45, 1.5, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[0, 1.4, 0]}><sphereGeometry args={[0.25]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
      <group ref={staffRef} position={[0.5, 0.8, 0.3]}>
        <mesh><cylinderGeometry args={[0.02, 0.03, 1.8]} /><meshStandardMaterial color="#422006" /></mesh>
        <mesh position={[0, 0.9, 0]}><dodecahedronGeometry args={[0.12]} /><meshStandardMaterial color="#22d3ee" emissive="#22d3ee" /></mesh>
      </group>
      <group ref={shieldRef} position={[0, 0.8, 0.5]}>
          <mesh rotation={[0, 0, 0]}>
              <torusGeometry args={[0.8, 0.02, 8, 32]} />
              <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
          </mesh>
      </group>
    </group>
  );
};

const GuardianEnemy = ({ enemyId, enemyRef, color, position, isAttacking }: { 
  enemyId: string, 
  enemyRef: React.RefObject<THREE.Group>, 
  color: string, 
  position: [number, number, number],
  isAttacking: boolean
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      if (isAttacking) {
        meshRef.current.material.emissive.setHex(0xff0000);
        meshRef.current.material.emissiveIntensity = 10 + Math.sin(state.clock.elapsedTime * 20) * 5;
      } else {
        meshRef.current.material.emissive.setHex(0x000000);
      }
    }
  });

  return (
    <group ref={enemyRef} name={enemyId} position={position}>
      <mesh ref={meshRef} position={[0, 1, 0]}>
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color={color} flatShading metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.3, 1.2, 0.5]}><boxGeometry args={[0.15, 0.05, 0.1]} /><meshBasicMaterial color="#fde047" /></mesh>
      <mesh position={[-0.3, 1.2, 0.5]}><boxGeometry args={[0.15, 0.05, 0.1]} /><meshBasicMaterial color="#fde047" /></mesh>
      {isAttacking && <pointLight color="#ff0000" intensity={2} distance={3} />}
    </group>
  );
};

const GameScene: React.FC<{ 
    onMetricsUpdate: any, onLog: any, onStatsUpdate: any, 
    gameActive: boolean, onGameOver: any, playerStateExt: PlayerState, onOpenShop: () => void
}> = ({ onMetricsUpdate, onLog, onStatsUpdate, gameActive, onGameOver, playerStateExt, onOpenShop }) => {
  const playerRef = useRef({ 
    ...playerStateExt, 
    x: 0, 
    z: 5, 
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
  
  const mousePosRef = useRef(new THREE.Vector3());
  const keys = useRef<any>({});
  const { camera, raycaster, pointer } = useThree();
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const [projectiles, setProjectiles] = useState<any[]>([]);
  const playerMesh = useRef<THREE.Group>(null);

  const spawnEnemies = () => {
    const newEnemies: EnemyState[] = [];
    for (let i = 0; i < 2; i++) {
        const id = `enemy_${Date.now()}_${i}`;
        const angle = Math.random() * Math.PI * 2;
        const radius = 22 + Math.random() * 6; 
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        newEnemies.push({ id, position: { x, y: 0, z }, hp: 50, maxHp: 50, energy: 100, color: '#ff4444' });
        enemyRefs.current[id] = React.createRef<THREE.Group>();
        aiInstances.current[id] = new FuzzyAI();
        enemyAttackCooldowns.current[id] = 0;
    }
    setEnemies(newEnemies);
    onLog("Guardians have appeared outside the Sanctuary.", "info");
  };

  useEffect(() => {
    if (gameActive && enemies.length === 0) spawnEnemies();
  }, [gameActive, enemies.length]);

  useEffect(() => {
    playerRef.current.gold = playerStateExt.gold;
    playerRef.current.damageMultiplier = playerStateExt.damageMultiplier;
    playerRef.current.hp = playerStateExt.hp;
  }, [playerStateExt]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        keys.current[e.code] = true; 
        if (e.code === 'Space') performAttack(); 
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
  }, [gameActive, enemies]);

  const performDodge = () => {
      if (!gameActive || playerRef.current.dodgeTimer > 0) return;
      playerRef.current.isDodging = true;
      playerRef.current.dodgeTimer = 30;
  };

  const performHeal = () => {
      if (!gameActive || playerRef.current.healTimer > 0) return;
      playerRef.current.isHealing = true;
      playerRef.current.healTimer = 120;
      onLog("Channeling restorative magic... VULNERABLE!", "combat");
  };

  const handleContextKey = () => {
    const distSq = playerRef.current.x**2 + playerRef.current.z**2;
    if (distSq < MERCHANT_INTERACT_RADIUS**2) {
      onOpenShop();
    } else {
      spawnPlayerProjectile();
    }
  };

  const triggerDamageFlash = () => {
    playerRef.current.flashTimer = 15;
    setEffects(prev => [...prev, { id: Date.now() + Math.random(), pos: [playerRef.current.x, 1, playerRef.current.z] }]);
    // Cleanup old effects after 1 sec
    setTimeout(() => {
        setEffects(prev => prev.slice(1));
    }, 1000);
  };

  const performAttack = () => {
    if (!gameActive || playerRef.current.isAttacking) return;
    playerRef.current.isAttacking = true; playerRef.current.attackTimer = 15;
    enemies.forEach(e => {
        const dist = Math.sqrt((e.position.x - playerRef.current.x) ** 2 + (e.position.z - playerRef.current.z) ** 2);
        if (dist < 3.5) handleEnemyDamage(e.id, 10 * playerRef.current.damageMultiplier);
    });
  };

  const handleEnemyDamage = (enemyId: string, dmg: number) => {
    setEnemies(prev => {
        const target = prev.find(e => e.id === enemyId);
        if (!target) return prev;
        const newHp = Math.max(0, target.hp - dmg);
        if (newHp <= 0) {
            onLog(`Guardian defeated! +100g`, "combat");
            playerRef.current.gold += 100;
            delete enemyRefs.current[enemyId];
            delete aiInstances.current[enemyId];
            delete enemyAttackCooldowns.current[enemyId];
            return prev.filter(e => e.id !== enemyId);
        }
        return prev.map(e => e.id === enemyId ? { ...e, hp: newHp } : e);
    });
  };

  const spawnPlayerProjectile = () => {
    if (!gameActive || playerRef.current.magicCd > 0) return;
    playerRef.current.magicCd = 60;
    const dir = new THREE.Vector3().subVectors(mousePosRef.current, new THREE.Vector3(playerRef.current.x, 0, playerRef.current.z)).normalize();
    setProjectiles(prev => [...prev, { 
        id: Date.now() + Math.random(), isPlayer: true, 
        x: playerRef.current.x, z: playerRef.current.z, 
        vx: dir.x * 0.5, vz: dir.z * 0.5, color: "#22d3ee" 
    }]);
  };

  useFrame((state) => {
    if (!gameActive) return;
    const p = playerRef.current;
    raycaster.setFromCamera(pointer, camera); 
    const intersect = new THREE.Vector3(); 
    raycaster.ray.intersectPlane(floorPlane.current, intersect); 
    mousePosRef.current.copy(intersect);

    p.isDefending = !!keys.current['KeyQ'];

    const move = new THREE.Vector3(0, 0, 0);
    if (!p.isHealing) {
        if (keys.current['KeyW']) move.z -= 1; if (keys.current['KeyS']) move.z += 1; if (keys.current['KeyD']) move.x += 1; if (keys.current['KeyA']) move.x -= 1;
    }
    
    let speed = PLAYER_SPEED;
    if (p.isDodging) speed *= 2.5;
    if (p.isDefending) speed *= 0.4;

    if (move.length() > 0) move.normalize().multiplyScalar(speed);
    p.x += move.x; p.z += move.z;

    if (p.attackTimer > 0) p.attackTimer--; else p.isAttacking = false;
    if (p.dodgeTimer > 0) {
        p.dodgeTimer--;
        if (p.dodgeTimer < 15) p.isDodging = false;
    }
    if (p.healTimer > 0) {
        p.healTimer--;
        if (p.healTimer === 0) {
            p.hp = Math.min(100, p.hp + 25);
            p.isHealing = false;
            onLog("Restoration complete.", "info");
        }
    }
    if (p.magicCd > 0) p.magicCd--;

    const pDistSq = p.x*p.x + p.z*p.z;
    const isPlayerSafe = pDistSq < SAFE_ZONE_RADIUS**2;

    let primaryMetrics: FuzzyMetrics | null = null;
    const nextVisualStates: Record<string, { isAttacking: boolean }> = {};

    setEnemies(prev => prev.map(e => {
        const ai = aiInstances.current[e.id];
        if (!ai) return e;
        const distToPlayer = Math.sqrt((p.x - e.position.x) ** 2 + (p.z - e.position.z) ** 2);
        const metrics = ai.evaluate(
            Math.min(distToPlayer, 30), 
            (e.hp / 50) * 100, 
            p.hp, 
            p.magicCd, 
            10, 
            e.energy,
            p.isDodging,
            p.isDefending,
            p.isHealing
        );
        if (!primaryMetrics) primaryMetrics = metrics;

        const newPos = { ...e.position };
        const dCenterSq = newPos.x*newPos.x + newPos.z*newPos.z;

        if (dCenterSq < (SAFE_ZONE_RADIUS + 0.2)**2) {
            const pushDir = new THREE.Vector2(newPos.x, newPos.z).normalize();
            newPos.x = pushDir.x * (SAFE_ZONE_RADIUS + 0.5);
            newPos.z = pushDir.y * (SAFE_ZONE_RADIUS + 0.5);
        } else if (!isPlayerSafe) {
            const angle = Math.atan2(p.z - e.position.z, p.x - e.position.x);
            
            // SIGNIFICANTLY SLOWED DOWN MOVEMENT
            const baseChaseSpeed = 0.012; 
            const aggressionBonus = Math.max(0, (metrics.aggressionOutput - 20) * 0.002);
            const finalSpeed = baseChaseSpeed + aggressionBonus;

            // Combat logic: Attack if close enough and aggression is high
            const cooldown = enemyAttackCooldowns.current[e.id] || 0;
            if (distToPlayer < 3.0 && metrics.aggressionOutput > 45 && cooldown <= 0) {
                // Strike!
                nextVisualStates[e.id] = { isAttacking: true };
                enemyAttackCooldowns.current[e.id] = 90; // Attack every 1.5 seconds approx
                
                // Discrete damage deduction
                let strikeDamage = 8;
                if (p.isDefending) strikeDamage *= 0.2;
                if (p.isHealing) strikeDamage *= 1.5;
                if (p.isDodging) strikeDamage = 0;

                if (strikeDamage > 0) {
                  p.hp -= strikeDamage;
                  triggerDamageFlash();
                  onLog(`Guardian strikes for ${Math.floor(strikeDamage)} damage!`, 'combat');
                }

                // Lunge animation
                newPos.x += Math.cos(angle) * 1.5;
                newPos.z += Math.sin(angle) * 1.5;
            } else {
                newPos.x += Math.cos(angle) * finalSpeed;
                newPos.z += Math.sin(angle) * finalSpeed;
                nextVisualStates[e.id] = { isAttacking: false };
            }

            if (enemyAttackCooldowns.current[e.id] > 0) {
              enemyAttackCooldowns.current[e.id]--;
            }
        } else {
          newPos.x += (Math.random() - 0.5) * 0.01;
          newPos.z += (Math.random() - 0.5) * 0.01;
          nextVisualStates[e.id] = { isAttacking: false };
        }
        
        return { ...e, position: newPos, energy: Math.min(100, e.energy + 0.2) };
    }));

    setEnemyVisualStates(nextVisualStates);

    if (playerMesh.current) {
        playerMesh.current.position.set(p.x, 0, p.z);
        playerMesh.current.lookAt(mousePosRef.current.x, 0.75, mousePosRef.current.z);
    }
    state.camera.position.lerp(new THREE.Vector3(p.x, 15, p.z + 18), 0.1); 
    state.camera.lookAt(p.x, 0, p.z);
    
    if (p.hp <= 0) onGameOver(false);
    if (primaryMetrics) onMetricsUpdate(primaryMetrics);
    onStatsUpdate({ ...p, position: { x: p.x, y: 0, z: p.z } }, enemies);
  });

  return (
    <>
      <ambientLight intensity={1.5} /><Sky sunPosition={[100, 20, 100]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[100, 100]} /><meshStandardMaterial color="#064e3b" /></mesh>
      
      <Torus args={[SAFE_ZONE_RADIUS, 0.1, 16, 100]} rotation={[Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={3} transparent opacity={0.4} />
      </Torus>

      <NPCMerchant position={[0, 0, 0]} />
      <group ref={playerMesh}><MagePlayer playerRef={playerRef} /></group>
      
      {enemies.map(e => (
        <GuardianEnemy 
          key={e.id} 
          enemyId={e.id} 
          enemyRef={enemyRefs.current[e.id] as any} 
          position={[e.position.x, 0, e.position.z]}
          isAttacking={enemyVisualStates[e.id]?.isAttacking || false}
          color={e.hp < 15 ? "#a855f7" : "#ef4444"} 
        />
      ))}

      {effects.map(eff => (
          <HitEffect key={eff.id} position={eff.pos} />
      ))}
      
      {projectiles.map(pr => (
        <Projectile 
          key={pr.id} id={pr.id} color={pr.color} initialPosition={{ x: pr.x, y: 1.2, z: pr.z }} velocity={{ x: pr.vx, y: 0, z: pr.vz }} 
          isPlayer={pr.isPlayer} targets={pr.isPlayer ? Object.values(enemyRefs.current) : [playerMesh as any]} 
          onHit={(projId, targetId) => {
              if (pr.isPlayer) handleEnemyDamage(targetId, 15 * playerRef.current.damageMultiplier);
              else {
                  let damage = 12;
                  if (playerRef.current.isDefending) damage *= 0.3;
                  if (playerRef.current.isDodging) damage = 0;
                  if (damage > 0) {
                    playerRef.current.hp -= damage;
                    triggerDamageFlash();
                  }
              }
          }} 
          onMiss={(id) => setProjectiles(prev => prev.filter(o => o.id !== id))} 
        />
      ))}
    </>
  );
};

export default GameScene;
