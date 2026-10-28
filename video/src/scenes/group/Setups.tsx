import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AccentLine, CeilingStrips, Dust, LightShaft } from "../../cgi/Atmosphere";
import { Kettlebell, Rack, SlamBall } from "../../cgi/Equipment";
import type { Vec3 } from "../../cgi/Studio";
import { ropeBump } from "../../cgi/textures";
import { puffSprite, slatTex, washTex } from "./groupTextures";
import {
  BEAT,
  ROPE_FREQ,
  SWING_ARM,
  SWING_PIVOT,
  sinceImpact,
  slamHeight,
  slamSquash,
  swingAngle,
} from "./motion";

// ------------------------------------------------------------------ lights
/**
 * Orange rim (behind) + neutral key + overhead. Exactly one light casts shadows: the rim (long
 * graphic shadows, used for the ropes) or an overhead spot (compact contact shadows).
 */
export const Rig: React.FC<{
  rimPos: Vec3;
  keyPos: Vec3;
  target: Vec3;
  rim?: number;
  key_?: number;
  keyColor?: string;
  top?: number;
  topPos?: Vec3;
  angle?: number;
  shadowFrom?: "rim" | "top";
  kicker?: { pos: Vec3; intensity: number };
}> = ({
  rimPos,
  keyPos,
  target,
  rim = 90,
  key_ = 25,
  keyColor = "#e9ecf5",
  top = 40,
  topPos = [0.4, 5.2, 1.2],
  angle = 0.5,
  shadowFrom = "top",
  kicker,
}) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...target);
  tgt.updateMatrixWorld();
  const shadow = { "shadow-mapSize": [2048, 2048] as [number, number], "shadow-bias": -0.0004, castShadow: true };
  return (
    <>
      <primitive object={tgt} />
      <spotLight position={rimPos} target={tgt} color="#FF5420" intensity={rim} angle={angle} penumbra={0.9} decay={2} {...(shadowFrom === "rim" ? shadow : {})} />
      <spotLight position={keyPos} target={tgt} color={keyColor} intensity={key_} angle={angle + 0.1} penumbra={1} decay={2} />
      <spotLight position={topPos} target={tgt} color="#fff1e4" intensity={top} angle={0.62} penumbra={1} decay={2} {...(shadowFrom === "top" ? shadow : {})} />
      {kicker ? <pointLight position={kicker.pos} color="#ff7a45" intensity={kicker.intensity} decay={2} /> : null}
      <ambientLight intensity={0.04} />
    </>
  );
};

// ------------------------------------------------------------------ the training floor set
/** Ceiling LED rows, orange accent line on the back wall (+ side walls on request), dust motes. */
export const GymSet: React.FC<{
  shaft?: number;
  dust?: number;
  time: number;
  dustCenter?: Vec3;
  dustBox?: Vec3;
  sideLines?: boolean;
  lineY?: number;
  wash?: number;
  slats?: number;
  racks?: { position: Vec3; rotation?: Vec3 }[];
}> = ({ shaft = 0, dust = 0.32, time, dustCenter = [0, 1.3, 0], dustBox = [6, 2.6, 6], sideLines = false, lineY = 1.35, wash = 0.3, slats = 0.22, racks = [] }) => (
  <>
    <CeilingStrips y={4.4} rows={11} spacing={2.3} z0={5} intensity={1.2} />
    <AccentLine position={[0, lineY, -7.5]} width={22} height={0.04} />
    {wash > 0 ? (
      <mesh position={[0, 1.4, -7.45]}>
        <planeGeometry args={[16, 5]} />
        <meshBasicMaterial map={washTex()} color="#ff6a33" transparent opacity={wash} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
      </mesh>
    ) : null}
    {slats > 0
      ? Array.from({ length: 13 }, (_, i) => (
          <mesh key={i} position={[-9 + i * 1.5, 2.2, -7.48]}>
            <planeGeometry args={[0.05, 3.2]} />
            <meshBasicMaterial color="#ffe2cc" map={slatTex()} transparent opacity={slats * 1.6} depthWrite={false} toneMapped={false} />
          </mesh>
        ))
      : null}
    {sideLines ? (
      <>
        <AccentLine position={[-7.5, 1.35, 0]} rotation={[0, Math.PI / 2, 0]} width={22} height={0.04} />
        <AccentLine position={[7.5, 1.35, 0]} rotation={[0, -Math.PI / 2, 0]} width={22} height={0.04} />
      </>
    ) : null}
    {racks.map((r, i) => (
      <Rack key={i} position={r.position} rotation={r.rotation} />
    ))}
    {shaft > 0 ? <LightShaft position={[-1.4, 2.9, -2.2]} rotation={[0, 0, -0.3]} length={6} radius={1.6} opacity={shaft} /> : null}
    {dust > 0 ? <Dust time={time} count={70} size={0.045} opacity={dust} center={dustCenter} box={dustBox} seed={23} /> : null}
  </>
);

// ------------------------------------------------------------------ setup A: kettlebell swings
export const KB_COLS = [-0.8, 0, 0.8];
export const KB_ROWS = [1.2, 0, -1.2, -2.4];

export const KettlebellGrid: React.FC<{ f: number }> = ({ f }) => {
  const theta = swingAngle(f);
  return (
    <group>
      {KB_ROWS.map((z, r) =>
        KB_COLS.map((x, c) => (
          <group key={`${r}-${c}`} position={[x, SWING_PIVOT, z]} rotation={[-theta, 0, 0]}>
            <Kettlebell position={[0, -SWING_ARM, 0]} scale={1.25} accent={r === 0} />
          </group>
        )),
      )}
    </group>
  );
};

// ------------------------------------------------------------------ setup B: battle ropes
const ropeMat = () =>
  new THREE.MeshStandardMaterial({ color: "#2a2a2f", roughness: 0.72, metalness: 0.05, bumpMap: ropeBump(), bumpScale: 3 });

/**
 * One battle rope from a floor anchor to a (hands-height) grip. Same travelling-wave model
 * as cgi/Equipment BattleRope, plus a rubber grip sleeve at the handle end and lighter geometry.
 */
const Rope: React.FC<{
  anchor: Vec3;
  handle: Vec3;
  time: number;
  phase: number;
  amplitude: number;
  mat: THREE.Material;
  grip: THREE.Material;
}> = ({ anchor, handle, time, phase, amplitude, mat, grip }) => {
  const { geo, gripPos, gripQuat } = useMemo(() => {
    const a = new THREE.Vector3(...anchor);
    const b = new THREE.Vector3(...handle);
    const pts: THREE.Vector3[] = [];
    const n = 56;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = a.clone().lerp(b, u);
      const env = 0.06 + 0.94 * Math.pow(u, 1.25);
      const k = 2 * Math.PI * 2.6;
      p.y += amplitude * env * Math.sin(k * (1 - u) - 2 * Math.PI * ROPE_FREQ * time + phase) * Math.min(1, u * 6);
      p.y += 0.025 * Math.sin(Math.PI * u);
      pts.push(p);
    }
    const end = pts[n];
    const dir = end.clone().sub(pts[n - 2]).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return {
      geo: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.021, 10, false),
      gripPos: end.clone().add(dir.clone().multiplyScalar(0.12)),
      gripQuat: q,
    };
  }, [anchor, handle, time, phase, amplitude]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <>
      <mesh geometry={geo} material={mat} castShadow />
      <mesh position={gripPos} quaternion={gripQuat} material={grip} castShadow>
        <cylinderGeometry args={[0.027, 0.027, 0.24, 16]} />
      </mesh>
    </>
  );
};

/** Ropes run along X (anchor on the left, grips on the right); pairs are stacked in depth. */
export const ROPE_PAIRS_Z = [1.0, -0.9, -2.8];
export const ROPE_HANDLE_X = 1.5;
export const ROPE_ANCHOR_X = -6.5;
export const ROPE_HANDLE_Y = 0.92;

export const RopeLine: React.FC<{ time: number; amplitude?: number }> = ({ time, amplitude = 0.27 }) => {
  const mat = useMemo(ropeMat, []);
  const grip = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0f0f11", roughness: 0.6, metalness: 0.1 }), []);
  const anchorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2b2f", roughness: 0.35, metalness: 0.9 }), []);
  return (
    <group>
      {ROPE_PAIRS_Z.map((z, i) => (
        <group key={i}>
          {[-0.24, 0.24].map((dz, j) => (
            <Rope
              key={j}
              anchor={[ROPE_ANCHOR_X, 0.12, z]}
              handle={[ROPE_HANDLE_X, ROPE_HANDLE_Y, z + dz]}
              time={time}
              phase={j * 0.35}
              amplitude={amplitude}
              mat={mat}
              grip={grip}
            />
          ))}
          {/* floor anchor post */}
          <mesh position={[ROPE_ANCHOR_X - 0.05, 0.12, z]} material={anchorMat} castShadow>
            <cylinderGeometry args={[0.05, 0.07, 0.24, 20]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ------------------------------------------------------------------ setup C: slam balls
export const SLAM_X = [-2.0, -1.0, 0, 1.0, 2.0];
export const SLAM_R = 0.17;

const Puff: React.FC<{ origin: Vec3; tau: number; seed: number; count?: number }> = ({ origin, tau, seed, count = 7 }) => {
  const base = useMemo(() => {
    let s = seed * 7919 + 17;
    const r = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    return Array.from({ length: count }, (_, i) => ({
      a: (i / count) * Math.PI * 2 + r() * 0.5,
      sp: 0.18 + r() * 0.28,
      up: 0.03 + r() * 0.12,
      r0: SLAM_R * (1.05 + r() * 0.3),
    }));
  }, [count, seed]);
  const geo = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const e = 1 - Math.exp(-tau / 3);
    base.forEach((b, i) => {
      const d = b.r0 + b.sp * e;
      arr.set([origin[0] + Math.cos(b.a) * d, 0.05 + b.up * e, origin[2] + Math.sin(b.a) * d], i * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [base, tau, origin, count]);
  useEffect(() => () => geo.dispose(), [geo]);
  const o = Math.max(0, 1 - tau / 13);
  if (o <= 0) return null;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.45 + 0.55 * (1 - o)}
        map={puffSprite()}
        color="#e9d6c8"
        transparent
        opacity={0.32 * o}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

/** Thin orange ring that runs out across the floor from each impact: the beat made visible. */
const ImpactRing: React.FC<{ origin: Vec3; tau: number }> = ({ origin, tau }) => {
  const p = tau / 11;
  if (p >= 1) return null;
  const r = SLAM_R * 1.1 + 0.75 * (1 - Math.pow(1 - p, 2.2));
  return (
    <mesh position={[origin[0], 0.006, origin[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r - 0.012 - 0.02 * (1 - p), r, 64]} />
      <meshBasicMaterial color="#FF5420" transparent opacity={0.85 * Math.pow(1 - p, 1.6)} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

export const SlamLine: React.FC<{ f: number; puffs?: boolean }> = ({ f, puffs = true }) => {
  const h = slamHeight(f);
  const sq = slamSquash(f);
  const tau = sinceImpact(f);
  const spin = (Math.floor(f / BEAT) * 0.9 + (f % BEAT) * 0.05) % (Math.PI * 2);
  return (
    <group>
      {SLAM_X.map((x, i) => (
        <group key={i}>
          <group
            position={[x, SLAM_R * (1 - sq) + h, 0]}
            scale={[1 + sq * 0.5, 1 - sq, 1 + sq * 0.5]}
            rotation={[spin, 0.3 * i, 0.25]}
          >
            <SlamBall radius={SLAM_R} />
          </group>
          {puffs ? <Puff origin={[x, 0, 0]} tau={tau} seed={i + 1} /> : null}
          <ImpactRing origin={[x, 0, 0]} tau={tau} />
        </group>
      ))}
    </group>
  );
};
