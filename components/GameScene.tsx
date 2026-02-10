import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { Sky, Cloud, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { FuzzyAI } from '../services/fuzzyLogic';
import { PlayerState, EnemyState, FuzzyMetrics, Vector3 } from '../types';
import { generateEnemyBanter } from '../services/geminiService';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

const PLAYER_SPEED = 0.15;
const MAP_SIZE = 50;

// --- Environmental Hazards ---

interface ThornyBushProps {
  position: [number, number, number];
}

const ThornyBush: React.FC<ThornyBushProps> = ({ position }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#1a2e05" roughness={1} flatShading />
      </mesh>
      {[...Array(6)].map((_, i) => (
        <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]} position={[0, 0.4, 0]}>
          <coneGeometry args={[0.04, 1.4, 4]} />
          <meshStandardMaterial color="#2d1a0a" />
        </mesh>
      ))}
    </group>
  );
};

const GlowingMushroom: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(state.clock.elapsedTime * 4) * 1;
    }
  });

  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.4]} />
        <meshStandardMaterial color="#fef3c7" />
      </mesh>
      {/* Cap */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.5} />
        </mesh>
      </Float>
      <pointLight ref={lightRef} color="#a855f7" distance={4} />
      <Sparkles count={5} scale={1} size={2} speed={0.3} color="#d8b4fe" />
    </group>
  );
};

// --- Projectile System ---

interface ProjectileProps {
  id: number;
  initialPosition: Vector3;
  velocity: Vector3;
  targetRef: React.RefObject<THREE.Group>;
  onHit: (id: number) => void;
  onMiss: (id: number) => void;
}

const Projectile: React.FC<ProjectileProps> = ({ id, initialPosition, velocity, targetRef, onHit, onMiss }) => {
  const ref = useRef<THREE.Group>(null);
  const startTime = useRef(Date.now());
  const pos = useRef(new THREE.Vector3(initialPosition.x, 1.2, initialPosition.z));

  useFrame(() => {
    if (!ref.current) return;

    // Move
    pos.current.x += velocity.x;
    pos.current.z += velocity.z;
    ref.current.position.copy(pos.current);
    ref.current.rotation.x += 0.2;

    // Check lifetime
    if (Date.now() - startTime.current > 2500) {
      onMiss(id);
      return;
    }

    // Collision Check (internal for performance)
    if (targetRef.current) {
      const targetPos = targetRef.current.position;
      const dx = pos.current.x - targetPos.x;
      const dz = pos.current.z - targetPos.z;
      const distSq = dx * dx + dz * dz;
      if (distSq < 2.25) { // 1.5 meters radius
        onHit(id);
      }
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={4} />
      </mesh>
      <pointLight distance={3} intensity={2} color="#22d3ee" />
    </group>
  );
};

// --- Player & Enemy Models ---

const MagePlayer = ({ playerRef }: { playerRef: React.MutableRefObject<any> }) => {
  const staffRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (staffRef.current) {
      const { isAttacking } = playerRef.current;
      if (isAttacking) {
        staffRef.current.rotation.x = THREE.MathUtils.lerp(staffRef.current.rotation.x, -1.8, 0.4);
        staffRef.current.rotation.z = THREE.MathUtils.lerp(staffRef.current.rotation.z, 0.3, 0.4);
      } else {
        staffRef.current.rotation.x = THREE.MathUtils.lerp(staffRef.current.rotation.x, 0.2, 0.1);
        staffRef.current.rotation.z = THREE.MathUtils.lerp(staffRef.current.rotation.z, 0, 0.1);
        staffRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      }
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

const GuardianEnemy = ({ enemyRef, color }: { enemyRef: React.MutableRefObject<any>, color: string }) => {
  const bodyRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (bodyRef.current) {
      const { isAttacking, attackAnimTimer } = enemyRef.current;
      bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.15;
      let lungeZ = 0;
      if (isAttacking) lungeZ = Math.sin((1 - attackAnimTimer / 12) * Math.PI) * 2.5;
      bodyRef.current.position.z = THREE.MathUtils.lerp(bodyRef.current.position.z, lungeZ, 0.2);
    }
  });
  return (
    <group ref={bodyRef}>
      <mesh position={[0, 1, 0]}><icosahedronGeometry args={[0.8, 0]} /><meshStandardMaterial color={color} flatShading metalness={0.7} roughness={0.2} /></mesh>
      <mesh position={[0.3, 1.2, 0.5]}><boxGeometry args={[0.15, 0.05, 0.1]} /><meshBasicMaterial color="#fde047" /></mesh>
      <mesh position={[-0.3, 1.2, 0.5]}><boxGeometry args={[0.15, 0.05, 0.1]} /><meshBasicMaterial color="#fde047" /></mesh>
    </group>
  );
};

// --- Main Scene ---

const GameScene: React.FC<{ onMetricsUpdate: any, onLog: any, onStatsUpdate: any, gameActive: boolean, onGameOver: any }> = ({ onMetricsUpdate, onLog, onStatsUpdate, gameActive, onGameOver }) => {
  const playerRef = useRef({ x: 0, z: 5, vx: 0, vz: 0, hp: 100, magicCd: 0, recentAttacks: 0, isAttacking: false, attackTimer: 0 });
  const enemyRef = useRef({ x: 0, z: -5, hp: 100, maxHp: 100, isAttacking: false, attackAnimTimer: 0, attackCooldown: 0 });
  const enemyVelocity = useRef({ x: 0, z: 0 });
  const mousePosRef = useRef(new THREE.Vector3(0, 0, 0));
  const aiRef = useRef(new FuzzyAI());
  const keys = useRef<any>({});
  const { camera, raycaster, pointer } = useThree();
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  
  const [projectiles, setProjectiles] = useState<any[]>([]);
  const playerMesh = useRef<THREE.Group>(null);
  const enemyMesh = useRef<THREE.Group>(null);
  const lastBanterTime = useRef(0);

  const hazards = useMemo(() => [
    { type: 'bush', x: -8, z: -8 }, { type: 'bush', x: 8, z: -8 },
    { type: 'bush', x: -8, z: 8 }, { type: 'bush', x: 8, z: 8 },
    { type: 'shroom', x: -12, z: 0 }, { type: 'shroom', x: 12, z: 0 },
    { type: 'shroom', x: 0, z: -12 }
  ], []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === 'Space') performAttack();
      if (e.code === 'KeyE') spawnProjectile();
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [gameActive]);

  const performAttack = () => {
    if (!gameActive || playerRef.current.isAttacking) return;
    playerRef.current.isAttacking = true;
    playerRef.current.attackTimer = 15;
    playerRef.current.recentAttacks = Math.min(20, playerRef.current.recentAttacks + 2.5);
    const dist = Math.sqrt((enemyRef.current.x - playerRef.current.x) ** 2 + (enemyRef.current.z - playerRef.current.z) ** 2);
    if (dist < 4.0) {
      enemyRef.current.hp -= 8;
      onLog("Whacked the Guardian! -8 HP", 'combat');
      if (enemyRef.current.hp <= 0) onGameOver(true);
    }
  };

  const spawnProjectile = () => {
    if (!gameActive || playerRef.current.magicCd > 0) return;
    playerRef.current.magicCd = 120;
    const origin = new THREE.Vector3(playerRef.current.x, 0, playerRef.current.z);
    const dir = new THREE.Vector3().subVectors(mousePosRef.current, origin).normalize();
    const id = Date.now() + Math.random();
    setProjectiles(prev => [...prev, { id, x: playerRef.current.x, z: playerRef.current.z, vx: dir.x * 0.45, vz: dir.z * 0.45 }]);
    onLog("Casted Magic Missile!", 'combat');
  };

  const handleProjHit = (id: number) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
    enemyRef.current.hp -= 12;
    onLog("Magic Missile Impact! -12 HP", 'combat');
    if (enemyRef.current.hp <= 0) onGameOver(true);
  };

  const handleProjMiss = (id: number) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
  };

  useFrame((state) => {
    if (!gameActive) return;
    const p = playerRef.current;
    const e = enemyRef.current;

    // Input Handling
    raycaster.setFromCamera(pointer, camera);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(floorPlane.current, intersect);
    mousePosRef.current.copy(intersect);

    const move = new THREE.Vector3(0, 0, 0);
    if (keys.current['KeyW']) move.z -= 1;
    if (keys.current['KeyS']) move.z += 1;
    if (keys.current['KeyD']) move.x += 1;
    if (keys.current['KeyA']) move.x -= 1;
    if (move.length() > 0) move.normalize().multiplyScalar(PLAYER_SPEED);

    p.vx = THREE.MathUtils.lerp(p.vx, move.x, 0.1);
    p.vz = THREE.MathUtils.lerp(p.vz, move.z, 0.1);
    p.x += p.vx; p.z += p.vz;
    p.recentAttacks = Math.max(0, p.recentAttacks - 0.02);
    if (p.attackTimer > 0) p.attackTimer--; else p.isAttacking = false;
    if (p.magicCd > 0) p.magicCd--;

    // Hazard Collisions
    hazards.forEach(h => {
      const dist = Math.sqrt((p.x - h.x) ** 2 + (p.z - h.z) ** 2);
      if (dist < 1.2) {
        if (h.type === 'bush') p.hp -= 0.15;
        if (h.type === 'shroom') p.hp -= 0.05; // Shrooms also slow?
      }
    });
    if (p.hp <= 0) onGameOver(false);

    // AI Fuzzy Brain
    const distToPlayer = Math.sqrt((p.x - e.x) ** 2 + (p.z - e.z) ** 2);
    const metrics = aiRef.current.evaluate(distToPlayer, (e.hp / e.maxHp) * 100, p.recentAttacks, p.magicCd);

    // AI Movement Logic
    const angleToPlayer = Math.atan2(p.z - e.z, p.x - e.x);
    let speed = (metrics.aggressionOutput - 40) * 0.003;
    
    // Window of Opportunity: Charge faster if player just spent magic
    if (p.magicCd > 80) speed *= 1.4;

    let tx = Math.cos(angleToPlayer) * speed;
    let tz = Math.sin(angleToPlayer) * speed;

    // Strafe if player is armed (TacticalFear)
    if (metrics.fuzzyMagic.armed > 0.5) {
      const strafeAngle = angleToPlayer + Math.PI / 2;
      tx += Math.cos(strafeAngle) * 0.04;
      tz += Math.sin(strafeAngle) * 0.04;
    }

    // Hazard Avoidance
    hazards.forEach(h => {
      const dx = e.x - h.x;
      const dz = e.z - h.z;
      const hDist = Math.sqrt(dx * dx + dz * dz);
      if (hDist < 4.0) {
        const repulsion = (4.0 - hDist) * 0.015;
        tx += (dx / hDist) * repulsion;
        tz += (dz / hDist) * repulsion;
      }
    });

    enemyVelocity.current.x = THREE.MathUtils.lerp(enemyVelocity.current.x, tx, 0.08);
    enemyVelocity.current.z = THREE.MathUtils.lerp(enemyVelocity.current.z, tz, 0.08);
    e.x += enemyVelocity.current.x; e.z += enemyVelocity.current.z;

    // AI Combat
    if (distToPlayer < 3.5 && e.attackCooldown <= 0 && metrics.aggressionOutput > 45) {
      e.isAttacking = true; e.attackAnimTimer = 12; e.attackCooldown = 50;
      p.hp -= 6; onLog("The Guardian struck you!", 'combat'); if (p.hp <= 0) onGameOver(false);
    }
    if (e.attackAnimTimer > 0) e.attackAnimTimer--; else e.isAttacking = false;
    if (e.attackCooldown > 0) e.attackCooldown--;

    // Update Banter
    if (Date.now() - lastBanterTime.current > 12000) {
      lastBanterTime.current = Date.now();
      generateEnemyBanter(metrics.stateDescription, Math.floor(p.hp), Math.floor(e.hp)).then(t => onLog(`Guardian: "${t}"`, 'ai'));
    }

    // Scene Updates
    if (playerMesh.current) {
      playerMesh.current.position.set(p.x, 0, p.z);
      playerMesh.current.lookAt(mousePosRef.current.x, 0.75, mousePosRef.current.z);
    }
    if (enemyMesh.current) {
      enemyMesh.current.position.set(e.x, 0, e.z);
      enemyMesh.current.lookAt(p.x, 0, p.z);
    }
    state.camera.position.lerp(new THREE.Vector3(p.x, 15, p.z + 18), 0.1);
    state.camera.lookAt(p.x, 0, p.z);

    onMetricsUpdate(metrics);
    onStatsUpdate({ ...p, position: { x: p.x, y: 0, z: p.z } }, { ...e, position: { x: e.x, y: 0, z: e.z }, color: metrics.aggressionOutput > 70 ? '#dc2626' : '#d97706' });
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 5]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} />
      <Sky sunPosition={[100, 20, 100]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#064e3b" />
      </mesh>
      <Cloud opacity={0.2} speed={0.2} bounds={[10, 2, 2]} segments={20} position={[0, 12, -10]} />

      {hazards.map((h, i) => h.type === 'bush' ? 
        <ThornyBush key={i} position={[h.x, 0, h.z]} /> : 
        <GlowingMushroom key={i} position={[h.x, 0, h.z]} />
      )}

      <group ref={playerMesh}><MagePlayer playerRef={playerRef} /></group>
      <group ref={enemyMesh}><GuardianEnemy enemyRef={enemyRef} color={enemyRef.current.hp < 40 ? "#9333ea" : "#ef4444"} /></group>

      {projectiles.map(p => (
        <Projectile 
          key={p.id} 
          id={p.id} 
          initialPosition={{ x: p.x, y: 1.2, z: p.z }} 
          velocity={{ x: p.vx, y: 0, z: p.vz }} 
          targetRef={enemyMesh} 
          onHit={handleProjHit} 
          onMiss={handleProjMiss} 
        />
      ))}
    </>
  );
};

export default GameScene;
