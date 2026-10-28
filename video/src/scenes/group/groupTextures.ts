import * as THREE from "three";

// Soft, wide-falloff sprite for chalk-dust puffs (reads as a cloud, not as a "star").
let puff: THREE.Texture | null = null;
export const puffSprite = () => {
  if (puff) return puff;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.55)");
  g.addColorStop(0.4, "rgba(255,255,255,0.28)");
  g.addColorStop(0.75, "rgba(255,255,255,0.07)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  puff = new THREE.CanvasTexture(c);
  return puff;
};

// Soft elliptical wall wash (warm light pooling on the back wall behind the action).
let wash: THREE.Texture | null = null;
export const washTex = () => {
  if (wash) return wash;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.translate(128, 64);
  ctx.scale(2, 1);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 64);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.45, "rgba(255,255,255,0.32)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-64, -64, 128, 128);
  wash = new THREE.CanvasTexture(c);
  return wash;
};

// Vertical fade for the wall light slats (bright at the floor, gone towards the ceiling).
let slat: THREE.Texture | null = null;
export const slatTex = () => {
  if (slat) return slat;
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.55, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 128);
  slat = new THREE.CanvasTexture(c);
  return slat;
};

// ---------------------------------------------------------------- floor (sRGB, dark rubber tiles)
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

let floorMap: THREE.Texture | null = null;
/** Dark EPDM rubber tiles (1 m) with fine flecks; authored in sRGB so it stays near-black. */
export const groupFloorTex = () => {
  if (floorMap) return floorMap;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  const r = seeded(9137);
  ctx.fillStyle = "#1d1e21";
  ctx.fillRect(0, 0, 512, 512);
  // large soft mottling so the tiles are not perfectly uniform
  for (let i = 0; i < 40; i++) {
    const g = ctx.createRadialGradient(r() * 512, r() * 512, 0, r() * 512, r() * 512, 60 + r() * 90);
    const v = r() < 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.025)";
    g.addColorStop(0, v);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  }
  for (let i = 0; i < 9000; i++) {
    const v = 34 + Math.floor(r() * 18);
    ctx.fillStyle = `rgb(${v},${v},${v + 2})`;
    ctx.fillRect(r() * 512, r() * 512, 1.3, 1.3);
  }
  ctx.strokeStyle = "#0c0c0d";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(1.25, 1.25, 509.5, 509.5);
  floorMap = new THREE.CanvasTexture(c);
  floorMap.colorSpace = THREE.SRGBColorSpace;
  floorMap.wrapS = floorMap.wrapT = THREE.RepeatWrapping;
  floorMap.repeat.set(60, 60);
  floorMap.anisotropy = 8;
  return floorMap;
};

let floorRough: THREE.Texture | null = null;
/** Roughness: mostly satin rubber, slightly glossier wear paths, matte seams. */
export const groupFloorRough = () => {
  if (floorRough) return floorRough;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const r = seeded(331);
  const img = ctx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 200 + (r() - 0.5) * 70;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  floorRough = new THREE.CanvasTexture(c);
  floorRough.wrapS = floorRough.wrapT = THREE.RepeatWrapping;
  floorRough.repeat.set(60, 60);
  return floorRough;
};

let blob: THREE.Texture | null = null;
/** Soft contact shadow (black, alpha falls off radially). */
export const blobTex = () => {
  if (blob) return blob;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(0.35, "rgba(0,0,0,0.75)");
  g.addColorStop(0.7, "rgba(0,0,0,0.22)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  blob = new THREE.CanvasTexture(c);
  return blob;
};
