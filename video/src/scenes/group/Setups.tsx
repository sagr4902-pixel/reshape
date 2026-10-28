import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AccentLine, CeilingStrips, Dust, LightShaft } from "../../cgi/Atmosphere";
import { noiseTex, ropeBump } from "../../cgi/textures";
import type { Vec3 } from "../../cgi/Studio";
import { COLORS } from "../../lib/brand";
import { blobTex, puffSprite, slatTex, washTex } from "./groupTextures";
import { NoReflect } from "./GroupStage";
import {
  BEAT,
  ROPE_FREQ,
  SLAM_H,
  SWING_ARM,
  SWING_PIVOT,
  sinceImpact,
  slamHeight,
  slamSquash,
  slamStretch,
  swingAngle,
} from "./motion";

// ------------------------------------------------------------------ lights
type SpotDef = { pos: Vec3; target: Vec3; color: string; intensity: number; angle?: number; penumbra?: number; shadow?: boolean };

const Spot: React.FC<SpotDef> = ({ pos, target, color, intensity, angle = 0.45, penumbra = 0.9, shadow = false }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...target);
  tgt.updateMatrixWorld();
  return (
    <>
      <primitive object={tgt} />
      <spotLight
        position={pos}
        target={tgt}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        decay={2}
        castShadow={shadow}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.01}
      />
    </>
  );
};

/** Rim (orange, from behind) + key + overhead shadow caster + optional low kicker. */
export const Rig: React.FC<{
  rim: SpotDef;
  key_: SpotDef;
  top: SpotDef;
  kicker?: { pos: Vec3; intensity: number; color?: string };
  ambient?: number;
}> = ({ rim, key_, top, kicker, ambient = 0.012 }) => (
  <>
    <Spot {...rim} />
    <Spot {...key_} />
    <Spot {...top} />
    {kicker ? <pointLight position={kicker.pos} color={kicker.color ?? "#ff6a33"} intensity={kicker.intensity} decay={2} /> : null}
    <ambientLight intensity={ambient} />
  </>
);

// ------------------------------------------------------------------ the training floor set
/** Ceiling LED rows, orange accent line on the back wall, faint wall slats, dust motes. */
export const GymSet: React.FC<{
  time: number;
  dust?: number;
  dustCenter?: Vec3;
  dustBox?: Vec3;
  lineY?: number;
  wallZ?: number;
  wash?: number;
  slats?: number;
  strips?: number;
  shaft?: number;
  sideLine?: number;
  /** rotates the back wall (line, wash, slats) about Y: PI/2 puts it at x = wallZ, facing +X */
  wallYaw?: number;
}> = ({ time, dust = 0.28, dustCenter = [0, 1.3, 0], dustBox = [6, 2.6, 6], lineY = 1.2, wallZ = -7.5, wash = 0.22, slats = 0.12, strips = 0.9, shaft = 0, sideLine, wallYaw = 0 }) => (
  <>
    {strips > 0 ? (
      <NoReflect>
        <CeilingStrips y={4.4} rows={10} spacing={2.3} z0={5} intensity={strips} />
      </NoReflect>
    ) : null}
    <group rotation={[0, wallYaw, 0]}>
    <AccentLine position={[0, lineY, wallZ]} width={24} height={0.035} />
    {sideLine !== undefined ? <AccentLine position={[-6.8, sideLine, -1]} rotation={[0, Math.PI / 2, 0]} width={16} height={0.035} glow={1.2} /> : null}
    {wash > 0 ? (
      <mesh position={[0, lineY + 0.1, wallZ + 0.05]}>
        <planeGeometry args={[14, 4]} />
        <meshBasicMaterial map={washTex()} color="#ff5a24" transparent opacity={wash} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
      </mesh>
    ) : null}
    {slats > 0
      ? Array.from({ length: 13 }, (_, i) => (
          <mesh key={i} position={[-9 + i * 1.5, lineY + 1.7, wallZ + 0.02]}>
            <planeGeometry args={[0.04, 3.0]} />
            <meshBasicMaterial color="#ffd9c2" map={slatTex()} transparent opacity={slats} depthWrite={false} toneMapped={false} />
          </mesh>
        ))
      : null}
    </group>
    {shaft > 0 ? <LightShaft position={[-1.0, 3.0, -2.0]} rotation={[0, 0, -0.3]} length={6} radius={1.4} opacity={shaft} /> : null}
    {dust > 0 ? (
      <NoReflect>
        <Dust time={time} count={70} size={0.035} opacity={dust} center={dustCenter} box={dustBox} seed={23} />
      </NoReflect>
    ) : null}
  </>
);

// ------------------------------------------------------------------ setup A: kettlebell swings
const lathe = (pts: [number, number][], segments = 64) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments);

const useKbMaterials = () =>
  useMemo(
    () => ({
      // cast iron, satin black: picks up the strip env as soft specular bands
      body: new THREE.MeshStandardMaterial({
        color: "#141416",
        metalness: 0.7,
        roughness: 0.4,
        roughnessMap: noiseTex("iron", 4, 70),
        bumpMap: noiseTex("iron-bump", 6, 40),
        bumpScale: 0.5,
      }),
      // the handle is worn smooth by chalked hands: glossier, so the orange rim draws it
      handle: new THREE.MeshStandardMaterial({ color: "#2a2a2e", metalness: 0.9, roughness: 0.24 }),
      accent: new THREE.MeshStandardMaterial({ color: COLORS.orange, emissive: COLORS.orange, emissiveIntensity: 0.9, roughness: 0.4, metalness: 0.1 }),
    }),
    [],
  );

/** Competition-style kettlebell (body centre at origin, handle up), unbranded. */
const GroupKettlebell: React.FC<{ mats: ReturnType<typeof useKbMaterials>; scale?: number }> = ({ mats, scale = 1 }) => {
  const geo = useMemo(() => {
    const body = lathe([
      [0.0, -0.1],
      [0.062, -0.1],
      [0.086, -0.092],
      [0.104, -0.06],
      [0.112, -0.015],
      [0.11, 0.02],
      [0.1, 0.055],
      [0.08, 0.083],
      [0.05, 0.1],
      [0.0, 0.106],
    ]);
    const curve = new THREE.CatmullRomCurve3(
      (
        [
          [-0.055, 0.075, 0],
          [-0.08, 0.13, 0],
          [-0.082, 0.19, 0],
          [-0.06, 0.235, 0],
          [-0.02, 0.252, 0],
          [0.02, 0.252, 0],
          [0.06, 0.235, 0],
          [0.082, 0.19, 0],
          [0.08, 0.13, 0],
          [0.055, 0.075, 0],
        ] as Vec3[]
      ).map((p) => new THREE.Vector3(...p)),
    );
    return {
      body,
      handle: new THREE.TubeGeometry(curve, 64, 0.017, 16, false),
      ring: new THREE.TorusGeometry(0.1125, 0.0045, 8, 72),
    };
  }, []);
  return (
    <group scale={scale}>
      <mesh geometry={geo.body} material={mats.body} castShadow receiveShadow />
      <mesh geometry={geo.handle} material={mats.handle} castShadow />
      <mesh geometry={geo.ring} material={mats.accent} position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
};

/** Formation: rows face +Z and every bell swings toward +Z, phase-locked to the beat. */
export const KB_COLS = [-0.9, 0, 0.9];
export const KB_ROWS = [0.9, -0.5, -1.9, -3.3];

export const KettlebellGrid: React.FC<{ f: number; cols?: number[]; rows?: number[]; stagger?: number }> = ({ f, cols = KB_COLS, rows = KB_ROWS, stagger = 0 }) => {
  const mats = useKbMaterials();
  const theta = swingAngle(f);
  return (
    <group>
      {rows.map((z, r) =>
        cols.map((x, c) => (
          <group key={`${r}-${c}`} position={[x + (r % 2) * stagger, SWING_PIVOT, z]} rotation={[-theta, 0, 0]}>
            <group position={[0, -SWING_ARM, 0]}>
              <GroupKettlebell mats={mats} scale={1.25} />
            </group>
          </group>
        )),
      )}
    </group>
  );
};

/** Floor contact shadows that follow each bell along its arc (soft, darker when low). */
export const KbShadows: React.FC<{ f: number; cols?: number[]; rows?: number[]; stagger?: number }> = ({ f, cols = KB_COLS, rows = KB_ROWS, stagger = 0 }) => {
  const theta = swingAngle(f);
  const y = SWING_PIVOT - SWING_ARM * Math.cos(theta);
  const dz = SWING_ARM * Math.sin(theta);
  const k = Math.max(0, 1 - y / 1.4);
  const s = 0.42 + y * 0.35;
  return (
    <NoReflect>
      {rows.map((z, r) =>
        cols.map((x, c) => (
          <mesh key={`${r}-${c}`} position={[x + (r % 2) * stagger, 0.003, z + dz]} rotation={[-Math.PI / 2, 0, 0]} scale={[s, s * 1.1, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={blobTex()} transparent opacity={0.75 * k} depthWrite={false} />
          </mesh>
        )),
      )}
    </NoReflect>
  );
};

// ------------------------------------------------------------------ setup B: battle ropes
const ropeMat = () => new THREE.MeshStandardMaterial({ color: "#232327", roughness: 0.66, metalness: 0.05, bumpMap: ropeBump(), bumpScale: 3 });

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
/** Two rows of five, facing each other across a 1 m aisle (the camera looks down the aisle, -X). */
export const SLAM_ROWS_Z = [0, -1.0];
export const SLAM_AISLE_Z = -0.5;

const useSlamMaterials = () =>
  useMemo(
    () => ({
      // textured rubber shell with a satin sheen (so the rim draws a clean edge)
      rubber: new THREE.MeshStandardMaterial({
        color: "#161618",
        metalness: 0.0,
        roughness: 0.42,
        roughnessMap: noiseTex("rubber", 8, 50),
        bumpMap: noiseTex("slam-grip", 10, 90),
        bumpScale: 0.9,
      }),
      seam: new THREE.MeshStandardMaterial({ color: COLORS.orange, emissive: COLORS.orange, emissiveIntensity: 0.8, roughness: 0.4 }),
      seamDark: new THREE.MeshStandardMaterial({ color: "#0b0b0c", roughness: 0.7 }),
    }),
    [],
  );

const GroupSlamBall: React.FC<{ mats: ReturnType<typeof useSlamMaterials> }> = ({ mats }) => {
  const geo = useMemo(
    () => ({
      ball: new THREE.SphereGeometry(SLAM_R, 40, 28),
      seam: new THREE.TorusGeometry(SLAM_R * 1.002, 0.0055, 8, 80),
      seam2: new THREE.TorusGeometry(SLAM_R * 1.001, 0.003, 6, 80),
    }),
    [],
  );
  return (
    <group>
      <mesh geometry={geo.ball} material={mats.rubber} castShadow receiveShadow />
      <mesh geometry={geo.seam} material={mats.seam} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={geo.seam2} material={mats.seamDark} rotation={[0, 0, 0]} />
    </group>
  );
};

const Puff: React.FC<{ origin: Vec3; tau: number; seed: number; count?: number }> = ({ origin, tau, seed, count = 9 }) => {
  const base = useMemo(() => {
    let s = seed * 7919 + 17;
    const r = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    return Array.from({ length: count }, (_, i) => ({
      a: (i / count) * Math.PI * 2 + r() * 0.5,
      sp: 0.22 + r() * 0.32,
      up: 0.02 + r() * 0.1,
      r0: SLAM_R * (1.0 + r() * 0.25),
    }));
  }, [count, seed]);
  const geo = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const e = 1 - Math.exp(-tau / 2.6);
    base.forEach((b, i) => {
      const d = b.r0 + b.sp * e;
      arr.set([origin[0] + Math.cos(b.a) * d, 0.04 + b.up * e, origin[2] + Math.sin(b.a) * d], i * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [base, tau, origin, count]);
  useEffect(() => () => geo.dispose(), [geo]);
  const o = Math.max(0, 1 - tau / 10);
  if (o <= 0) return null;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.3 + 0.4 * (1 - o)}
        map={puffSprite()}
        color="#ffb58c"
        transparent
        opacity={0.22 * o}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

/** Thin orange ring that runs out across the floor from each impact: the beat made visible. */
const ImpactRing: React.FC<{ origin: Vec3; tau: number; scale?: number }> = ({ origin, tau, scale = 1 }) => {
  const p = tau / 10;
  if (p >= 1) return null;
  const r = SLAM_R * 1.05 + 0.7 * scale * (1 - Math.pow(1 - p, 2.4));
  const w = 0.008 + 0.022 * (1 - p);
  return (
    <mesh position={[origin[0], 0.004, origin[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r - w, r, 72]} />
      <meshBasicMaterial color="#FF5420" transparent opacity={0.95 * Math.pow(1 - p, 1.5)} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

/**
 * The slam line: five balls slammed in unison, impact exactly on every beat. Contact shadow,
 * squash on the floor, stretch on the way down, dust and an orange shock ring on each impact.
 */
export const SlamLine: React.FC<{ f: number; puffs?: boolean; ringScale?: number }> = ({ f, puffs = true, ringScale = 1 }) => {
  const mats = useSlamMaterials();
  const h = slamHeight(f);
  const sq = slamSquash(f);
  const st = slamStretch(f);
  const tau = sinceImpact(f);
  const spin = (Math.floor(f / BEAT) * 0.9 + (f % BEAT) * 0.05) % (Math.PI * 2);
  const sy = 1 - sq + st;
  const sxz = 1 + sq * 0.55 - st * 0.35;
  const k = Math.max(0, 1 - h / (SLAM_H * 1.5));
  const bs = SLAM_R * 2.9 * (1 + h * 1.1);
  return (
    <group>
      {SLAM_ROWS_Z.map((z, r) =>
        SLAM_X.map((x, i) => (
          <group key={`${r}-${i}`}>
            <group position={[x, SLAM_R * sy + h, z]} scale={[sxz, sy, sxz]}>
              <group rotation={[spin + r * 1.3, 0.3 * i + r, 0.25]}>
                <GroupSlamBall mats={mats} />
              </group>
            </group>
            {/* floor decals + dust: camera only, kept out of the floor reflection */}
            <NoReflect>
              <mesh position={[x, 0.0025, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[bs * (1 + sq), bs * (1 + sq), 1]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={blobTex()} transparent opacity={0.9 * k} depthWrite={false} />
              </mesh>
              {puffs ? <Puff origin={[x, 0, z]} tau={tau} seed={r * 5 + i + 1} /> : null}
              <ImpactRing origin={[x, 0, z]} tau={tau} scale={ringScale} />
            </NoReflect>
          </group>
        )),
      )}
    </group>
  );
};

/** Orange floor flare on every impact (one light, so the shader never recompiles). */
export const impactGlow = (f: number) => Math.exp(-sinceImpact(f) / 2.5);
