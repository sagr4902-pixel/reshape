import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import * as THREE from "three";
import type { CameraShot, Vec3 } from "../../cgi/Studio";
import { useShake } from "../../components/Finish";
import { COLORS } from "../../lib/brand";
import { knurlColor, knurlNormal, knurlOrm, turnedRough } from "./hookTextures";
import { Motes } from "./Particles";
import { Stage } from "./Stage";

// SHOT 1 - "hook_grip": extreme close-up of a knurled barbell shaft where it meets the
// collar/sleeve. A grazing orange rim light sweeps along the knurl so the diamonds glint,
// chalk drifts through the light, the camera creeps in and focus slowly racks along the bar.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// bar axis = X, collar face at x = 0
const R = 0.014;
const KNURL_FROM = -0.42;
const KNURL_TO = -0.042;
const KNURL_LEN = KNURL_TO - KNURL_FROM;
// 6 tiles x 8 diamonds around the 28 mm shaft = 48 diamonds (~1.8 mm pitch)
const TILE_MM = (2 * Math.PI * R) / 6;
const KNURL_REPEAT: [number, number] = [6, Math.round(KNURL_LEN / TILE_MM)];

const lathe = (pts: [number, number][], segments = 96) =>
  new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments);

/**
 * Background bumper plate for the macro. It sits out of focus behind the collar, so it uses a
 * plain map-free rubber material (the shared bump-mapped Plate is ~0.8 s/frame more on CPU).
 */
const MacroPlate: React.FC<{ position: Vec3 }> = ({ position }) => {
  const { body, rubber, ring } = useMemo(() => {
    const t = 0.0325;
    const Rp = 0.225;
    return {
      body: lathe(
        [
          [0.0262, -t * 0.82],
          [Rp * 0.86, -t * 0.82],
          [Rp * 0.9, -t],
          [Rp - 0.008, -t],
          [Rp, -t + 0.008],
          [Rp, t - 0.008],
          [Rp - 0.008, t],
          [Rp * 0.9, t],
          [Rp * 0.86, t * 0.82],
          [0.0262, t * 0.82],
        ],
        64,
      ),
      rubber: new THREE.MeshStandardMaterial({ color: "#141416", roughness: 0.82, metalness: 0.05, envMapIntensity: 0.35 }),
      ring: new THREE.MeshStandardMaterial({ color: COLORS.orange, emissive: COLORS.orange, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.1 }),
    };
  }, []);
  return (
    <group position={position} rotation={[0, 0, -Math.PI / 2]}>
      <mesh geometry={body} material={rubber} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.0325 * 0.82, 0]} material={ring}>
        <torusGeometry args={[0.225 * 0.88, 0.0035, 8, 96]} />
      </mesh>
    </group>
  );
};

const MacroBar: React.FC<{ lift: number }> = ({ lift }) => {
  const mats = useMemo(() => {
    const orm = knurlOrm(KNURL_REPEAT);
    const knurl = new THREE.MeshStandardMaterial({
      map: knurlColor(KNURL_REPEAT),
      normalMap: knurlNormal(KNURL_REPEAT),
      normalScale: new THREE.Vector2(1, 1),
      roughnessMap: orm,
      metalnessMap: orm,
      roughness: 1,
      metalness: 1,
      envMapIntensity: 1,
    });
    const smooth = new THREE.MeshStandardMaterial({
      color: "#c3c7cf",
      metalness: 1,
      roughness: 0.42,
      roughnessMap: turnedRough(6),
    });
    const sleeve = new THREE.MeshStandardMaterial({
      color: "#d2d5db",
      metalness: 1,
      roughness: 0.36,
      roughnessMap: turnedRough(3),
    });
    return { knurl, smooth, sleeve };
  }, []);

  const geo = useMemo(() => {
    const shaft = new THREE.CylinderGeometry(R, R, KNURL_LEN, 128, 1, true);
    const gap = new THREE.CylinderGeometry(R, R, -KNURL_TO + 0.002, 128, 1, true);
    // collar + sleeve, profile along +Y (rotated onto +X)
    const sleeve = lathe([
      [R * 0.999, 0],
      [0.0236, 0],
      [0.0268, 0.003],
      [0.0268, 0.027],
      [0.0246, 0.03],
      [0.0246, 0.034],
      [0.0252, 0.0352],
      [0.0252, 0.05],
      [0.0241, 0.0508],
      [0.0241, 0.0538],
      [0.0252, 0.0546],
      [0.0252, 0.07],
      [0.0241, 0.0708],
      [0.0241, 0.0738],
      [0.0252, 0.0746],
      [0.0252, 0.46],
      [0.0, 0.46],
    ]);
    return { shaft, gap, sleeve };
  }, []);

  return (
    <group position={[0, lift, 0]} rotation={[lift * 1.2, 0, lift * 0.6]}>
      <mesh geometry={geo.shaft} material={mats.knurl} position={[(KNURL_FROM + KNURL_TO) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      {/* shaft continues out of frame behind the camera */}
      <mesh material={mats.smooth} position={[KNURL_FROM - 0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R, R, 0.5, 64, 1, true]} />
      </mesh>
      <mesh geometry={geo.gap} material={mats.smooth} position={[KNURL_TO / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={geo.sleeve} material={mats.sleeve} rotation={[0, 0, -Math.PI / 2]} />
      <MacroPlate position={[0.115, 0, 0]} />
    </group>
  );
};

/** Far-away warm practicals, rendered unfogged so they bloom into soft bokeh in the focus layer. */
const BokehLights: React.FC = () => {
  const pts: { p: Vec3; c: string; s: number }[] = [
    { p: [1.6, 0.5, -0.9], c: COLORS.orange, s: 0.03 },
    { p: [2.2, 0.25, -0.35], c: "#ffd9bf", s: 0.025 },
    { p: [1.9, 0.75, -0.2], c: COLORS.orange, s: 0.02 },
    { p: [2.6, 0.95, -1.1], c: "#ffe6d4", s: 0.03 },
  ];
  return (
    <group>
      {pts.map((b, i) => (
        <mesh key={i} position={b.p}>
          <sphereGeometry args={[b.s, 16, 12]} />
          <meshBasicMaterial color={new THREE.Color(b.c).multiplyScalar(2.2)} toneMapped={false} fog={false} />
        </mesh>
      ))}
    </group>
  );
};

const MacroScene: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / 30;
  // grazing orange rim sweeps along the knurl towards the collar
  const sweepX = interpolate(frame, [8, 74], [-0.33, -0.075], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const on = interpolate(frame, [8, 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pulse = frame >= 41 ? 1 + 0.9 * Math.exp(-(frame - 41) / 6) : 1;
  const lift = frame < 62 ? 0 : 0.08 * Math.pow(interpolate(frame, [62, 75], [0, 1], clamp), 2.4);
  // the rim dies as the bar is hauled out of frame, leaving black for the hard cut
  const dim = interpolate(frame, [62, 72], [1, 0.15], clamp);
  return (
    <>
      <MacroBar lift={lift} />
      {/* grazing rim: close behind the shaft, so it paints a travelling band of glints.
          It rides with the bar when it is lifted, so the plate face never floods orange. */}
      <group position={[0, lift, 0]}>
        <pointLight position={[sweepX, 0.026, -0.03]} color={COLORS.orange} intensity={0.26 * on * pulse * dim} decay={2} distance={0.15} />
        <pointLight position={[sweepX + 0.05, 0.005, -0.04]} color="#ff8a55" intensity={0.03 * on * pulse * dim} decay={2} distance={0.12} />
      </group>
      {/* soft cool key from camera side, low, for the chalk and the steel body */}
      <pointLight position={[-0.2, 0.12, 0.16]} color="#eef0ff" intensity={0.035 * on} decay={2} distance={0.6} />
      <ambientLight intensity={0.02} />
      <BokehLights />
      <Motes count={110} time={t} box={[0.3, 0.13, 0.16]} center={[-0.12, 0.035, 0.0]} size={0.0034} opacity={0.6 * on} seed={3} color="#ffd8bf" />
      <Motes count={14} time={t} box={[0.25, 0.12, 0.12]} center={[-0.24, 0.03, 0.06]} size={0.009} opacity={0.18 * on} seed={9} sprite="bokeh" color="#ffc3a0" />
    </>
  );
};

export const macroCamera = (frame: number): CameraShot => {
  const p = interpolate(frame, [0, 74], [0, 1], clamp);
  const push = Easing.inOut(Easing.quad)(p);
  const from: Vec3 = [-0.35, 0.052, 0.1];
  const to: Vec3 = [-0.29, 0.044, 0.082];
  const position = from.map((v, i) => v + (to[i] - v) * push) as Vec3;
  return { position, target: [-0.07, 0.012, 0.0], fov: 30, roll: 0.42 - 0.03 * push };
};

export const MacroShot: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = macroCamera(frame);
  const shake = useShake(41, 9, 5);
  // focus band travels from the collar (upper frame) down onto the knurl
  const focusY = interpolate(frame, [8, 50], [48, 64], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const band = 13;
  const mask = `linear-gradient(180deg, #000 0%, #000 ${focusY - band - 14}%, transparent ${focusY - band}%, transparent ${focusY + band}%, #000 ${focusY + band + 16}%, #000 100%)`;
  const liftV = frame < 62 ? 0 : interpolate(frame, [62, 75], [0, 1], clamp);
  const vblur = Math.pow(liftV, 2) * 26;
  const fade = interpolate(frame, [7, 18], [1, 0], clamp);
  // the sub-boom plays over pure black: no 3D work needed until the light comes up
  if (frame < 7) return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill style={{ background: "#0b0b0d", overflow: "hidden" }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="hk-vblur" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation={`${vblur * 0.45} ${vblur}`} />
        </filter>
      </svg>
      <AbsoluteFill
        style={{
          transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg) scale(1.03)`,
          filter: vblur > 0.3 ? "url(#hk-vblur)" : undefined,
        }}
      >
        <Stage width={1080} height={1920} camera={cam} env="macro" envIntensity={0.9} fog={[0.3, 2.2]} floor={false} shadows={false} exposure={1.12}>
          <MacroScene frame={frame} />
        </Stage>
        <AbsoluteFill style={{ filter: "blur(18px)", WebkitMaskImage: mask, maskImage: mask }}>
          <div style={{ width: 360, height: 640, transform: "scale(3)", transformOrigin: "0 0" }}>
            <Stage width={360} height={640} camera={cam} env="macro" envIntensity={0.9} fog={[0.3, 2.2]} floor={false} shadows={false} exposure={1.12}>
              <MacroScene frame={frame} />
            </Stage>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {fade > 0 ? <AbsoluteFill style={{ background: "#000", opacity: fade }} /> : null}
    </AbsoluteFill>
  );
};
