import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useLayoutEffect, useMemo } from "react";
import { useVideoConfig } from "remotion";
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import type { CameraShot } from "../../cgi/Studio";
import { groupFloorTex, groupFloorRough } from "./groupTextures";

// Stage for the "group" scene. Same idea as cgi/Studio, tuned for deep blacks:
//  - a dark "training floor" environment made only of light strips (no grey room), so dark
//    iron/rubber stays black and only picks up clean specular lines;
//  - fog that falls off to pure black;
//  - a dark rubber floor in sRGB (cgi/Studio's floor map is read as linear and turns grey)
//    with an optional blurred, Fresnel-weighted floor reflection for the product-CGI sheen.

const CameraRig: React.FC<CameraShot> = ({ position, target, fov = 32, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.fov = fov;
    camera.near = 0.02;
    camera.far = 120;
    // layer 1 = seen by the camera but not by the floor reflection (ceiling LEDs)
    camera.layers.enable(1);
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

let envScene: THREE.Scene | null = null;
const buildEnv = () => {
  if (envScene) return envScene;
  const s = new THREE.Scene();
  s.background = new THREE.Color("#030304");
  // overhead LED rows
  for (let i = 0; i < 7; i++) {
    for (const x of [-1.6, 1.6]) strip(s, new THREE.Color("#fff1e6").multiplyScalar(5), 0.22, 2.2, [x, 4.2, 5 - i * 2.4], [Math.PI / 2, 0, 0]);
  }
  // orange accent lines on the walls (back + one side) -> orange specular lines on iron
  strip(s, new THREE.Color("#FF5420").multiplyScalar(6), 18, 0.25, [0, 1.3, -7], [0, 0, 0]);
  strip(s, new THREE.Color("#FF5420").multiplyScalar(3), 16, 0.25, [-6.5, 1.3, 0], [0, Math.PI / 2, 0]);
  // soft warm card high behind the camera side: a gentle top sheen, never a grey wash
  strip(s, new THREE.Color("#ffe7d6").multiplyScalar(0.7), 8, 2.5, [0, 3.2, 7], [0, Math.PI, 0]);
  envScene = s;
  return s;
};

const Environment: React.FC<{ intensity: number }> = ({ intensity }) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(buildEnv(), 0.02).texture;
    pm.dispose();
  }, [gl, scene]);
  useLayoutEffect(() => {
    scene.environmentIntensity = intensity;
  });
  return null;
};

export const GroupFloor: React.FC<{ tint?: string; roughness?: number; envMap?: number }> = ({ tint = "#ffffff", roughness = 0.62, envMap = 0.35 }) => {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: groupFloorTex(),
        // up to 0.9 the floor keeps its satin wear pattern; above that it is a uniform matte
        roughnessMap: roughness > 0.9 ? null : groupFloorRough(),
        roughness: Math.min(1, roughness),
        metalness: 0.0,
      }),
    [roughness],
  );
  mat.color.set(tint);
  mat.envMapIntensity = envMap;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat} receiveShadow>
      <planeGeometry args={[60, 60]} />
    </mesh>
  );
};

// Blurred floor reflection: drawn additively just above the floor, strength rises at grazing
// angles (Fresnel) and fades out with distance so it never competes with the fog.
const ReflectShader = {
  name: "GroupFloorReflect",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    strength: { value: 0.3 },
    texel: { value: new THREE.Vector2(1 / 360, 1 / 640) },
    camPos: { value: new THREE.Vector3() },
    fadeDist: { value: new THREE.Vector2(3, 10) },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float strength;
    uniform vec2 texel;
    uniform vec3 camPos;
    uniform vec2 fadeDist;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vec2 uv = vUv.xy / vUv.w;
      // vertical 7-tap blur, 1 texel apart (continuous with bilinear filtering, so small
      // highlights smear into short streaks like on a real satin floor instead of ghosting)
      vec3 acc = texture2D(tDiffuse, uv).rgb * 0.2;
      acc += texture2D(tDiffuse, uv + vec2(0.0, texel.y)).rgb * 0.17;
      acc += texture2D(tDiffuse, uv - vec2(0.0, texel.y)).rgb * 0.17;
      acc += texture2D(tDiffuse, uv + vec2(texel.x * 0.5, 2.0 * texel.y)).rgb * 0.13;
      acc += texture2D(tDiffuse, uv - vec2(texel.x * 0.5, 2.0 * texel.y)).rgb * 0.13;
      acc += texture2D(tDiffuse, uv + vec2(-texel.x * 0.5, 3.0 * texel.y)).rgb * 0.1;
      acc += texture2D(tDiffuse, uv - vec2(-texel.x * 0.5, 3.0 * texel.y)).rgb * 0.1;
      vec3 v = normalize(camPos - vWorld);
      float fres = 0.08 + 0.92 * pow(1.0 - clamp(v.y, 0.0, 1.0), 4.0);
      float d = length(camPos.xz - vWorld.xz);
      float fade = 1.0 - smoothstep(fadeDist.x, fadeDist.y, d);
      gl_FragColor = vec4(acc * color * strength * fres * fade, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

const FloorReflection: React.FC<{ strength: number; camPos: [number, number, number]; res?: number; fade?: [number, number] }> = ({
  strength,
  camPos,
  res = 1 / 4,
  fade = [3, 10],
}) => {
  const { width, height } = useVideoConfig();
  const refl = useMemo(() => {
    const r = new Reflector(new THREE.PlaneGeometry(40, 40), {
      textureWidth: Math.round(width * res),
      textureHeight: Math.round(height * res),
      clipBias: 0.002,
      multisample: 0,
      shader: ReflectShader,
      color: 0xffffff,
    });
    r.rotation.x = -Math.PI / 2;
    r.position.y = 0.0015;
    const m = r.material as THREE.ShaderMaterial;
    m.transparent = true;
    m.blending = THREE.AdditiveBlending;
    m.depthWrite = false;
    return r;
  }, [width, height, res]);
  useEffect(() => () => refl.dispose(), [refl]);
  const m = refl.material as THREE.ShaderMaterial;
  m.uniforms.strength.value = strength;
  (m.uniforms.texel.value as THREE.Vector2).set(1 / Math.round(width * res), 1 / Math.round(height * res));
  (m.uniforms.camPos.value as THREE.Vector3).set(...camPos);
  (m.uniforms.fadeDist.value as THREE.Vector2).set(fade[0], fade[1]);
  return <primitive object={refl} />;
};

/** Puts every mesh below it on layer 1: visible to the camera, skipped by the floor reflection. */
export const NoReflect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = React.useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    ref.current?.traverse((o) => o.layers.set(1));
  });
  return <group ref={ref}>{children}</group>;
};

export const GroupStage: React.FC<{
  camera: CameraShot;
  children: React.ReactNode;
  fog?: [number, number];
  envIntensity?: number;
  exposure?: number;
  floorTint?: string;
  floorRoughness?: number;
  reflection?: number;
  reflectionFade?: [number, number];
}> = ({ camera, children, fog = [5, 16], envIntensity = 0.6, exposure = 1.0, floorTint, floorRoughness, reflection = 0, reflectionFade }) => {
  const { width, height } = useVideoConfig();
  const bg = "#040405";
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
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, fog[0], fog[1]]} />
      <GroupFloor tint={floorTint} roughness={floorRoughness} />
      {reflection > 0 ? <FloorReflection strength={reflection} fade={reflectionFade} camPos={camera.position} /> : null}
      {children}
    </ThreeCanvas>
  );
};
