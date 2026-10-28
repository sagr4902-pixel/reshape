import React, { useMemo } from "react";
import { Easing, interpolate } from "remotion";
import * as THREE from "three";
import { AccentLine, CeilingStrips, Dust, LightShaft } from "../../cgi/Atmosphere";
import { Studio, type CameraShot, type Vec3 } from "../../cgi/Studio";
import { HeroBarbell } from "./HeroBarbell";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Spot: React.FC<{
  position: Vec3;
  target: Vec3;
  color: string;
  intensity: number;
  angle?: number;
  penumbra?: number;
  shadow?: boolean;
}> = ({ position, target, color, intensity, angle = 0.5, penumbra = 0.9, shadow = false }) => {
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

/**
 * transformation_finish: slow-motion "final rep". A loaded barbell rises slowly through frame,
 * seen from a low angle; chalk floats in slow motion and the light builds with the snare roll.
 * `f` is the shot-relative frame (0 = 24.0 s), `pulses` the bell accents (0..1), `build` 0..1.
 */
export const RepShot: React.FC<{ f: number; pulse: number; build: number }> = ({ f, pulse, build }) => {
  // slow-motion: the rep decelerates as it approaches lockout
  const lift = interpolate(f, [0, 58], [0, 1], { ...clamp, easing: Easing.bezier(0.25, 0.5, 0.45, 1) });
  const barY = interpolate(lift, [0, 1], [0.32, 1.5]);
  const barRot: Vec3 = [0, -0.35, interpolate(lift, [0, 1], [0.02, 0.004])];

  const push = interpolate(f, [0, 55], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
  // low, beside the near plates: the camera only half-follows the lift, so the bar climbs
  // through the frame towards the overhead light
  const camera: CameraShot = {
    position: [interpolate(push, [0, 1], [1.8, 1.62]), interpolate(push, [0, 1], [0.3, 0.34]), interpolate(push, [0, 1], [1.55, 1.36])],
    target: [0.42, 0.66 + barY * 0.2, 0.08],
    fov: interpolate(push, [0, 1], [46, 43]),
    roll: interpolate(push, [0, 1], [0.03, -0.01]),
  };

  const slowT = 4 + f * 0.012; // chalk drifts at ~1/3 speed

  return (
    <Studio camera={camera} fog={[3, 16]} envIntensity={0.32 + build * 0.2} exposure={1.0 + build * 0.35}>
      <Spot position={[-1.6, 3.0, -2.2]} target={[0.3, barY + 0.15, 0]} color="#FF5420" intensity={40 + build * 120 + pulse * 40} angle={0.42} shadow />
      <Spot position={[2.4, 0.5, 1.9]} target={[0.8, barY, 0.3]} color="#ffe0c4" intensity={14 + build * 14 + pulse * 8} angle={0.55} penumbra={1} />
      <pointLight position={[0.3, 3.6, -0.6]} color="#fff2e6" intensity={6 + build * 6} decay={2} />
      <ambientLight intensity={0.04} />

      <HeroBarbell position={[0, barY, 0]} rotation={barRot} plates={[0.075, 0.065, 0.065, 0.045]} accentGlow={0.5 + build * 1.2 + pulse * 0.8} />

      <CeilingStrips y={4.2} rows={9} z0={3} intensity={0.9} />
      <LightShaft position={[-0.7, 2.6, -1.6]} rotation={[0.25, 0, -0.35]} length={5.2} radius={1.3} opacity={0.06 + build * 0.07 + pulse * 0.05} />
      <AccentLine position={[0, 1.4, -7]} width={16} glow={1.4 + build} />
      <Dust time={slowT} count={70} center={[0.3, 1.2, 0.2]} box={[2.4, 2.2, 2.0]} size={0.05} opacity={0.16 + build * 0.1} color="#ffd2b0" seed={71} />
      {/* chalk shaken off the grip, trailing the bar in slow motion */}
      <group position={[0, barY - 0.12 - lift * 0.1, 0]} rotation={barRot}>
        {[-0.42, 0.42].map((x, i) => (
          <Dust key={x} time={slowT + i} count={45} center={[x, 0, 0]} box={[0.55, 0.4, 0.35]} size={0.06} opacity={0.2 + build * 0.08} color="#fff1e4" seed={90 + i} />
        ))}
      </group>
    </Studio>
  );
};
