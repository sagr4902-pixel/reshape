import React, { useMemo } from "react";
import * as THREE from "three";
import { COLORS } from "../../lib/brand";
import { knurlBump, noiseTex } from "../../cgi/textures";
import { useSteel } from "../../cgi/Equipment";
import type { Vec3 } from "../../cgi/Studio";

// Variant of cgi/Equipment <Barbell> for the low-angle hero shot: bumper plates with a little
// sheen (so the rim light draws their edges), a recessed face, and the orange accent ring ON the
// plate faces where the low camera can actually see it. Generic and unbranded.

const lathe = (pts: [number, number][], segments = 60) =>
  new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments);

const R = 0.225;

const HeroPlate: React.FC<{ t: number; x: number; rubber: THREE.Material; steel: THREE.Material; accent: THREE.Material }> = ({ t, x, rubber, steel, accent }) => {
  const geo = useMemo(() => {
    const h = t / 2;
    return {
      body: lathe([
        [0.026, -h * 0.8],
        [0.07, -h * 0.8],
        [0.075, -h * 0.72],
        [R * 0.8, -h * 0.72],
        [R * 0.86, -h],
        [R - 0.007, -h],
        [R, -h + 0.007],
        [R, h - 0.007],
        [R - 0.007, h],
        [R * 0.86, h],
        [R * 0.8, h * 0.72],
        [0.075, h * 0.72],
        [0.07, h * 0.8],
        [0.026, h * 0.8],
      ]),
      hub: lathe([
        [0.026, -h * 0.85],
        [0.068, -h * 0.85],
        [0.068, h * 0.85],
        [0.026, h * 0.85],
        [0.026, -h * 0.85],
      ], 48),
      ring: new THREE.TorusGeometry(R * 0.83, 0.003, 6, 96),
    };
  }, [t]);
  return (
    <group position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh geometry={geo.body} material={rubber} castShadow receiveShadow />
      <mesh geometry={geo.hub} material={steel} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geo.ring} material={accent} position={[0, s * t * 0.5 * 0.86, 0]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
    </group>
  );
};

export const HeroBarbell: React.FC<{ plates: number[]; position: Vec3; rotation: Vec3; accentGlow?: number }> = ({
  plates,
  position,
  rotation,
  accentGlow = 0.6,
}) => {
  const steel = useSteel();
  const rubber = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#131315",
        metalness: 0.08,
        roughness: 0.52,
        roughnessMap: noiseTex("hero-rubber-r", 6, 40),
        bumpMap: noiseTex("rubber", 8, 50),
        bumpScale: 0.35,
      }),
    [],
  );
  const accent = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLORS.orange, emissive: COLORS.orange, emissiveIntensity: 0.6, roughness: 0.4 }),
    [],
  );
  accent.emissiveIntensity = accentGlow;
  const shaft = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b8bcc4", metalness: 1, roughness: 0.32, bumpMap: knurlBump(), bumpScale: 2.2 }),
    [],
  );
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
        <cylinderGeometry args={[0.014, 0.014, 1.31, 40]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} scale={[s, 1, 1]}>
          <mesh position={[sleeveStart + 0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={steel} castShadow>
            <cylinderGeometry args={[0.027, 0.027, 0.024, 40]} />
          </mesh>
          <mesh position={[sleeveStart + 0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={steel} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.42, 40]} />
          </mesh>
          {placed.map((p, i) => (
            <HeroPlate key={i} t={p.t} x={p.x} rubber={rubber} steel={steel} accent={accent} />
          ))}
        </group>
      ))}
    </group>
  );
};
