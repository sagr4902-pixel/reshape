import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { AccentLine, CeilingStrips, Dust, LightShaft } from "../../cgi/Atmosphere";
import { Rack } from "../../cgi/Equipment";
import { Studio, type Vec3 } from "../../cgi/Studio";
import { floorTex, noiseTex } from "../../cgi/textures";
import { LOGO_BOX, MARK_PATH } from "../../components/logoPaths";
import { COLORS } from "../../lib/brand";
import { CUT, MARK_FOV, MARK_FRONT, MARK_SCALE, MARK_WORLD_H, MATCH_H, MATCH_Y, PX_PER_M } from "./layout";

// Variant of cgi/Atmosphere Mark3D (same authentic outline, same extrusion) with control over
// the material so the lit 3D red can be eased toward the flat logo red right before the cut.
const BrandMark: React.FC<{ position?: Vec3; rotation?: Vec3; scale?: number; emissive?: number }> = ({
  position,
  rotation,
  scale = 1,
  emissive = 0,
}) => {
  const geo = useMemo(() => {
    const depth = 0.18;
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
      bevelSegments: 5,
    });
    g.translate(0, 0, -depth / 2);
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: COLORS.logoRed,
        roughness: 0.26,
        metalness: 0.2,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12,
        emissive: new THREE.Color(COLORS.logoRed),
        emissiveIntensity: 0,
      }),
    [],
  );
  mat.emissiveIntensity = emissive;
  return <mesh geometry={geo} material={mat} position={position} rotation={rotation} scale={scale} castShadow />;
};

/** Same rubber floor as Studio's, with weaker env reflection so the grazing floor stays black. */
const DarkFloor: React.FC = () => {
  const map = floorTex();
  const rough = noiseTex("floor-rough", 30, 10);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial map={map} roughnessMap={rough} roughness={0.72} metalness={0.1} envMapIntensity={0.1} />
    </mesh>
  );
};

const MARK_Y = 1.45;
const BACK_Z = -9;
// Camera at the cut (mark frontal at MATCH_H px, centred on MATCH_Y)
const DIST_END = (MARK_WORLD_H * PX_PER_M) / MATCH_H + MARK_FRONT;
const CAMY_END = MARK_Y - ((960 - MATCH_Y) * (DIST_END - MARK_FRONT)) / PX_PER_M;
/** Accent line height chosen so it sits at the same screen height as the floor shot's line at the cut. */
const ACCENT_SCREEN_Y = 655;
const ACCENT_Y = CAMY_END + ((960 - ACCENT_SCREEN_Y) * (DIST_END - BACK_Z)) / PX_PER_M;

/**
 * f0-45: the extruded authentic mark swings from an oblique angle into frontal view while an
 * orange light sweeps across its bevel; the camera pulls back so the mark lands exactly where
 * the flat 2D mark sits at the match-cut.
 */
export const MarkReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // rotation: damped spring, settled by ~f34
  const r = spring({ frame, fps, config: { damping: 22, stiffness: 70, mass: 1 }, durationInFrames: 34 });
  const rot: Vec3 = [interpolate(r, [0, 1], [0.2, 0]), interpolate(r, [0, 1], [-1.05, 0]), interpolate(r, [0, 1], [-0.07, 0])];

  // pull-back: mark screen height 640 px -> MATCH_H, centre y 900 -> MATCH_Y
  const pull = interpolate(frame, [8, CUT - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.6, 0, 0.3, 1),
  });
  const hPx = interpolate(pull, [0, 1], [640, MATCH_H]);
  const yPx = interpolate(pull, [0, 1], [880, MATCH_Y]);
  const dist = (MARK_WORLD_H * PX_PER_M) / hPx + MARK_FRONT;
  const off = ((960 - yPx) * (dist - MARK_FRONT)) / PX_PER_M;
  const camX = interpolate(pull, [0, 1], [0.32, 0]);
  const camY = MARK_Y - off;

  // orange sweep light grazing across the top bevel
  const sweep = interpolate(frame, [3, 30], [-1.0, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const sweepI = interpolate(frame, [0, 6, 26, 36], [0, 9, 9, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // dust burst on the hit
  const burst = interpolate(frame, [0, 22], [0, 0.55], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  // ease the lit red toward the flat logo red as we approach the cut
  const emissive = interpolate(frame, [28, CUT], [0, 0.32], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const tgt = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, MARK_Y, 0);
    return o;
  }, []);
  const floorTgt = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0, 0);
    return o;
  }, []);

  return (
    <AbsoluteFill>
      <Studio
        camera={{ position: [camX, camY, dist], target: [0, camY, 0], fov: MARK_FOV, roll: interpolate(pull, [0, 1], [0.035, 0]) }}
        fog={[9, 30]}
        envIntensity={0.14}
        floor={false}
      >
        <DarkFloor />
        <primitive object={tgt} />
        <primitive object={floorTgt} />
        {/* key (cool, front right), rim (orange, behind left), top pool with the one shadow */}
        <spotLight position={[1.6, MARK_Y + 1.4, 2.8]} target={tgt} color="#e6ecff" intensity={44} angle={0.2} penumbra={1} decay={2} />
        <spotLight position={[-1.9, MARK_Y + 1.0, -1.6]} target={tgt} color={COLORS.orange} intensity={70} angle={0.6} penumbra={0.9} decay={2} />
        <spotLight
          position={[0.2, MARK_Y + 3.2, 0.2]}
          target={floorTgt}
          color="#ff9a66"
          intensity={110}
          angle={0.36}
          penumbra={1}
          decay={2}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
        />
        <pointLight position={[sweep, MARK_Y + 0.6, 0.1]} color={COLORS.orange} intensity={sweepI} decay={2} distance={3} />
        <ambientLight intensity={0.03} />

        <BrandMark position={[0, MARK_Y, 0]} rotation={rot} scale={MARK_SCALE} emissive={emissive} />

        <LightShaft position={[0.2, MARK_Y + 1.9, 0.2]} length={4.2} radius={1.25} opacity={0.075} />
        <AccentLine position={[0, ACCENT_Y, BACK_Z]} width={24} glow={1.4} />
        <CeilingStrips y={4.4} rows={10} z0={-3} intensity={0.85} />
        <Rack position={[-3.1, 0, -7.5]} rotation={[0, 0.35, 0]} />
        <Rack position={[3.2, 0, -8]} rotation={[0, -0.3, 0]} />
        <Dust time={t + 3} count={140} center={[0, MARK_Y, 0]} box={[3.2, 2.4, 2.6]} size={0.04} opacity={0.55} burst={burst} origin={[0, MARK_Y, 0]} seed={7} />
      </Studio>
    </AbsoluteFill>
  );
};
