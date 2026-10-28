import React, { useMemo } from "react";
import { interpolate } from "remotion";
import * as THREE from "three";
import { AccentLine, CeilingStrips, Dust, LightShaft } from "../../cgi/Atmosphere";
import { Barbell, Kettlebell, Plate, Rack } from "../../cgi/Equipment";
import type { CameraShot } from "../../cgi/Studio";
import { HalfResStudio } from "./HalfResStudio";
import { COLORS } from "../../lib/brand";

const KB_ROW = Array.from({ length: 12 }, (_, i) => i);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Angle changes are hard cuts on the triad VO words (لياقة f111, ثقة f138). */
export const ANGLE_B = 111;
export const ANGLE_C = 138;

const floorCamera = (frame: number, push: number): CameraShot => {
  if (frame < ANGLE_B) {
    // A: wide, slow lateral dolly across the floor
    const p = interpolate(frame, [45, ANGLE_B], [0, 1], clamp);
    const x = interpolate(p, [0, 1], [0.9, 0.2]);
    return { position: [x, 1.3, interpolate(p, [0, 1], [4.4, 4.15])], target: [x * 0.55 + 0.1, 0.5, -3], fov: 44 };
  }
  if (frame < ANGLE_C) {
    // B: low along the kettlebell row, sliding right
    const p = interpolate(frame, [ANGLE_B, ANGLE_C], [0, 1], clamp);
    const x = interpolate(p, [0, 1], [-0.15, 0.05]);
    return { position: [x, 0.55, 2.6], target: [x - 0.75, 0.32, -2], fov: 40 };
  }
  // C: three-quarter across the loaded bars, slow push, then the fast push-in at the end
  const p = interpolate(frame, [ANGLE_C, 180], [0, 1], clamp);
  const z = interpolate(p, [0, 1], [2.9, 2.55]) - push * 1.4;
  return { position: [1.9, 0.95 - push * 0.1, z], target: [0.55, 0.3, -2.4], fov: 42 };
};

/**
 * Background training-floor wide shot (brand_group slot): a row of kettlebells, loaded
 * barbells on the platform, racks and the orange accent line in the fog, under ceiling strips.
 * Slow lateral dolly; `pulse` (0..1) brightens the rim/accent on each triad word.
 * `frame` is the scene-relative frame.
 */
export const FloorShot: React.FC<{ frame: number; pulse: number; push: number }> = ({ frame, pulse, push }) => {
  const t = frame / 30;
  const camera = floorCamera(frame, push);

  const rimTgt = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0.2, -0.5);
    return o;
  }, []);
  const keyTgt = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0, -2);
    return o;
  }, []);

  return (
    <HalfResStudio camera={camera} fog={[5, 20]} envIntensity={0.3}>
      <primitive object={rimTgt} />
      <primitive object={keyTgt} />
      <spotLight
        position={[0.4, 3.4, -6.5]}
        target={rimTgt}
        color={COLORS.orange}
        intensity={260 * (1 + pulse * 0.6)}
        angle={0.62}
        penumbra={0.9}
        decay={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <spotLight position={[2.2, 3.6, 4.5]} target={keyTgt} color="#dfe6ff" intensity={70} angle={0.55} penumbra={1} decay={2} />
      <pointLight position={[-0.6, 3.4, 0.5]} color="#fff1e6" intensity={9} decay={2} />
      <pointLight position={[0.6, 3.4, -3.2]} color="#fff1e6" intensity={9} decay={2} />
      <ambientLight intensity={0.04} />

      {/* kettlebell row, left, receding */}
      {KB_ROW.map((i) => (
        <Kettlebell key={i} position={[-0.85 - i * 0.04, 0.1, 1.6 - i * 0.62]} rotation={[0, 0.5 + (i % 3) * 0.25, 0]} accent={i % 4 === 0} />
      ))}
      {/* loaded barbells lying on the platform, right */}
      <Barbell position={[0.85, 0.225, 0.4]} rotation={[0, Math.PI / 2 + 0.12, 0]} plates={[0.065, 0.065]} />
      <Barbell position={[1.05, 0.225, -2.6]} rotation={[0, Math.PI / 2 - 0.08, 0]} plates={[0.065, 0.065, 0.045]} />
      {/* plates leaning stack near the back */}
      <Plate position={[-0.15, 0.225, -4.6]} rotation={[0, 0, Math.PI / 2 - 0.12]} />
      <Plate position={[-0.05, 0.225, -4.6]} rotation={[0, 0, Math.PI / 2 - 0.12]} />

      <Rack position={[-2.0, 0, -7]} rotation={[0, 0.25, 0]} />
      <Rack position={[0.4, 0, -7.6]} />
      <Rack position={[2.6, 0, -7.2]} rotation={[0, -0.25, 0]} />
      <AccentLine position={[0, 1.55, -9.5]} width={18} glow={1.5 + pulse * 1.2} />
      <CeilingStrips y={4.0} rows={10} z0={3} intensity={0.95} />
      <LightShaft position={[0.1, 3.2, -1.2]} rotation={[0, 0, -0.28]} length={5.2} radius={1.3} opacity={0.07 + pulse * 0.04} />
      <Dust
        time={t}
        count={260}
        center={[0, 1.4, -1.5]}
        box={[4.5, 2.8, 7]}
        size={0.026}
        opacity={0.42}
        seed={23}
      />
    </HalfResStudio>
  );
};
