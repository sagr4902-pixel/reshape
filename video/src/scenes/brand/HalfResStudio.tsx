import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useLayoutEffect, useMemo } from "react";
import { useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Floor, type CameraShot } from "../../cgi/Studio";

// Copy of cgi/Studio that renders the WebGL canvas at a fraction of the frame size and scales
// it up with CSS. Used only for the background floor shot, which sits behind a 4-5 px blur
// anyway: half resolution is invisible there and cuts the SwiftShader fragment cost ~4x.

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

export const HalfResStudio: React.FC<{
  camera: CameraShot;
  children: React.ReactNode;
  background?: string;
  fog?: [number, number];
  envIntensity?: number;
  exposure?: number;
  resolution?: number;
}> = ({ camera, children, background = "#0b0b0d", fog = [6, 26], envIntensity = 0.25, exposure = 1.0, resolution = 0.5 }) => {
  const { width, height } = useVideoConfig();
  const w = Math.round(width * resolution);
  const h = Math.round(height * resolution);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transform: `scale(${1 / resolution})`, transformOrigin: "0 0" }}>
      <ThreeCanvas
        width={w}
        height={h}
        dpr={1}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure, preserveDrawingBuffer: true }}
        camera={{ fov: camera.fov ?? 32, position: camera.position }}
      >
        <CameraRig {...camera} />
        <Environment intensity={envIntensity} />
        <color attach="background" args={[background]} />
        <fog attach="fog" args={[background, fog[0], fog[1]]} />
        <Floor />
        {children}
      </ThreeCanvas>
    </div>
  );
};
