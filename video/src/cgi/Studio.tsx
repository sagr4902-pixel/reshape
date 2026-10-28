import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { floorTex, noiseTex } from "./textures";

export type Vec3 = [number, number, number];

export type CameraShot = {
  position: Vec3;
  target: Vec3;
  fov?: number;
  roll?: number;
};

const CameraRig: React.FC<CameraShot> = ({ position, target, fov = 32, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.fov = fov;
    camera.near = 0.01;
    camera.far = 200;
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  });
  return null;
};

const Environment: React.FC<{ intensity: number }> = ({ intensity }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
  }, [gl, scene]);
  useLayoutEffect(() => {
    scene.environmentIntensity = intensity;
  });
  return null;
};

/**
 * One CGI shot: a dark training-studio stage with image-based reflections, fog for depth,
 * ACES tone mapping and a camera that is fully driven by props (i.e. by the current frame).
 */
export const Studio: React.FC<{
  camera: CameraShot;
  children: React.ReactNode;
  background?: string;
  fog?: [number, number];
  envIntensity?: number;
  exposure?: number;
  floor?: boolean | number;
}> = ({ camera, children, background = "#0b0b0d", fog = [6, 26], envIntensity = 0.25, exposure = 1.0, floor = true }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      dpr={1}
      shadows
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure, preserveDrawingBuffer: true }}
      camera={{ fov: camera.fov ?? 32, position: camera.position }}
    >
      <CameraRig {...camera} />
      <Environment intensity={envIntensity} />
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, fog[0], fog[1]]} />
      {floor !== false ? <Floor y={typeof floor === "number" ? floor : 0} /> : null}
      {children}
    </ThreeCanvas>
  );
};

export const Floor: React.FC<{ y?: number }> = ({ y = 0 }) => {
  const map = floorTex();
  const rough = noiseTex("floor-rough", 30, 10);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial map={map} roughnessMap={rough} roughness={0.78} metalness={0.1} envMapIntensity={0.5} />
    </mesh>
  );
};

/** Standard three-point athletic lighting: orange rim + cool key + overhead strip. */
export const SportsLights: React.FC<{
  rim?: number;
  key_?: number;
  top?: number;
  rimPos?: Vec3;
  keyPos?: Vec3;
  target?: Vec3;
  rimColor?: string;
}> = ({ rim = 90, key_ = 25, top = 12, rimPos = [-2.5, 2.2, -2.5], keyPos = [2.2, 2.6, 3], target = [0, 0.3, 0], rimColor = "#FF5420" }) => {
  const tgt = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(...target);
    return o;
  }, [target]);
  return (
    <>
      <primitive object={tgt} />
      <spotLight position={rimPos} target={tgt} color={rimColor} intensity={rim} angle={0.55} penumbra={0.9} decay={2} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <spotLight position={keyPos} target={tgt} color="#dfe6ff" intensity={key_} angle={0.6} penumbra={1} decay={2} />
      <pointLight position={[0, 5, 0.5]} color="#fff4ea" intensity={top} decay={2} />
      <ambientLight intensity={0.035} />
    </>
  );
};
