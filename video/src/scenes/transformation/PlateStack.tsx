import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { COLORS } from "../../lib/brand";
import type { Vec3 } from "../../cgi/Studio";

// Variant of cgi/Equipment <Plate> for stacks of plates lying flat: geometry and materials are
// shared across the whole stack, only the TOP plate carries the orange accent ring, and its
// glow is driven by `glow` (0..1) so the step can "light up" on a bell note.

const lathe = (pts: [number, number][], segments = 36) =>
  new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments);

/** Bumper-style profile (thick rubber body, chamfered edges, steel hub). */
const bumperProfile = (R: number, t: number): [number, number][] => [
  [0.026, -t * 0.5],
  [R * 0.86, -t * 0.42],
  [R * 0.9, -t * 0.5],
  [R - 0.006, -t * 0.5],
  [R, -t * 0.5 + 0.006],
  [R, t * 0.5 - 0.006],
  [R - 0.006, t * 0.5],
  [R * 0.9, t * 0.5],
  [R * 0.86, t * 0.42],
  [0.026, t * 0.5],
];

/** Cast-iron change plate profile: thin web with a raised outer lip and a raised hub. */
const ironProfile = (R: number, t: number): [number, number][] => [
  [0.026, -t * 0.5],
  [R - 0.004, -t * 0.5],
  [R, -t * 0.5 + 0.004],
  [R, t * 0.5 - 0.004],
  [R - 0.004, t * 0.5],
  [R - 0.018, t * 0.5],
  [R - 0.024, t * 0.22],
  [0.07, t * 0.22],
  [0.062, t * 0.5],
  [0.026, t * 0.5],
];

/** Only the outer band of a plate: the faces of plates inside a stack are never seen, so the
 * hidden plates skip them (less than half the triangles, which is what SwiftShader pays for). */
const sideBand = (R: number, t: number, c: number): [number, number][] => [
  [R - 0.014, -t * 0.5],
  [R - c, -t * 0.5],
  [R, -t * 0.5 + c],
  [R, t * 0.5 - c],
  [R - c, t * 0.5],
  [R - 0.014, t * 0.5],
];

export type StackDef = {
  /** plate radius (m) */
  r: number;
  /** plate thickness (m) */
  t: number;
  /** number of plates */
  n: number;
  kind: "iron" | "rubber";
};

export const stackHeight = (s: StackDef) => s.n * (s.t + 0.002);

const rnd = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export const PlateStack: React.FC<{
  def: StackDef;
  position: Vec3;
  /** 0..1 accent glow on the top plate */
  glow: number;
  seed: number;
  rubber: THREE.Material;
  iron: THREE.Material;
  steel: THREE.Material;
}> = ({ def, position, glow, seed, rubber, iron, steel }) => {
  // tiny, deterministic misalignment: real stacks are never perfectly concentric
  const offsets = useMemo(() => {
    const r = rnd(seed * 97 + 5);
    return Array.from({ length: def.n }, () => [(r() - 0.5) * 0.008, (r() - 0.5) * 0.008, r() * Math.PI] as Vec3);
  }, [def.n, seed]);

  const pitch = def.t + 0.002;
  const top = stackHeight(def);
  const mat = def.kind === "iron" ? iron : rubber;

  // the whole stack is merged into ONE geometry (one draw call per pass) - cheap on SwiftShader;
  // only the top plate gets a steel hub, the others are hidden inside the stack
  const geo = useMemo(() => {
    const full = lathe(def.kind === "iron" ? ironProfile(def.r, def.t) : bumperProfile(def.r, def.t));
    const band = lathe(sideBand(def.r, def.t, def.kind === "iron" ? 0.004 : 0.006));
    const m = new THREE.Matrix4();
    const parts = offsets.map((o, i) => {
      m.makeRotationY(o[2]).setPosition(o[0], pitch * i + def.t / 2, o[1]);
      return (i === def.n - 1 ? full : band).clone().applyMatrix4(m);
    });
    const body = mergeGeometries(parts) ?? full;
    const h = def.t * 0.5 + 0.0015;
    const hub = lathe([
      [0.026, -h],
      [0.052, -h],
      [0.052, h],
      [0.026, h],
      [0.026, -h],
    ], 32);
    return { body, hub };
  }, [def, offsets, pitch]);
  const last = offsets[def.n - 1];

  return (
    <group position={position}>
      <mesh geometry={geo.body} material={mat} castShadow receiveShadow />
      <mesh geometry={geo.hub} material={steel} position={[last[0], pitch * (def.n - 1) + def.t / 2, last[1]]} />
      {/* accent ring on the top face of the top plate */}
      <mesh position={[last[0], top - 0.0005, last[1]]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[def.r * (def.kind === "iron" ? 0.84 : 0.88), 0.0035, 6, 72]} />
        <meshStandardMaterial
          color={COLORS.orange}
          emissive={COLORS.orange}
          emissiveIntensity={0.03 + glow * 2.8}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
};
