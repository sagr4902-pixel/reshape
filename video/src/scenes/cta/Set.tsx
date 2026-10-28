import React, { useMemo } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { AccentLine, CeilingStrips, Dust, LightShaft } from "../../cgi/Atmosphere";
import { Rack } from "../../cgi/Equipment";
import type { Vec3 } from "../../cgi/Studio";
import { dotSprite } from "../../cgi/textures";
import { hazeTex } from "./ctaTextures";

// Shared building blocks for the CTA montage shots: light rig, the training-floor set and a
// frame-driven chalk puff for impacts. Everything is a pure function of the props.

/** Orange rim (behind) + neutral key + warm overhead. Exactly one light casts shadows. */
export const Rig: React.FC<{
  target: Vec3;
  rimPos: Vec3;
  keyPos: Vec3;
  rim?: number;
  key_?: number;
  top?: number;
  topPos?: Vec3;
  angle?: number;
  shadow?: "rim" | "top";
  kicker?: { pos: Vec3; intensity: number; color?: string };
}> = ({ target, rimPos, keyPos, rim = 90, key_ = 22, top = 30, topPos = [0.3, 5, 1], angle = 0.55, shadow = "top", kicker }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...target);
  tgt.updateMatrixWorld();
  const cast = { castShadow: true, "shadow-mapSize": [1024, 1024] as [number, number], "shadow-bias": -0.0004 };
  return (
    <>
      <primitive object={tgt} />
      <spotLight position={rimPos} target={tgt} color="#FF5420" intensity={rim} angle={angle} penumbra={0.9} decay={2} {...(shadow === "rim" ? cast : {})} />
      <spotLight position={keyPos} target={tgt} color="#e6ebf7" intensity={key_} angle={angle + 0.1} penumbra={1} decay={2} />
      <spotLight position={topPos} target={tgt} color="#fff1e4" intensity={top} angle={0.6} penumbra={1} decay={2} {...(shadow === "top" ? cast : {})} />
      {kicker ? <pointLight position={kicker.pos} color={kicker.color ?? "#ff7a45"} intensity={kicker.intensity} decay={2} /> : null}
      <ambientLight intensity={0.04} />
    </>
  );
};

/** Ceiling LED rows, orange accent line on the back wall, rack silhouettes, warm motes. */
export const GymSet: React.FC<{
  time: number;
  racks?: { position: Vec3; rotation?: Vec3 }[];
  lineZ?: number;
  lineY?: number;
  shafts?: { position: Vec3; rotation?: Vec3; opacity?: number }[];
  dust?: { center: Vec3; box: Vec3; count?: number; size?: number; opacity?: number };
  strips?: boolean;
}> = ({ time, racks = [], lineZ = -7, lineY = 1.35, shafts = [], dust, strips = true }) => (
  <>
    {strips ? <CeilingStrips y={4.3} rows={10} spacing={2.3} z0={4} intensity={1.1} /> : null}
    <AccentLine position={[0, lineY, lineZ]} width={18} height={0.03} glow={1.5} />
    {racks.map((r, i) => (
      <Rack key={i} position={r.position} rotation={r.rotation} />
    ))}
    {shafts.map((s, i) => (
      <LightShaft key={i} position={s.position} rotation={s.rotation} length={5.5} radius={1.3} opacity={s.opacity ?? 0.07} />
    ))}
    {dust ? (
      <Dust
        time={time}
        center={dust.center}
        box={dust.box}
        count={dust.count ?? 90}
        size={dust.size ?? 0.05}
        opacity={dust.opacity ?? 0.3}
        color="#ffc29a"
        seed={23}
      />
    ) : null}
  </>
);

/**
 * Chalk puff for an impact. `t` = frames since the impact (nothing before 0).
 * Fine grains fan out low along the floor; a few big soft clouds billow and fade.
 */
export const ImpactPuff: React.FC<{
  origin: Vec3;
  t: number;
  seed?: string;
  grains?: number;
  clouds?: number;
  spread?: number;
  strength?: number;
}> = ({ origin, t, seed = "puff", grains = 110, clouds = 16, spread = 1, strength = 1 }) => {
  const base = useMemo(
    () =>
      Array.from({ length: grains + clouds }, (_, i) => {
        const a = random(`${seed}-a-${i}`) * Math.PI * 2;
        const e = 0.05 + random(`${seed}-e-${i}`) * 0.55;
        const s = 0.35 + random(`${seed}-s-${i}`) * 1.0;
        return { dir: [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)] as Vec3, s };
      }),
    [grains, clouds, seed],
  );
  const geos = useMemo(() => {
    const g1 = new Float32Array(grains * 3);
    const g2 = new Float32Array(clouds * 3);
    const tt = Math.max(0, t);
    base.forEach((b, i) => {
      const isCloud = i >= grains;
      const reach = (isCloud ? 0.22 : 0.42) * spread * b.s * (1 - Math.exp(-tt / (isCloud ? 9 : 5)));
      const x = origin[0] + b.dir[0] * reach;
      const y = Math.max(0.01, origin[1] + b.dir[1] * reach * (isCloud ? 1.6 : 0.8) + (isCloud ? 0.004 * tt : -0.0006 * tt * tt * 0.2));
      const z = origin[2] + b.dir[2] * reach;
      if (isCloud) g2.set([x, y + 0.04, z], (i - grains) * 3);
      else g1.set([x, y, z], i * 3);
    });
    const a = new THREE.BufferGeometry();
    a.setAttribute("position", new THREE.BufferAttribute(g1, 3));
    const b = new THREE.BufferGeometry();
    b.setAttribute("position", new THREE.BufferAttribute(g2, 3));
    return [a, b];
  }, [base, t, origin, grains, spread]);
  if (t < 0) return null;
  const grainO = 0.75 * strength * Math.exp(-t / 12);
  const cloudO = 0.2 * strength * Math.exp(-t / 16) * Math.min(1, (t + 1) / 3);
  return (
    <>
      <points geometry={geos[0]}>
        <pointsMaterial size={0.022} map={dotSprite()} color="#f1e6dc" transparent opacity={grainO} depthWrite={false} sizeAttenuation />
      </points>
      <points geometry={geos[1]}>
        <pointsMaterial
          size={0.22 + t * 0.012}
          map={dotSprite()}
          color="#e9ddd2"
          transparent
          opacity={cloudO}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </>
  );
};

/** Back-lit atmospheric haze behind a subject so dark rubber/iron reads as a clean silhouette. */
export const HazeCard: React.FC<{ position: Vec3; rotation?: Vec3; size?: [number, number]; color?: string; opacity?: number }> = ({
  position,
  rotation = [0, 0, 0],
  size = [5, 3],
  color = "#ff6a35",
  opacity = 0.25,
}) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={size} />
    <meshBasicMaterial color={color} map={hazeTex()} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
  </mesh>
);
