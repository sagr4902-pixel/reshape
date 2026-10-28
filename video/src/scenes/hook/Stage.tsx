import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Floor, type CameraShot } from "../../cgi/Studio";

// Variant of cgi/Studio for the hook scene: adds a sized canvas (for the half-res focus
// layer) and a "macro" product-shot environment (long soft strips parallel to the bar so
// the steel reads with clean specular lines instead of a muddy room reflection).

const CameraRig: React.FC<CameraShot> = ({ position, target, fov = 32, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.fov = fov;
    camera.near = 0.005;
    camera.far = 200;
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  });
  return null;
};

const strip = (scene: THREE.Scene, color: THREE.Color, w: number, h: number, pos: [number, number, number], rot: [number, number, number]) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  m.position.set(...pos);
  m.rotation.set(...rot);
  scene.add(m);
};

const buildMacroEnv = () => {
  const s = new THREE.Scene();
  s.background = new THREE.Color("#050506");
  // The macro camera looks almost along the bar (+X), so grazing reflections sample the
  // env towards the +X horizon: strips run "infinitely" along X and a big warm card sits
  // at the far end, giving the steel a long clean sheen instead of black.
  strip(s, new THREE.Color("#fff3ea").multiplyScalar(5), 80, 1.2, [0, 4, 1.0], [Math.PI / 2, 0, 0]);
  strip(s, new THREE.Color("#ffe9dc").multiplyScalar(1.6), 3.5, 2.2, [9, 2.2, 0.6], [0, -Math.PI / 2, 0]);
  // dim fill card on the camera side so polished steel never goes fully black
  strip(s, new THREE.Color("#c9ced8").multiplyScalar(0.55), 80, 5, [0, 1.6, 4], [0, Math.PI, 0]);
  // low orange kicker strip behind the bar
  strip(s, new THREE.Color("#FF5420").multiplyScalar(5), 80, 0.35, [0, 0.5, -4], [0, 0, 0]);
  // faint cool strip below for a lower edge line
  strip(s, new THREE.Color("#cfd8ff").multiplyScalar(1.2), 80, 0.3, [0, -2.2, 2.5], [Math.PI / 2.6, 0, 0]);
  return s;
};

const buildGymEnv = () => {
  const s = new THREE.Scene();
  s.background = new THREE.Color("#060607");
  for (let i = 0; i < 6; i++) {
    for (const x of [-1.6, 1.6]) strip(s, new THREE.Color("#fff1e6").multiplyScalar(4), 0.25, 2.2, [x, 4, 4 - i * 2.6], [Math.PI / 2, 0, 0]);
  }
  strip(s, new THREE.Color("#FF5420").multiplyScalar(5), 16, 0.2, [0, 1.4, -7], [0, 0, 0]);
  strip(s, new THREE.Color("#FF5420").multiplyScalar(3), 0.3, 16, [-6, 1.5, 0], [0, Math.PI / 2, 0]);
  return s;
};

const Environment: React.FC<{ intensity: number; kind: "room" | "macro" | "gym" }> = ({ intensity, kind }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const src = kind === "room" ? new RoomEnvironment() : kind === "macro" ? buildMacroEnv() : buildGymEnv();
    scene.environment = pm.fromScene(src, kind === "room" ? 0.04 : 0.02).texture;
    pm.dispose();
  }, [gl, scene, kind]);
  useLayoutEffect(() => {
    scene.environmentIntensity = intensity;
  });
  return null;
};

export const Stage: React.FC<{
  camera: CameraShot;
  children: React.ReactNode;
  width: number;
  height: number;
  background?: string;
  fog?: [number, number];
  envIntensity?: number;
  env?: "room" | "macro" | "gym";
  exposure?: number;
  floor?: boolean;
  shadows?: boolean;
}> = ({
  camera,
  children,
  width,
  height,
  background = "#0b0b0d",
  fog = [6, 26],
  envIntensity = 0.25,
  env = "room",
  exposure = 1.0,
  floor = true,
  shadows = true,
}) => (
  <ThreeCanvas
    width={width}
    height={height}
    dpr={1}
    shadows={shadows}
    gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure, preserveDrawingBuffer: true }}
    camera={{ fov: camera.fov ?? 32, position: camera.position }}
  >
    <CameraRig {...camera} />
    <Environment intensity={envIntensity} kind={env} />
    <color attach="background" args={[background]} />
    <fog attach="fog" args={[background, fog[0], fog[1]]} />
    {floor ? <Floor /> : null}
    {children}
  </ThreeCanvas>
);
