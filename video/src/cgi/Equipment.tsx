import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { COLORS } from "../lib/brand";
import { knurlBump, noiseTex, ropeBump } from "./textures";
import type { Vec3 } from "./Studio";

// Generic training equipment modelled at real-world scale (metres). Unbranded on purpose:
// no logos or lettering appear on any CGI object.

const lathe = (pts: [number, number][], segments = 72) =>
  new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments);

// ---------------------------------------------------------------- materials
export const useIron = () =>
  useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1a1c",
        metalness: 0.75,
        roughness: 0.48,
        roughnessMap: noiseTex("iron", 4, 70),
        bumpMap: noiseTex("iron-bump", 6, 40),
        bumpScale: 0.6,
      }),
    [],
  );

export const useSteel = () =>
  useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9ccd2", metalness: 1, roughness: 0.22 }), []);

export const useRubber = (color = "#141416") =>
  useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        metalness: 0.05,
        roughness: 0.78,
        bumpMap: noiseTex("rubber", 8, 50),
        bumpScale: 0.4,
      }),
    [color],
  );

export const useAccent = () =>
  useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLORS.orange, emissive: COLORS.orange, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.1 }),
    [],
  );

// ---------------------------------------------------------------- bumper plate (axis = Y)
const PLATE_R = 0.225;
export const Plate: React.FC<{ thickness?: number; radius?: number; accent?: boolean; position?: Vec3; rotation?: Vec3 }> = ({
  thickness = 0.065,
  radius = PLATE_R,
  accent = true,
  position,
  rotation,
}) => {
  const rubber = useRubber();
  const steel = useSteel();
  const orange = useAccent();
  const geo = useMemo(() => {
    const t = thickness / 2;
    const R = radius;
    return {
      body: lathe([
        [0.062, -t * 0.82],
        [R * 0.86, -t * 0.82],
        [R * 0.9, -t],
        [R - 0.008, -t],
        [R, -t + 0.008],
        [R, t - 0.008],
        [R - 0.008, t],
        [R * 0.9, t],
        [R * 0.86, t * 0.82],
        [0.062, t * 0.82],
      ]),
      hub: lathe([
        [0.026, -t * 0.95],
        [0.064, -t * 0.95],
        [0.064, t * 0.95],
        [0.026, t * 0.95],
        [0.026, -t * 0.95],
      ]),
    };
  }, [thickness, radius]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo.body} material={rubber} castShadow receiveShadow />
      <mesh geometry={geo.hub} material={steel} castShadow />
      {accent ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 0.88, 0.0035, 8, 96]} />
          <primitive object={orange} attach="material" />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- Olympic barbell (axis = X)
export const Barbell: React.FC<{ plates?: number[]; position?: Vec3; rotation?: Vec3 }> = ({
  plates = [0.065, 0.065],
  position,
  rotation,
}) => {
  const steel = useSteel();
  const shaft = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#b8bcc4", metalness: 1, roughness: 0.32, bumpMap: knurlBump(), bumpScale: 2.2 });
    return m;
  }, []);
  const sleeveStart = 0.655;
  let cursor = sleeveStart + 0.04;
  const placed: { x: number; t: number }[] = [];
  for (const t of plates) {
    placed.push({ x: cursor + t / 2, t });
    cursor += t + 0.004;
  }
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={shaft} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 1.31, 48]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} scale={[s, 1, 1]}>
          <mesh position={[sleeveStart + 0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={steel} castShadow>
            <cylinderGeometry args={[0.027, 0.027, 0.024, 48]} />
          </mesh>
          <mesh position={[sleeveStart + 0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={steel} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.42, 48]} />
          </mesh>
          {placed.map((p, i) => (
            <Plate key={i} thickness={p.t} position={[p.x, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
          ))}
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------- kettlebell (body centre at origin)
export const Kettlebell: React.FC<{ scale?: number; position?: Vec3; rotation?: Vec3; accent?: boolean }> = ({
  scale = 1,
  position,
  rotation,
  accent = false,
}) => {
  const iron = useIron();
  const orange = useAccent();
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
      ].map((p) => new THREE.Vector3(...(p as Vec3))),
    );
    const handle = new THREE.TubeGeometry(curve, 96, 0.016, 20, false);
    return { body, handle };
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo.body} material={iron} castShadow receiveShadow />
      <mesh geometry={geo.handle} material={iron} castShadow />
      {accent ? (
        <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.1125, 0.004, 8, 96]} />
          <primitive object={orange} attach="material" />
        </mesh>
      ) : null}
    </group>
  );
};

// ---------------------------------------------------------------- battle rope
/**
 * A rope anchored at `anchor` running to `handle`; the travelling wave is a pure function
 * of `time` (seconds), so it is frame-accurate.
 */
export const BattleRope: React.FC<{
  anchor: Vec3;
  handle: Vec3;
  time: number;
  amplitude?: number;
  frequency?: number;
  phase?: number;
  radius?: number;
}> = ({ anchor, handle, time, amplitude = 0.22, frequency = 1.9, phase = 0, radius = 0.019 }) => {
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1d1d20", roughness: 0.85, metalness: 0.05, bumpMap: ropeBump(), bumpScale: 3 }),
    [],
  );
  const geo = useMemo(() => {
    const a = new THREE.Vector3(...anchor);
    const b = new THREE.Vector3(...handle);
    const pts: THREE.Vector3[] = [];
    const n = 64;
    for (let i = 0; i <= n; i++) {
      const u = i / n; // 0 at anchor, 1 at handle
      const p = a.clone().lerp(b, u);
      const env = 0.08 + 0.92 * Math.pow(u, 1.3);
      const k = 2 * Math.PI * 1.6; // ~1.6 wavelengths along the rope
      p.y += amplitude * env * Math.sin(k * (1 - u) - 2 * Math.PI * frequency * time + phase) * Math.min(1, u * 6);
      p.y += 0.02 * Math.sin(Math.PI * u); // slight sag
      pts.push(p);
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, radius, 14, false);
  }, [anchor, handle, time, amplitude, frequency, phase, radius]);
  return <mesh geometry={geo} material={mat} castShadow />;
};

// ---------------------------------------------------------------- slam ball / plyo box / rack
export const SlamBall: React.FC<{ position?: Vec3; radius?: number }> = ({ position, radius = 0.15 }) => {
  const rubber = useRubber("#18181a");
  const orange = useAccent();
  return (
    <group position={position}>
      <mesh material={rubber} castShadow receiveShadow>
        <sphereGeometry args={[radius, 64, 48]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.002, 0.004, 8, 96]} />
        <primitive object={orange} attach="material" />
      </mesh>
    </group>
  );
};

export const PlyoBox: React.FC<{ size?: Vec3; position?: Vec3; rotation?: Vec3 }> = ({ size = [0.75, 0.6, 0.5], position, rotation }) => {
  const rubber = useRubber("#202024");
  const geo = useMemo(() => new RoundedBoxGeometry(size[0], size[1], size[2], 4, 0.04), [size]);
  return (
    <mesh geometry={geo} material={rubber} position={position} rotation={rotation} castShadow receiveShadow />
  );
};

/** Background power-rack silhouette (gives the stage a real-gym read without branding). */
export const Rack: React.FC<{ position?: Vec3; rotation?: Vec3 }> = ({ position, rotation }) => {
  const iron = useIron();
  const post = (x: number, z: number) => (
    <mesh key={`${x}${z}`} position={[x, 1.15, z]} material={iron} castShadow>
      <boxGeometry args={[0.075, 2.3, 0.075]} />
    </mesh>
  );
  return (
    <group position={position} rotation={rotation}>
      {post(-0.6, -0.6)}
      {post(0.6, -0.6)}
      {post(-0.6, 0.6)}
      {post(0.6, 0.6)}
      {[-0.6, 0.6].map((z) => (
        <mesh key={z} position={[0, 2.28, z]} material={iron}>
          <boxGeometry args={[1.28, 0.075, 0.075]} />
        </mesh>
      ))}
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 2.28, 0]} material={iron}>
          <boxGeometry args={[0.075, 0.075, 1.28]} />
        </mesh>
      ))}
    </group>
  );
};
