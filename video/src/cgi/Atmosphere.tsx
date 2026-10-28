import React, { useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../lib/brand";
import { LOGO_BOX, MARK_PATH } from "../components/logoPaths";
import { dotSprite, shaftTex } from "./textures";
import type { Vec3 } from "./Studio";

const rand = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/**
 * Floating chalk / dust motes lit by the rim light. Positions are a pure function of `time`,
 * `burst` (0..1) pushes particles outward from `origin` for an impact.
 */
export const Dust: React.FC<{
  count?: number;
  time: number;
  box?: Vec3;
  center?: Vec3;
  size?: number;
  color?: string;
  opacity?: number;
  burst?: number;
  origin?: Vec3;
  seed?: number;
}> = ({ count = 260, time, box = [4, 3, 4], center = [0, 1.2, 0], size = 0.035, color = "#ffc9a8", opacity = 0.45, burst = 0, origin = [0, 0, 0], seed = 11 }) => {
  const base = useMemo(() => {
    const r = rand(seed);
    return Array.from({ length: count }, () => ({
      p: [(r() - 0.5) * box[0], (r() - 0.5) * box[1], (r() - 0.5) * box[2]] as Vec3,
      v: [(r() - 0.5) * 0.06, 0.01 + r() * 0.05, (r() - 0.5) * 0.06] as Vec3,
      w: r() * Math.PI * 2,
    }));
  }, [count, box, seed]);
  const geo = useMemo(() => {
    const arr = new Float32Array(count * 3);
    base.forEach((b, i) => {
      let x = center[0] + b.p[0] + b.v[0] * time + Math.sin(time * 0.7 + b.w) * 0.03;
      let y = center[1] + b.p[1] + b.v[1] * time;
      let z = center[2] + b.p[2] + b.v[2] * time + Math.cos(time * 0.6 + b.w) * 0.03;
      if (burst > 0) {
        const d = new THREE.Vector3(x - origin[0], y - origin[1], z - origin[2]);
        const len = Math.max(0.15, d.length());
        d.normalize().multiplyScalar((burst * 0.9) / len);
        x += d.x;
        y += Math.abs(d.y) * 0.6;
        z += d.z;
      }
      // wrap vertically so the field never empties
      const h = box[1];
      y = center[1] - h / 2 + ((((y - (center[1] - h / 2)) % h) + h) % h);
      arr.set([x, y, z], i * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [base, time, center, burst, origin, count, box]);
  return (
    <points geometry={geo}>
      <pointsMaterial
        size={size}
        map={dotSprite()}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

/** Fake volumetric light shaft (additive open cone with a soft vertical falloff). */
export const LightShaft: React.FC<{
  position: Vec3;
  rotation?: Vec3;
  length?: number;
  radius?: number;
  color?: string;
  opacity?: number;
}> = ({ position, rotation = [0, 0, 0], length = 5, radius = 1.2, color = COLORS.orange, opacity = 0.12 }) => (
  <mesh position={position} rotation={rotation}>
    <cylinderGeometry args={[0.04, radius, length, 48, 1, true]} />
    <meshBasicMaterial
      color={color}
      map={shaftTex()}
      transparent
      opacity={opacity}
      side={THREE.DoubleSide}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      fog={false}
    />
  </mesh>
);

/** Rows of overhead LED strip lights receding into the fog: reads as a real training floor. */
export const CeilingStrips: React.FC<{ y?: number; rows?: number; spacing?: number; z0?: number; color?: string; intensity?: number }> = ({
  y = 4.2,
  rows = 9,
  spacing = 2.4,
  z0 = 2,
  color = "#fff1e6",
  intensity = 1.6,
}) => (
  <group>
    {Array.from({ length: rows }, (_, i) =>
      [-1.6, 1.6].map((x) => (
        <mesh key={`${i}${x}`} position={[x, y, z0 - i * spacing]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.09, 1.7]} />
          <meshBasicMaterial color={color} toneMapped={false} transparent opacity={Math.min(1, intensity)} fog />
        </mesh>
      )),
    )}
  </group>
);

/** Orange LED accent line on the back wall. */
export const AccentLine: React.FC<{ position: Vec3; width?: number; height?: number; rotation?: Vec3; glow?: number }> = ({
  position,
  width = 6,
  height = 0.035,
  rotation,
  glow = 1.6,
}) => (
  <mesh position={position} rotation={rotation}>
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial color={new THREE.Color(COLORS.orange).multiplyScalar(glow)} toneMapped={false} fog={false} />
  </mesh>
);

/** The authentic RESHAPE mark, extruded for the 3D brand reveal (shape unchanged). */
export const Mark3D: React.FC<{ position?: Vec3; rotation?: Vec3; scale?: number; depth?: number; color?: string }> = ({
  position,
  rotation,
  scale = 1,
  depth = 0.18,
  color = COLORS.logoRed,
}) => {
  const geo = useMemo(() => {
    const nums = MARK_PATH.replace(/[MLZ]/g, " ").trim().split(/[\s,]+/).map(Number);
    const shape = new THREE.Shape();
    const cx = 52.6;
    const cy = 74.3;
    const s = 1 / LOGO_BOX.h;
    for (let i = 0; i < nums.length; i += 2) {
      const x = (nums[i] - cx) * s;
      const y = -(nums[i + 1] - cy) * s;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.012,
      bevelSegments: 4,
    });
    g.translate(0, 0, -depth / 2);
    return g;
  }, [depth]);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} scale={scale} castShadow>
      <meshPhysicalMaterial color={color} roughness={0.28} metalness={0.25} clearcoat={0.8} clearcoatRoughness={0.2} />
    </mesh>
  );
};
