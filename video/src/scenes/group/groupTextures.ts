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
