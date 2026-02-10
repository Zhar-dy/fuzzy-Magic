import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { 
  Sky, 
  Sparkles, 
  Torus, 
  Environment, 
  Grid, 
  Float, 
  ContactShadows,
  PerspectiveCamera,
  Stars
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
const ENEMY_STOP_DISTANCE = 2.2; // Prevents clipping into player
const ENEMY_SEPARATION_STRENGTH = 0.05;

// High-tech impact effect
const HitEffect: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.multiplyScalar(1.2);
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.opacity *= 0.8;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.6, 16, 16]} />
      <meshStandardMaterial 
        color="#ff2255" 
        transparent 
        opacity={1} 
        emissive="#ff0000" 
        emissiveIntensity={10} 
      />
    </mesh>
  );
};

const NPCMerchant: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh position={[0, 1, 0]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0} emissive="#fbbf24" emissiveIntensity={0.5} />
      </mesh>
    </Float>
    <mesh position={[0, 0.2, 0]}>
      <cylinderGeometry args={[0.5, 0.8, 0.4, 6]} />
      <meshStandardMaterial color="#222" metalness={0.8} />
    </mesh>
    <pointLight position={[0, 1.5, 0]} color="#fbbf24" intensity={2} distance={5} />
    <Sparkles count={30} scale={2} size={3} speed={0.4} color="#fbbf24" />
  </group>
);

const Projectile: React.FC<{ 
    id: number, 
    initialPosition: Vector3, 
    velocity: Vector3, 
    targets: React.RefObject<THREE.Group>[], 
    color: string, 
    onHit: (projId: number, targetId: string) => void, 
    onMiss: (id: number) => void 
}> = ({ id, initialPosition, velocity, targets, color, onHit, onMiss }) => {
  const ref = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  const pos = useRef(new THREE.Vector3(initialPosition.x, 1.2, initialPosition.z));
  const hitIds = useRef<Set<string>>(new Set());

  useFrame(() => {
    if (!ref.current) return;
    pos.current.x += velocity.x; 
    pos.current.z += velocity.z;
    ref.current.position.copy(pos.current);
    ref.current.rotation.y += 0.4;
    
    if (Date.now() - startTime.current > 3000) { onMiss(id); return; }
    
    targets.forEach(targetRef => {
        if (targetRef?.current) {
            const targetId = targetRef.current.name;
            if (hitIds.current.has(targetId)) return;
            const targetPos = targetRef.current.position;
            const dx = pos.current.x - targetPos.x;
            const dz = pos.current.z - targetPos.z;
            if (dx * dx + dz * dz < 3) {
                hitIds.current.add(targetId);
                onHit(id, targetId);
            }
        }
    });
  });

  return (
    <group ref={ref}>
      <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={8} />
      </mesh>
      <pointLight distance={4} intensity={5} color={color} />
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
      staffRef.current.rotation.x = isAttacking 
        ? THREE.MathUtils.lerp(staffRef.current.rotation.x, -2, 0.3) 
        : THREE.MathUtils.lerp(staffRef.current.rotation.x, 0.2, 0.1);
    }
    if (shieldRef.current) {
        shieldRef.current.visible = playerRef.current.isDefending;
        shieldRef.current.rotation.y += 0.05;
        shieldRef.current.scale.setScalar(THREE.MathUtils.lerp(shieldRef.current.scale.x, playerRef.current.isDefending ? 1 : 0, 0.2));
    }
    if (bodyRef.current && bodyRef.current.material instanceof THREE.MeshStandardMaterial) {
        if (playerRef.current.flashTimer > 0) {
            bodyRef.current.material.emissive.setHex(0xff0000);
            bodyRef.current.material.emissiveIntensity = playerRef.current.flashTimer * 2;
            playerRef.current.flashTimer--;
        } else {
            bodyRef.current.material.emissive.setHex(0x0044ff);
            bodyRef.current.material.emissiveIntensity = 0.5;
        }
    }
  });

  return (
    <group>
      <mesh ref={bodyRef} position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.4, 0.7, 4, 16]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.8} roughness={0.2} />
      </mesh>
      <group ref={staffRef} position={[0.6, 0.8, 0.2]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={10} />
        </mesh>
        <pointLight position={[0, 1.1, 0]} color="#22d3ee" intensity={2} distance={3} />
      </group>
      <group ref={shieldRef} scale={[0,0,0]}>
        <mesh position={[0, 0.8, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.9, 0.05, 16, 64]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={5} transparent opacity={0.6} />
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
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material instanceof THREE.MeshStandardMaterial) {
      if (isAttacking) {
        meshRef.current.material.emissive.setHex(0xff0000);
        meshRef.current.material.emissiveIntensity = 15 + Math.sin(state.clock.elapsedTime * 30) * 10;
        if (lightRef.current) lightRef.current.intensity = 10;
      } else {
        meshRef.current.material.emissive.setHex(0xff4444);
        meshRef.current.material.emissiveIntensity = 1.0;
        if (lightRef.current) lightRef.current.intensity = 1;
      }
    }
  });

  return (
    <group ref={enemyRef} name={enemyId} position={position}>
      <mesh ref={meshRef} position={[0, 1, 0]}>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.1, 32]} />
        <meshStandardMaterial color="#000" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1.5, 0]} color="#ff0000" intensity={1} distance={6} />
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
        newEnemies.push({ id, position: { x, y: 0, z }, hp: 50, maxHp: 50, energy: 100, color: '#ff2222' });
        enemyRefs.current[id] = React.createRef<THREE.Group>();
        aiInstances.current[id] = new FuzzyAI();
        enemyAttackCooldowns.current[id] = 0;
    }
    setEnemies(newEnemies);
    onLog("Boundary breached. Defense protocol active.", "info");
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
      onLog("Initiating repair cycle.", "info");
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
    playerRef.current.flashTimer = 20;
    setEffects(prev => [...prev, { id: Date.now() + Math.random(), pos: [playerRef.current.x, 1, playerRef.current.z] }]);
    setTimeout(() => {
        setEffects(prev => prev.slice(1));
    }, 800);
  };

  const performAttack = () => {
    if (!gameActive || playerRef.current.isAttacking) return;
    playerRef.current.isAttacking = true; 
    playerRef.current.attackTimer = 20;
    enemies.forEach(e => {
        const distSq = (e.position.x - playerRef.current.x)**2 + (e.position.z - playerRef.current.z)**2;
        if (distSq < 16) handleEnemyDamage(e.id, 12 * playerRef.current.damageMultiplier);
    });
  };

  const handleEnemyDamage = (enemyId: string, dmg: number) => {
    setEnemies(prev => {
        const target = prev.find(e => e.id === enemyId);
        if (!target) return prev;
        const newHp = Math.max(0, target.hp - dmg);
        if (newHp <= 0) {
            onLog(`Unit terminated. Credits retrieved.`, "combat");
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
        id: Date.now() + Math.random(),
        x: playerRef.current.x, z: playerRef.current.z, 
        vx: dir.x * 0.6, vz: dir.z * 0.6, color: "#22d3ee" 
    }]);
  };

  useFrame((state) => {
    if (!gameActive) return;
    const p = playerRef.current;
    
    // Update raycaster for mouse aim
    raycaster.setFromCamera(pointer, camera); 
    const intersect = new THREE.Vector3(); 
    raycaster.ray.intersectPlane(floorPlane.current, intersect); 
    mousePosRef.current.copy(intersect);

    p.isDefending = !!keys.current['KeyQ'];

    // Player Movement
    const move = new THREE.Vector3(0, 0, 0);
    if (!p.isHealing) {
        if (keys.current['KeyW']) move.z -= 1; if (keys.current['KeyS']) move.z += 1; if (keys.current['KeyD']) move.x += 1; if (keys.current['KeyA']) move.x -= 1;
    }
    
    let currentMoveSpeed = PLAYER_SPEED;
    if (p.isDodging) currentMoveSpeed *= 2.5;
    if (p.isDefending) currentMoveSpeed *= 0.3;

    if (move.length() > 0) move.normalize().multiplyScalar(currentMoveSpeed);
    p.x += move.x; p.z += move.z;

    // Timers
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
            onLog("Repair sequence finalized.", "info");
        }
    }
    if (p.magicCd > 0) p.magicCd--;

    const pDistSq = p.x*p.x + p.z*p.z;
    const isPlayerSafe = pDistSq < SAFE_ZONE_RADIUS**2;

    let primaryMetrics: FuzzyMetrics | null = null;
    const nextVisualStates: Record<string, { isAttacking: boolean }> = {};

    setEnemies(prev => {
        return prev.map(e => {
            const ai = aiInstances.current[e.id];
            if (!ai) return e;

            const dx = p.x - e.position.x;
            const dz = p.z - e.position.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            
            const metrics = ai.evaluate(
                Math.min(dist, 30), 
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

            // Separation force from other enemies
            const separation = new THREE.Vector3(0,0,0);
            prev.forEach(other => {
                if (other.id === e.id) return;
                const dEnemyX = e.position.x - other.position.x;
                const dEnemyZ = e.position.z - other.position.z;
                const dEnemyDistSq = dEnemyX*dEnemyX + dEnemyZ*dEnemyZ;
                if (dEnemyDistSq < 4) {
                    separation.x += (dEnemyX / dEnemyDistSq) * ENEMY_SEPARATION_STRENGTH;
                    separation.z += (dEnemyZ / dEnemyDistSq) * ENEMY_SEPARATION_STRENGTH;
                }
            });

            if (dCenterSq < (SAFE_ZONE_RADIUS + 0.2)**2) {
                const pushDir = new THREE.Vector2(newPos.x, newPos.z).normalize();
                newPos.x = pushDir.x * (SAFE_ZONE_RADIUS + 0.5);
                newPos.z = pushDir.y * (SAFE_ZONE_RADIUS + 0.5);
            } else if (!isPlayerSafe) {
                const angle = Math.atan2(dz, dx);
                
                // Aggression-based speed
                const baseChaseSpeed = 0.012; 
                const aggressionBonus = Math.max(0, (metrics.aggressionOutput - 20) * 0.003);
                const finalSpeed = baseChaseSpeed + aggressionBonus;

                const cooldown = enemyAttackCooldowns.current[e.id] || 0;
                
                // Attack logic
                if (dist < 3.2 && metrics.aggressionOutput > 40 && cooldown <= 0) {
                    nextVisualStates[e.id] = { isAttacking: true };
                    enemyAttackCooldowns.current[e.id] = 120; // 2 sec cooldown
                    
                    let damage = 10;
                    if (p.isDefending) damage *= 0.2;
                    if (p.isHealing) damage *= 1.5;
                    if (p.isDodging) damage = 0;

                    if (damage > 0) {
                      p.hp -= damage;
                      triggerDamageFlash();
                      onLog(`Integrity compromised: -${Math.floor(damage)} HP`, 'combat');
                    }
                    
                    // Smooth lunge with lerp
                    newPos.x = THREE.MathUtils.lerp(newPos.x, p.x, 0.2);
                    newPos.z = THREE.MathUtils.lerp(newPos.z, p.z, 0.2);
                } else if (dist > ENEMY_STOP_DISTANCE) {
                    // Normal chase
                    newPos.x += Math.cos(angle) * finalSpeed;
                    newPos.z += Math.sin(angle) * finalSpeed;
                    nextVisualStates[e.id] = { isAttacking: false };
                } else {
                    // Too close, stop
                    nextVisualStates[e.id] = { isAttacking: false };
                }

                if (enemyAttackCooldowns.current[e.id] > 0) {
                    enemyAttackCooldowns.current[e.id]--;
                }
            } else {
                newPos.x += (Math.random() - 0.5) * 0.02;
                newPos.z += (Math.random() - 0.5) * 0.02;
                nextVisualStates[e.id] = { isAttacking: false };
            }

            // Apply separation
            newPos.x += separation.x;
            newPos.z += separation.z;
            
            return { ...e, position: newPos, energy: Math.min(100, e.energy + 0.2) };
        });
    });

    setEnemyVisualStates(nextVisualStates);

    if (playerMesh.current) {
        playerMesh.current.position.set(p.x, 0, p.z);
        playerMesh.current.lookAt(mousePosRef.current.x, 0, mousePosRef.current.z);
    }
    
    // Smooth camera chase
    const targetCamPos = new THREE.Vector3(p.x, 15, p.z + 14);
    camera.position.lerp(targetCamPos, 0.08); 
    camera.lookAt(p.x, 0, p.z);
    
    if (p.hp <= 0) onGameOver(false);
    if (primaryMetrics) onMetricsUpdate(primaryMetrics);
    
    // Reliability Fix: Sync every frame
    onStatsUpdate({ ...p, position: { x: p.x, y: 0, z: p.z } }, enemies);
  });

  return (
    <>
      <color attach="background" args={['#020205']} />
      <fog attach="fog" args={['#020205', 10, 45]} />
      <Environment preset="city" />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
      
      {/* Visual Floor: Cyber Grid */}
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        fadeStrength={5} 
        cellSize={1} 
        sectionSize={5} 
        sectionColor="#22d3ee" 
        cellColor="#083344"
        position={[0, -0.01, 0]} 
      />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Visual Sanctuary Boundary */}
      <Torus args={[SAFE_ZONE_RADIUS, 0.05, 16, 128]} rotation={[Math.PI/2, 0, 0]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={5} transparent opacity={0.6} />
      </Torus>

      <NPCMerchant position={[0, 0, 0]} />
      
      <group ref={playerMesh}>
        <MagePlayer playerRef={playerRef} />
        <pointLight position={[0, 2, 0]} color="#3b82f6" intensity={1} distance={5} />
      </group>
      
      {enemies.map(e => (
        <GuardianEnemy 
          key={e.id} 
          enemyId={e.id} 
          enemyRef={enemyRefs.current[e.id] as any} 
          position={[e.position.x, 0, e.position.z]}
          isAttacking={enemyVisualStates[e.id]?.isAttacking || false}
          color={e.hp < 15 ? "#a855f7" : "#ff2222"} 
        />
      ))}

      {effects.map(eff => (
          <HitEffect key={eff.id} position={eff.pos} />
      ))}
      
      {projectiles.map(pr => (
        <Projectile 
          key={pr.id} 
          id={pr.id} 
          color={pr.color} 
          initialPosition={{ x: pr.x, y: 1.2, z: pr.z }} 
          velocity={{ x: pr.vx, y: 0, z: pr.vz }} 
          targets={Object.values(enemyRefs.current)} 
          onHit={(projId, targetId) => {
              handleEnemyDamage(targetId, 18 * playerRef.current.damageMultiplier);
              setProjectiles(prev => prev.filter(o => o.id !== projId));
          }} 
          onMiss={(id) => setProjectiles(prev => prev.filter(o => o.id !== id))} 
        />
      ))}

      <ContactShadows 
        position={[0, -0.01, 0]} 
        opacity={0.4} 
        scale={40} 
        blur={2} 
        far={4.5} 
      />
    </>
  );
};

export default GameScene;