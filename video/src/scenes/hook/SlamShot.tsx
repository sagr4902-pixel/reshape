import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { AccentLine, CeilingStrips, LightShaft } from "../../cgi/Atmosphere";
import { Barbell, Kettlebell, PlyoBox, Rack } from "../../cgi/Equipment";
import type { CameraShot, Vec3 } from "../../cgi/Studio";
import { useShake } from "../../components/Finish";
import { COLORS } from "../../lib/brand";
import { local, TIMELINE, wordAt } from "../../lib/timeline";
import { hazeTex } from "./hookTextures";
import { ImpactDust, Motes } from "./Particles";
import { Stage } from "./Stage";

// SHOT 2 - "hook_lift": a loaded barbell lands on the platform exactly on the SLAM hit
// (local frame 0 of this shot = scene frame 75), rebounds once and settles while dust is
// thrown off the floor. At local frame 30 (scene 105, on the beat) we cut to a low hero
// angle along the bar, which accelerates into the plate for the hand-off to the brand reveal.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const CUT_B = 30; // local frame of the second angle
/** local frame of the "تشكيلك" slam (scene frame 129) */
export const ACCENT = local("hook", wordAt("تشكيلك")) - local("hook", TIMELINE.hits.hookSlam);
const PLATES = [0.065, 0.065, 0.045];
const PLATE_R = 0.225;
const BAR_YAW = -0.5;

/** Rebound of the bar after touching down at lf = 0 (metres). */
const rebound = (lf: number) => {
  if (lf < 0) return 0;
  if (lf < 9) {
    const u = lf / 9;
    return 0.062 * 4 * u * (1 - u);
  }
  if (lf < 15) {
    const u = (lf - 9) / 6;
    return 0.014 * 4 * u * (1 - u);
  }
  return 0;
};

const lerp3 = (a: Vec3, b: Vec3, t: number) => a.map((v, i) => v + (b[i] - v) * t) as Vec3;

const Rig: React.FC<{ lf: number; angleB: boolean }> = ({ lf, angleB }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(0, 0.25, 0);
  // light pulse on impact, then a slow riser build towards the brand hit
  const hit = Math.exp(-Math.max(0, lf) / 5);
  const accent = lf >= ACCENT ? Math.exp(-(lf - ACCENT) / 6) : 0;
  const build = interpolate(lf, [40, 104], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const rimPos: Vec3 = angleB ? [2.3, 2.0, -1.2] : [-2.2, 2.1, -2.6];
  return (
    <>
      <primitive object={tgt} />
      <spotLight
        position={rimPos}
        target={tgt}
        color={COLORS.orange}
        intensity={62 * (1 + 0.6 * hit + 0.5 * build + 0.5 * accent)}
        angle={0.6}
        penumbra={0.85}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <spotLight position={angleB ? [-2.6, 1.5, 1.2] : [2.4, 2.4, 2.6]} target={tgt} color="#dfe6ff" intensity={angleB ? 16 : 22} angle={0.6} penumbra={1} decay={2} />
      <pointLight position={[0.2, 3.2, 0.4]} color="#fff2e6" intensity={12} decay={2} />
      {/* low orange kicker that skims the floor and the plate edges */}
      <pointLight position={[1.4, 0.18, -1.6]} color="#ff6a33" intensity={2.2 + 3 * hit} decay={2} />
      <ambientLight intensity={0.03} />
    </>
  );
};

/** Fake volumetric haze glowing behind the set: silhouettes racks and gives the fog depth. */
const HazeCard: React.FC<{ position: Vec3; rotation: Vec3; size: number; opacity: number }> = ({ position, rotation, size, opacity }) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={[size, size * 0.6]} />
    <meshBasicMaterial map={hazeTex()} color="#ff7a45" transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
  </mesh>
);

const Set: React.FC<{ lf: number }> = ({ lf }) => {
  const t = (lf + 75) / 30;
  const y = PLATE_R + rebound(lf);
  const settle = 1 - Math.exp(-Math.max(0, lf) / 9);
  const tilt = lf >= 0 ? 0.018 * Math.sin(lf * 0.85) * Math.exp(-lf / 5) : 0;
  const origins = useMemo<Vec3[]>(() => [
    [0.76, 0, 0.05],
    [0.76, 0, -0.05],
    [-0.76, 0, 0.05],
    [-0.76, 0, -0.05],
  ], []);
  return (
    <>
      <CeilingStrips y={4.2} rows={8} />
      <AccentLine position={[0, 1.35, -7.5]} width={18} glow={1.4} />
      <AccentLine position={[-6.5, 0.9, -2]} width={10} rotation={[0, Math.PI / 2, 0]} glow={0.9} />
      {/* backdrop for the second angle (looking down the bar towards +X) */}
      <AccentLine position={[7.2, 1.25, 0]} width={16} rotation={[0, -Math.PI / 2, 0]} glow={1.4} />
      <Rack position={[4.3, 0, -1.5]} rotation={[0, 0.2, 0]} />
      <Rack position={[5.2, 0, 1.6]} rotation={[0, -0.15, 0]} />
      <LightShaft position={[3.4, 3.0, 0.3]} rotation={[0.25, 0, 0.1]} length={5.6} radius={1.4} opacity={0.07} />
      <Rack position={[-4.3, 0, -2.9]} rotation={[0, 0.25, 0]} />
      <Rack position={[2.5, 0, -4.6]} rotation={[0, -0.3, 0]} />
      <Rack position={[0.2, 0, -6.4]} rotation={[0, 0.1, 0]} />
      <PlyoBox position={[-1.5, 0.3, -2.4]} rotation={[0, 0.5, 0]} />
      {[0, 1, 2].map((i) => (
        <Kettlebell key={i} position={[1.35 + i * 0.32, 0.1, -2.2 - i * 0.18]} rotation={[0, 0.5, 0]} accent={i === 0} />
      ))}
      <LightShaft position={[-0.9, 3.0, -0.8]} rotation={[0, 0, -0.32]} length={5.4} radius={1.3} opacity={0.085} />
      <LightShaft position={[1.3, 3.2, -2.4]} rotation={[0.1, 0, 0.28]} length={5.6} radius={1.1} opacity={0.05} color="#ffe2cf" />
      <HazeCard position={[-3.0, 1.6, -5.5]} rotation={[0, 0.55, 0]} size={7} opacity={0.22} />
      <HazeCard position={[5.5, 1.5, 0.2]} rotation={[0, -Math.PI / 2, 0]} size={7} opacity={0.26} />
      <group rotation={[0, BAR_YAW, 0]}>
        <group position={[0, y, 0.035 * settle]} rotation={[0, 0, tilt]}>
          <Barbell plates={PLATES} />
        </group>
        <ImpactDust t={lf / 30} origins={origins} />
      </group>
      <Motes count={200} time={t} box={[5, 2.6, 5]} center={[0, 1.3, -0.6]} size={0.02} opacity={0.32} seed={21} color="#ffcfb0" />
      <Motes count={30} time={t} box={[2.4, 1.2, 2]} center={[0.5, 0.6, 0.6]} size={0.05} opacity={0.08} seed={5} sprite="bokeh" color="#ffb48f" />
    </>
  );
};

/** bar-local (x along the bar) -> world, so camera moves can be authored relative to the bar */
const W = (p: Vec3): Vec3 => {
  const c = Math.cos(BAR_YAW);
  const s = Math.sin(BAR_YAW);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

export const slamCamera = (lf: number): CameraShot => {
  if (lf < CUT_B) {
    // A: low 3/4 view, slow push
    const p = Easing.out(Easing.quad)(interpolate(lf, [0, CUT_B], [0, 1], clamp));
    return { position: lerp3([1.42, 0.14, 2.05], [1.22, 0.15, 1.72], p), target: [0.05, 0.4, 0], fov: 36, roll: 0 };
  }
  // B: low hero from beyond the left plates looking down the bar; slow push, then the last
  // ~12 frames accelerate forward and whip left for the hand-off into the brand reveal.
  const slow = interpolate(lf, [CUT_B, 93], [0, 1], clamp);
  const fast = whip(lf);
  const base = lerp3([-1.5, 0.12, 0.74], [-1.36, 0.13, 0.64], slow);
  // plunge down the bar onto the far sleeve, where the exit flare ignites
  const pos = lerp3(base, [-0.05, 0.215, 0.34], fast);
  const target = lerp3([0.15, 0.3, -0.12], [1.0, 0.225, 0.0], Math.pow(fast, 0.7));
  return { position: W(pos), target: W(target), fov: 38 - 8 * fast, roll: 0.03 - 0.1 * fast };
};

/** 0 -> 1 ease-in over the last 12 frames of the scene (local 93..104). */
export const whip = (lf: number) => Easing.in(Easing.cubic)(interpolate(lf, [93, 104], [0, 1], clamp));

export const SlamShot: React.FC = () => {
  const lf = useCurrentFrame(); // 0 = the slam
  const angleB = lf >= CUT_B;
  const cam = slamCamera(lf);
  const shakeHit = useShake(0, 34, 7);
  const shakeWord = useShake(ACCENT, 10, 4);
  const shake = { x: shakeHit.x + shakeWord.x, y: shakeHit.y + shakeWord.y, r: shakeHit.r + shakeWord.r };
  const fast = whip(lf);
  const zblur = fast * fast * 7;
  return (
    <AbsoluteFill style={{ background: "#0b0b0d", overflow: "hidden" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="hk-wblur" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={`${zblur * 2.2} ${zblur}`} />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg) scale(${1.04 + fast * 0.1})`,
          filter: zblur > 0.3 ? "url(#hk-wblur)" : undefined,
        }}
      >
        <Stage width={1080} height={1920} camera={cam} env="gym" envIntensity={0.45} fog={[4, 17]}>
          <Rig lf={lf} angleB={angleB} />
          <Set lf={lf} />
        </Stage>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
