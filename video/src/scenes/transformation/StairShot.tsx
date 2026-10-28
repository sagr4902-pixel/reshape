import React, { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import * as THREE from "three";
import { CeilingStrips, Dust, LightShaft } from "../../cgi/Atmosphere";
import { Rack, useRubber, useSteel } from "../../cgi/Equipment";
import { useWarmIron } from "./Iron";
import { Studio, type CameraShot, type Vec3 } from "../../cgi/Studio";
import { PlateStack, stackHeight, type StackDef } from "./PlateStack";
import { STEP_NOTES } from "./timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** From thin change plates (bottom step) to heavy bumper plates (top step). */
export const STEPS: StackDef[] = [
  { r: 0.1, t: 0.018, n: 5, kind: "iron" },
  { r: 0.13, t: 0.022, n: 9, kind: "iron" },
  { r: 0.16, t: 0.03, n: 11, kind: "iron" },
  { r: 0.19, t: 0.04, n: 12, kind: "rubber" },
  { r: 0.225, t: 0.05, n: 12, kind: "rubber" },
  { r: 0.225, t: 0.075, n: 10, kind: "rubber" },
];

/** Step centres on the floor: the staircase climbs away from camera (-Z) with a gentle drift. */
export const STEP_POS: Vec3[] = (() => {
  const out: Vec3[] = [];
  let z = 0;
  STEPS.forEach((s, i) => {
    if (i > 0) z -= STEPS[i - 1].r + s.r + 0.03;
    out.push([-0.035 * i, 0, z]);
  });
  return out;
})();

export const STEP_TOP = STEPS.map(stackHeight);

/** Light level of step i at `frame`: fast attack on its bell note, bell-like decay to a held level. */
export const stepLight = (i: number, frame: number) => {
  const n = STEP_NOTES[i];
  if (frame < n - 1) return 0;
  const attack = interpolate(frame, [n - 1, n + 3], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const ring = Math.exp(-Math.max(0, frame - n) / 12);
  const next = STEP_NOTES[i + 1];
  const settle = next === undefined ? 1 : interpolate(frame, [next, next + 24], [1, 0.72], clamp);
  return attack * (0.78 + 0.55 * ring) * settle;
};

/** Bell "strike" envelope of step i: the visible beam flares on the note and fades out. */
const stepRing = (i: number, frame: number) => {
  const n = STEP_NOTES[i];
  if (frame < n - 1) return 0;
  const attack = interpolate(frame, [n - 1, n + 2], [0, 1], clamp);
  return attack * Math.exp(-Math.max(0, frame - n) / 16);
};

const Spot: React.FC<{
  position: Vec3;
  target: Vec3;
  color: string;
  intensity: number;
  angle?: number;
  penumbra?: number;
  shadow?: boolean;
}> = ({ position, target, color, intensity, angle = 0.4, penumbra = 0.8, shadow = false }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...target);
  return (
    <>
      <primitive object={tgt} />
      <spotLight
        position={position}
        target={tgt}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        decay={2}
        castShadow={shadow}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </>
  );
};

/** Look-dev switch: every step lit. */
const DEBUG = false;

const stairCamera = (frame: number): CameraShot => {
  // continuous crane: from low beside the first step up to a high three-quarter view of the
  // whole staircase, so the camera "climbs" with the light
  const p = interpolate(frame, [0, 119], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0.05, 0.45, 1) });
  const pos: Vec3 = [
    interpolate(p, [0, 1], [0.95, 1.6]),
    interpolate(p, [0, 1], [0.62, 2.4]),
    interpolate(p, [0, 1], [1.85, 2.6]),
  ];
  const target: Vec3 = [
    interpolate(p, [0, 1], [-0.05, -0.2]),
    interpolate(p, [0, 1], [0.74, 1.05]),
    interpolate(p, [0, 1], [-0.85, -1.2]),
  ];
  return { position: pos, target, fov: 40 };
};

/**
 * transformation_push (f0-119): a staircase of plate stacks. A warm light climbs one step per
 * bell note while the camera cranes up alongside the steps. `frame` is scene-relative.
 */
export const StairShot: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / 30;
  const rubber = useRubber("#151517");
  const iron = useWarmIron();
  const steel = useSteel();
  const lights = STEPS.map((_, i) => (DEBUG ? 0.85 : stepLight(i, frame)));
  const total = lights.reduce((a, b) => a + b, 0) / STEPS.length;

  return (
    <Studio camera={stairCamera(frame)} fog={[2.5, 12]} envIntensity={0.3} exposure={1.12}>
      {/* base lighting: warm key (shadows), orange rim from behind (shadows), faint fill */}
      <Spot position={[1.9, 2.6, 1.4]} target={[0, 0.3, -1]} color="#ffe2c6" intensity={5 + total * 3} angle={0.7} penumbra={1} shadow />
      {/* low orange rim: draws the stack edges without lighting the step tops */}
      <Spot position={[-1.6, 0.6, -3.2]} target={[0, 0.6, -1]} color="#FF5420" intensity={11 + total * 16} angle={0.55} penumbra={0.9} />
      <pointLight position={[0.6, 3.5, 0.5]} color="#fff2e6" intensity={1.2} decay={2} />
      <ambientLight intensity={0.04} />

      {/* the climbing light: one warm pin-spot per step */}
      {STEPS.map((s, i) => {
        const [x, , z] = STEP_POS[i];
        const from: Vec3 = [x + 0.25, 2.4, z + 0.38];
        const dist = Math.hypot(0.25, 2.4 - STEP_TOP[i], 0.38);
        // cone just wider than the plate, so the light pools on the step, not the floor behind
        return (
          <Spot
            key={i}
            position={from}
            target={[x, STEP_TOP[i], z]}
            color="#ffb47a"
            intensity={lights[i] * 40}
            angle={Math.atan((s.r * 1.9) / dist)}
            penumbra={0.55}
          />
        );
      })}

      {STEPS.map((s, i) => (
        <PlateStack key={i} def={s} position={STEP_POS[i]} glow={lights[i]} seed={i + 1} rubber={rubber} iron={iron} steel={steel} />
      ))}

      {/* a visible beam flares above each step on its bell note */}
      {STEPS.map((s, i) => {
        const [x, , z] = STEP_POS[i];
        const len = 2.4 - STEP_TOP[i];
        // only the ringing beams are drawn (big additive cones are the costly part on SwiftShader)
        const ring = stepRing(i, frame);
        return ring > 0.02 ? (
          <LightShaft
            key={i}
            position={[x + 0.12, STEP_TOP[i] + len / 2, z + 0.17]}
            rotation={[-0.14, 0, 0.1]}
            length={len}
            radius={s.r * 1.6}
            color="#ff8a4a"
            opacity={0.16 * ring}
          />
        ) : null;
      })}

      {/* the training floor around it, lost in the fog */}
      <CeilingStrips y={4.2} rows={8} z0={1} intensity={0.55} />
      <Rack position={[-2.3, 0, -4.6]} rotation={[0, 0.35, 0]} />
      <Rack position={[2.1, 0, -5.4]} rotation={[0, -0.25, 0]} />
      <Dust time={t} count={150} center={[-0.1, 1.0, -1.0]} box={[2.2, 1.9, 2.8]} size={0.022} opacity={0.32} color="#ffc49a" seed={23} />
    </Studio>
  );
};
