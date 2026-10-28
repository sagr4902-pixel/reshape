import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Barbell, BattleRope, Kettlebell, Plate, PlyoBox, SlamBall } from "../../cgi/Equipment";
import { Studio, type CameraShot, type Vec3 } from "../../cgi/Studio";
import { useShake } from "../../components/Finish";
import { FPS } from "./timing";
import { GymSet, HazeCard, ImpactPuff, Rig } from "./Set";

// The seven 15-frame montage setups (one per beat). Each component reads its own shot-local
// frame (it lives inside a <Sequence>), so every move is frame-accurate.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp3 = (a: Vec3, b: Vec3, p: number): Vec3 => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p];
/** Continuous camera move across the 15-frame shot (ease-out so each cut lands with energy). */
const move = (f: number, len = 15) => interpolate(f, [0, len], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });

/** Studio with the montage defaults: stronger reflections so black rubber/iron keeps its shape. */
const Stage: React.FC<{ camera: CameraShot; fog?: [number, number]; env?: number; exposure?: number; children: React.ReactNode }> = ({
  camera,
  fog = [3, 14],
  env = 0.5,
  exposure = 1.1,
  children,
}) => (
  <Studio camera={camera} fog={fog} envIntensity={env} exposure={exposure}>
    {children}
  </Studio>
);

/** Wraps a CGI shot so it can shake after an impact without exposing the frame edge. */
const Shake: React.FC<{ at: number; amount?: number; decay?: number; children: React.ReactNode }> = ({ at, amount = 22, decay = 5, children }) => {
  const s = useShake(at, amount, decay);
  return (
    <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg) scale(1.04)` }}>{children}</AbsoluteFill>
  );
};

const PLATE_R = 0.225;

// ------------------------------------------------------------------ 1. barbell slam (the drop)
export const ShotBarbellSlam: React.FC = () => {
  const f = useCurrentFrame();
  const p = move(f);
  // the bar is on the floor at frame 0 (the drop), rebounds once and settles
  const bounce = f < 7 ? 0.04 * Math.sin((Math.PI * f) / 7) : f < 11 ? 0.009 * Math.sin((Math.PI * (f - 7)) / 4) : 0;
  const yaw = -0.55;
  const end = (x: number): Vec3 => [x * Math.cos(yaw), 0.02, -x * Math.sin(yaw)];
  return (
    <Shake at={0} amount={34} decay={4}>
      <Stage camera={{ position: lerp3([1.5, 0.62, 2.75], [1.3, 0.55, 2.4], p), target: [-0.05, 0.32, -0.05], fov: 40, roll: -0.03 }} fog={[3.5, 15]}>
        <Rig target={[0, 0.25, 0]} rimPos={[-1.8, 2.3, -2.4]} keyPos={[2.4, 2.6, 2.8]} rim={150} key_={45} top={30} shadow="rim" />
        <GymSet
          time={f / FPS + 3}
          racks={[{ position: [-2.4, 0, -3.8], rotation: [0, 0.3, 0] }, { position: [1.6, 0, -5.2], rotation: [0, -0.2, 0] }]}
          dust={{ center: [0, 1.0, -0.6], box: [4, 2, 3], count: 70 }}
        />
        <HazeCard position={[-0.6, 0.9, -2.6]} rotation={[0, 0.5, 0]} size={[5, 2.6]} opacity={0.22} />
        <Barbell position={[0, PLATE_R + bounce, 0]} rotation={[0, yaw, 0.004]} plates={[0.065, 0.065, 0.045]} />
        <ImpactPuff origin={end(0.8)} t={f} seed="slam-near" strength={1.1} />
        <ImpactPuff origin={end(-0.8)} t={f} seed="slam-far" strength={0.9} />
      </Stage>
    </Shake>
  );
};

// ------------------------------------------------------------------ 2. kettlebell row slider
export const ShotKettlebells: React.FC = () => {
  const f = useCurrentFrame();
  const p = move(f);
  return (
    <Stage
      camera={{ position: lerp3([2.45, 0.6, 2.0], [2.0, 0.55, 2.35], p), target: lerp3([0.1, 0.22, -0.7], [-0.25, 0.22, -0.75], p), fov: 32, roll: 0.02 }}
      fog={[3.5, 13]}
    >
      <Rig target={[0, 0.2, -0.6]} rimPos={[-2.5, 2.2, -2.5]} keyPos={[2.2, 2.6, 3]} rim={110} key_={30} top={18} shadow="rim" topPos={[0, 5, 0.5]} />
      <GymSet
        time={f / FPS + 6}
        racks={[{ position: [-2.6, 0, -4.4], rotation: [0, 0.4, 0] }]}
        dust={{ center: [0, 1.0, -1], box: [5, 2, 4], count: 70 }}
      />
      <HazeCard position={[-1.2, 0.8, -3.2]} rotation={[0, 0.7, 0]} size={[5, 2.4]} opacity={0.2} />
      {Array.from({ length: 7 }, (_, i) => (
        <Kettlebell key={i} scale={1.2} position={[1.2 - i * 0.45, 0.12, -i * 0.35]} rotation={[0, 0.4 + i * 0.05, 0]} accent={i === 0} />
      ))}
    </Stage>
  );
};

// ------------------------------------------------------------------ 3. battle ropes, 3/4 side view
export const ShotRopes: React.FC = () => {
  const f = useCurrentFrame();
  const p = move(f);
  const time = f / FPS + 0.35;
  return (
    <Stage camera={{ position: lerp3([0.55, 0.5, 1.7], [0.4, 0.46, 1.5], p), target: [-1.3, 0.42, -0.05], fov: 44, roll: -0.05 }} fog={[3, 11]}>
      <Rig target={[-1.0, 0.3, 0]} rimPos={[-1.6, 2.4, -2.6]} keyPos={[1.6, 2.2, 2.8]} rim={170} key_={45} top={22} shadow="rim" angle={0.7} />
      <GymSet
        time={time + 2}
        racks={[{ position: [-3.8, 0, -2.8], rotation: [0, 0.2, 0] }]}
        dust={{ center: [-1.2, 1.0, -0.4], box: [5, 2, 3], count: 70 }}
      />
      <HazeCard position={[-3.4, 0.55, -2.6]} rotation={[0, 0.76, 0]} size={[6, 2.2]} opacity={0.34} />
      <BattleRope anchor={[-3.0, 0.12, -0.28]} handle={[0.9, 0.8, -0.22]} time={time} amplitude={0.3} frequency={1.9} radius={0.026} />
      <BattleRope anchor={[-3.0, 0.12, 0.04]} handle={[0.9, 0.8, 0.24]} time={time} amplitude={0.3} frequency={1.9} phase={Math.PI} radius={0.026} />
      {/* anchor post */}
      <mesh position={[-3.05, 0.3, -0.12]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.6, 24]} />
        <meshStandardMaterial color="#1b1b1e" metalness={0.6} roughness={0.5} />
      </mesh>
    </Stage>
  );
};

// ------------------------------------------------------------------ 4. slam ball bounce
const BALL_R = 0.18;
const ballY = (f: number) => {
  // contact on the cut (frame 0), a rebound, a smaller second hop
  const t = f / FPS;
  const h1 = 2.0 * t - 0.5 * 9.81 * t * t;
  if (h1 >= 0) return h1;
  const t2 = t - (2 * 2.0) / 9.81;
  return Math.max(0, 0.9 * t2 - 0.5 * 9.81 * t2 * t2);
};
export const ShotSlamBall: React.FC = () => {
  const f = useCurrentFrame();
  const p = move(f);
  const y = BALL_R + ballY(f);
  const squash = interpolate(f, [0, 1.5, 4], [0.72, 0.88, 1], clamp);
  return (
    <Shake at={0} amount={20} decay={4}>
      <Stage camera={{ position: lerp3([0.62, 0.5, 1.5], [0.55, 0.44, 1.32], p), target: [0, 0.4, 0], fov: 38, roll: 0.03 }} fog={[3, 11]}>
        <Rig target={[0, 0.2, 0]} rimPos={[-1.4, 1.9, -1.8]} keyPos={[1.8, 2.0, 2.2]} rim={140} key_={40} top={24} shadow="rim" />
        <GymSet
          time={f / FPS + 9}
          racks={[{ position: [-1.9, 0, -3.8], rotation: [0, 0.25, 0] }]}
          dust={{ center: [0, 0.9, -0.8], box: [4, 2, 3], count: 70 }}
        />
        <HazeCard position={[0, 0.7, -2.4]} size={[4, 2.2]} opacity={0.26} />
        <group position={[0, y, 0]} scale={[1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash)]}>
          <group rotation={[0.35 - f * 0.06, 0.5, 0.2]}>
            <SlamBall position={[0, 0, 0]} radius={BALL_R} />
          </group>
        </group>
        <PlyoBox position={[-1.05, 0.3, -1.6]} rotation={[0, 0.35, 0]} />
        <PlyoBox position={[1.0, 0.3, -2.0]} rotation={[0, -0.25, 0]} />
        <ImpactPuff origin={[0, 0.01, 0]} t={f} seed="ball" spread={0.8} />
      </Stage>
    </Shake>
  );
};

// ------------------------------------------------------------------ 5. barbell lift-off ("raise")
export const ShotLiftOff: React.FC = () => {
  const f = useCurrentFrame();
  const p = move(f);
  const lift = interpolate(f, [1, 15], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const y = PLATE_R + lift * 0.4;
  return (
    <Stage
      camera={{ position: lerp3([1.7, 0.18, 2.3], [1.55, 0.26, 2.1], p), target: lerp3([0.05, 0.42, 0], [0.05, 0.56, 0], p), fov: 40, roll: 0.04 }}
      fog={[3.5, 14]}
    >
      <Rig target={[0, 0.4, 0]} rimPos={[-1.4, 2.8, -2.2]} keyPos={[2.4, 1.8, 2.6]} rim={160} key_={40} top={22} shadow="rim" />
      <GymSet
        time={f / FPS + 12}
        racks={[{ position: [-2.2, 0, -4.2], rotation: [0, 0.2, 0] }, { position: [2.0, 0, -5.4], rotation: [0, -0.3, 0] }]}
        dust={{ center: [0, 1.0, -0.8], box: [4, 2, 3], count: 70 }}
      />
      <HazeCard position={[-0.4, 1.0, -2.6]} rotation={[0, 0.4, 0]} size={[5, 2.6]} opacity={0.22} />
      <Barbell position={[0, y, 0]} rotation={[0, -0.42, 0]} plates={[0.065, 0.065, 0.045]} />
      <ImpactPuff origin={[0.72, 0.02, 0.33]} t={f - 1} seed="lift" strength={0.55} spread={0.7} />
      <ImpactPuff origin={[-0.72, 0.02, -0.33]} t={f - 1} seed="lift2" strength={0.45} spread={0.7} />
    </Stage>
  );
};

// ------------------------------------------------------------------ 6. plate loaded onto the sleeve ("level")
export const ShotPlateLoad: React.FC = () => {
  const f = useCurrentFrame();
  const p = move(f);
  const HIT = 5;
  const seat = 0.655 + 0.04 + 2 * 0.069 + 0.0325;
  const slide = interpolate(f, [0, HIT], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const rebound = f > HIT && f < HIT + 6 ? 0.012 * Math.sin((Math.PI * (f - HIT)) / 6) : 0;
  const x = 1.4 + (seat - 1.4) * slide + rebound;
  return (
    <Shake at={HIT} amount={14} decay={3}>
      <Stage camera={{ position: lerp3([1.8, 0.78, 1.62], [1.68, 0.7, 1.42], p), target: [1.0, 0.3, 0], fov: 36, roll: -0.04 }} fog={[2.5, 11]}>
        <Rig target={[0.95, 0.22, 0]} rimPos={[0.4, 2.2, -2.2]} keyPos={[2.6, 2.4, 2.0]} rim={140} key_={45} top={22} shadow="rim" />
        <GymSet
          time={f / FPS + 15}
          racks={[{ position: [-0.4, 0, -3.2], rotation: [0, 0.3, 0] }]}
          dust={{ center: [0.8, 0.9, -0.8], box: [3, 2, 3], count: 60 }}
        />
        <HazeCard position={[0.4, 0.6, -2.2]} rotation={[0, 0.3, 0]} size={[4, 2.2]} opacity={0.22} />
        <Barbell position={[0, PLATE_R, 0]} plates={[0.065, 0.065]} />
        <Plate position={[x, PLATE_R, 0]} rotation={[0, 0, Math.PI / 2]} thickness={0.065} />
        <ImpactPuff origin={[seat, 0.02, 0.12]} t={f - HIT} seed="plate" strength={0.5} spread={0.5} grains={60} clouds={8} />
      </Stage>
    </Shake>
  );
};

// ------------------------------------------------------------------ 7. the training floor, wide push-in
export const ShotFloorWide: React.FC = () => {
  const f = useCurrentFrame();
  const p = move(f, 15);
  return (
    <Stage camera={{ position: lerp3([0.35, 1.35, 5.8], [0.2, 1.15, 4.6], p), target: [0, 0.7, -1.6], fov: 44 }} fog={[5, 17]} env={0.45}>
      <Rig target={[0, 0.3, -0.8]} rimPos={[0, 3.2, -4.5]} keyPos={[2.8, 3, 3.5]} rim={170} key_={40} top={30} topPos={[0, 5, 0]} shadow="top" angle={0.7} />
      <GymSet
        time={f / FPS + 18}
        racks={[
          { position: [-2.4, 0, -3.6], rotation: [0, 0.15, 0] },
          { position: [2.4, 0, -3.6], rotation: [0, -0.15, 0] },
          { position: [-2.4, 0, -7], rotation: [0, 0.15, 0] },
          { position: [2.4, 0, -7], rotation: [0, -0.15, 0] },
        ]}
        lineZ={-9}
        lineY={1.6}
        shafts={[
          { position: [-1.4, 2.6, -2.5], rotation: [0, 0, -0.2], opacity: 0.06 },
          { position: [1.4, 2.6, -2.5], rotation: [0, 0, 0.2], opacity: 0.06 },
        ]}
        dust={{ center: [0, 1.4, -1], box: [6, 2.6, 6], count: 90, size: 0.06 }}
      />
      <Barbell position={[0, PLATE_R, 0.2]} rotation={[0, 0.06, 0]} plates={[0.065, 0.065, 0.045]} />
      {Array.from({ length: 5 }, (_, i) => (
        <Kettlebell key={i} scale={1.2} position={[-1.8 + i * 0.42, 0.12, -1.3]} rotation={[0, 0.3, 0]} accent={i === 2} />
      ))}
      <PlyoBox position={[1.75, 0.3, -1.2]} rotation={[0, -0.3, 0]} />
      <PlyoBox position={[1.7, 0.9, -1.25]} rotation={[0, -0.2, 0]} size={[0.6, 0.6, 0.45]} />
      <SlamBall position={[-1.0, 0.15, 0.6]} />
      <SlamBall position={[1.15, 0.15, 0.9]} />
    </Stage>
  );
};
