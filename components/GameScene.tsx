import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Float, Sparkles, Torus } from '@react-three/drei';
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

const ThornyBush: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.4, 0]}><sphereGeometry args={[0.5, 8, 8]} /><meshStandardMaterial color="#1a2e05" roughness={1} flatShading /></mesh>
    {[...Array(6)].map((_, i) => (
      <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]} position={[0, 0.4, 0]}>
        <coneGeometry args={[0.04, 1.4, 4]} /><meshStandardMaterial color="#2d1a0a" />
      </mesh>
    ))}
  </group>
);

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
  useFrame(() => {
    if (staffRef.current) {
      const { isAttacking } = playerRef.current;
      staffRef.current.rotation.x = isAttacking ? THREE.MathUtils.lerp(staffRef.current.rotation.x, -1.8, 0.4) : THREE.MathUtils.lerp(staffRef.current.rotation.x, 0.2, 0.1);
    }
  });
  return (
    <group>
      <mesh position={[0, 0.75, 0]}><coneGeometry args={[0.45, 1.5, 8]} /><meshStandardMaterial color="#3b82f6" /></mesh>
      <mesh position={[0, 1.4, 0]}><sphereGeometry args={[0.25]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
      <group ref={staffRef} position={[0.5, 0.8, 0.3]}>
        <mesh><cylinderGeometry args={[0.02, 0.03, 1.8]} /><meshStandardMaterial color="#422006" /></mesh>
        <mesh position={[0, 0.9, 0]}><dodecahedronGeometry args={[0.12]} /><meshStandardMaterial color="#22d3ee" emissive="#22d3ee" /></mesh>
      </group>
    </group>
  );
};

const GuardianEnemy = ({ enemyId, enemyRef, color }: { enemyId: string, enemyRef: React.RefObject<THREE.Group>, color: string }) => (
  <group ref={enemyRef} name={enemyId}>
    <mesh position={[0, 1, 0]}><icosahedronGeometry args={[0.8, 0]} /><meshStandardMaterial color={color} flatShading metalness={0.7} roughness={0.2} /></mesh>
    <mesh position={[0.3, 1.2, 0.5]}><boxGeometry args={[0.15, 0.05, 0.1]} /><meshBasicMaterial color="#fde047" /></mesh>
    <mesh position={[-0.3, 1.2, 0.5]}><boxGeometry args={[0.15, 0.05, 0.1]} /><meshBasicMaterial color="#fde047" /></mesh>
  </group>
);

const GameScene: React.FC<{ 
    onMetricsUpdate: any, onLog: any, onStatsUpdate: any, 
    gameActive: boolean, onGameOver: any, playerStateExt: PlayerState, onOpenShop: () => void
}> = ({ onMetricsUpdate, onLog, onStatsUpdate, gameActive, onGameOver, playerStateExt, onOpenShop }) => {
  const playerRef = useRef({ ...playerStateExt, x: 0, z: 5, isAttacking: false, attackTimer: 0 });
  const [enemies, setEnemies] = useState<EnemyState[]>([]);
  const enemyRefs = useRef<{ [key: string]: React.RefObject<THREE.Group> }>({});
  const aiInstances = useRef<{ [key: string]: FuzzyAI }>({});
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
        // Spawn 15m away from safe zone
        const radius = SAFE_ZONE_RADIUS + 15 + (Math.random() * 2); 
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        newEnemies.push({ id, position: { x, y: 0, z }, hp: 50, maxHp: 50, energy: 100, color: '#ff4444' });
        enemyRefs.current[id] = React.createRef<THREE.Group>();
        aiInstances.current[id] = new FuzzyAI();
    }
    setEnemies(newEnemies);
    onLog("Guardians detected stalking the perimeter.", "info");
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
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameActive, enemies]);

  const handleContextKey = () => {
    const distSq = playerRef.current.x**2 + playerRef.current.z**2;
    // Context Switch logic
    if (distSq < SAFE_ZONE_RADIUS**2) {
      onOpenShop();
    } else {
      spawnPlayerProjectile();
    }
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
            onLog(`Guardian purged! +100g`, "combat");
            playerRef.current.gold += 100;
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

    const move = new THREE.Vector3(0, 0, 0);
    if (keys.current['KeyW']) move.z -= 1; if (keys.current['KeyS']) move.z += 1; if (keys.current['KeyD']) move.x += 1; if (keys.current['KeyA']) move.x -= 1;
    if (move.length() > 0) move.normalize().multiplyScalar(PLAYER_SPEED);
    p.x += move.x; p.z += move.z;
    if (p.attackTimer > 0) p.attackTimer--; else p.isAttacking = false;
    if (p.magicCd > 0) p.magicCd--;

    const distSq = p.x*p.x + p.z*p.z;
    const isPlayerSafe = distSq < SAFE_ZONE_RADIUS**2;

    let primaryMetrics: FuzzyMetrics | null = null;
    setEnemies(prev => prev.map(e => {
        const ai = aiInstances.current[e.id];
        if (!ai) return e;
        const distToPlayer = Math.sqrt((p.x - e.position.x) ** 2 + (p.z - e.position.z) ** 2);
        
        // AI still evaluates distance, but we clamp it so far-away enemies still "think" about stalking
        const effectiveDistForAI = isPlayerSafe ? 100 : Math.min(distToPlayer, 30);
        const metrics = ai.evaluate(effectiveDistForAI, (e.hp / 50) * 100, p.hp, p.magicCd, 10, e.energy);
        if (!primaryMetrics) primaryMetrics = metrics;

        const newPos = { ...e.position };
        const dCenter = Math.sqrt(newPos.x*newPos.x + newPos.z*newPos.z);
        
        // Safe Zone Logic: Push enemy out and prevent them from entering
        if (dCenter < SAFE_ZONE_RADIUS + 0.5) {
            const pushDir = new THREE.Vector2(newPos.x, newPos.z).normalize();
            newPos.x = pushDir.x * (SAFE_ZONE_RADIUS + 1.0);
            newPos.z = pushDir.y * (SAFE_ZONE_RADIUS + 1.0);
        } else if (!isPlayerSafe) {
            // "Always Chase" logic: 
            // We use a base minimum chase speed + aggression scaled speed
            const angle = Math.atan2(p.z - e.position.z, p.x - e.position.x);
            // Higher minimum speed to ensure they always move toward player
            const chaseSpeed = 0.02 + Math.max(0, (metrics.aggressionOutput - 20) * 0.007); 
            newPos.x += Math.cos(angle) * chaseSpeed;
            newPos.z += Math.sin(angle) * chaseSpeed;
            
            // Damage check
            if (distToPlayer < 2.5 && metrics.aggressionOutput > 40) p.hp -= 0.18;
        } else {
          // If player is safe, they wander at the edge
          newPos.x += (Math.random() - 0.5) * 0.01;
          newPos.z += (Math.random() - 0.5) * 0.01;
        }
        
        return { ...e, position: newPos, energy: Math.min(100, e.energy + 0.25) };
    }));

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
      
      {/* Enhanced visual Safe Zone */}
      <Torus args={[SAFE_ZONE_RADIUS, 0.15, 16, 100]} rotation={[Math.PI/2, 0, 0]} position={[0, 0.1, 0]}>
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={5} transparent opacity={0.6} />
      </Torus>
      <NPCMerchant position={[0, 0, 0]} />
      
      <group ref={playerMesh}><MagePlayer playerRef={playerRef} /></group>
      
      {enemies.map(e => <GuardianEnemy key={e.id} enemyId={e.id} enemyRef={enemyRefs.current[e.id] as any} color={e.hp < 15 ? "#a855f7" : "#ef4444"} />)}
      
      {projectiles.map(pr => (
        <Projectile 
          key={pr.id} id={pr.id} color={pr.color} initialPosition={{ x: pr.x, y: 1.2, z: pr.z }} velocity={{ x: pr.vx, y: 0, z: pr.vz }} 
          isPlayer={pr.isPlayer} targets={pr.isPlayer ? Object.values(enemyRefs.current) : [playerMesh as any]} 
          onHit={(projId, targetId) => {
              if (pr.isPlayer) handleEnemyDamage(targetId, 15 * playerRef.current.damageMultiplier);
              else playerRef.current.hp -= 12;
          }} 
          onMiss={(id) => setProjectiles(prev => prev.filter(o => o.id !== id))} 
        />
      ))}
    </>
  );
};

export default GameScene;