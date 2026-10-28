import * as THREE from "three";

// Procedural textures, generated once per page in the browser. Deterministic (seeded),
// so every rendered frame is identical across render workers.

const cache = new Map<string, THREE.Texture>();

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const make = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
};

/** Diamond knurl bump map for the barbell shaft. */
export const knurlBump = () =>
  make("knurl", 256, 256, (ctx) => {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 7;
    for (let i = -256; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i + 256, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }
  }, [40, 2]);

/** Fine noise used for rubber, cast iron and concrete roughness/bump. */
export const noiseTex = (key = "noise", scale = 1, contrast = 60) =>
  make(`${key}`, 256, 256, (ctx) => {
    const r = seeded(key.length * 977 + 13);
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * contrast * 2;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [scale, scale]);

/** Rubber gym floor: tile seams + mottled speckle. */
export const floorTex = () =>
  make("floor", 512, 512, (ctx) => {
    const r = seeded(4242);
    ctx.fillStyle = "#1b1c1f";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) {
      const g = 25 + Math.floor(r() * 9);
      ctx.fillStyle = `rgb(${g},${g},${g + 2})`;
      ctx.fillRect(r() * 512, r() * 512, 1.5, 1.5);
    }
    ctx.strokeStyle = "#0b0b0c";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, 509, 509);
  }, [24, 24]);

/** Twisted-rope stripes (bump) for battle ropes. */
export const ropeBump = () =>
  make("rope", 128, 128, (ctx) => {
    ctx.fillStyle = "#777";
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 9;
    for (let i = -128; i < 256; i += 22) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 128);
      ctx.stroke();
    }
  }, [60, 1]);

/** Soft round sprite for dust / chalk particles. */
export const dotSprite = () =>
  make("dot", 64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });

/** Vertical fade used by volumetric light shafts (bright at the source). */
export const shaftTex = () =>
  make("shaft", 4, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "rgba(255,255,255,0.0)");
    g.addColorStop(0.15, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  });
