import * as THREE from "three";

// Procedural, deterministic textures for the hook's macro barbell shot.
// Generated once per page; no randomness that changes between frames or workers.

const cache = new Map<string, THREE.Texture>();

const make = (
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  opts: { repeat?: [number, number]; srgb?: boolean } = {},
) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
  if (opts.srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  cache.set(key, t);
  return t;
};

// ---------------------------------------------------------------- knurl
// One tile holds P x P diamond periods and is seamless. The surface is the intersection of
// two families of V-grooves (u+v and u-v), giving truncated pyramids like a real knurl.
const TILE = 512;
const P = 8;

const tri = (x: number) => 1 - 2 * Math.abs(x - Math.floor(x) - 0.5); // 0 at integers, 1 at .5

let heightCache: Float32Array | null = null;
const knurlHeight = () => {
  if (heightCache) return heightCache;
  const h = new Float32Array(TILE * TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const u = (x + 0.5) / TILE;
      const v = (y + 0.5) / TILE;
      const a = tri((u + v) * P);
      const b = tri((u - v) * P);
      // truncated pyramid with slightly rounded groove bottoms
      const m = Math.min(a, b);
      h[y * TILE + x] = Math.min(1, m * 2.1);
    }
  }
  heightCache = h;
  return h;
};

// tileable low-frequency noise (integer frequencies only -> seamless)
const tileNoise = (u: number, v: number, seed: number) => {
  let n = 0;
  const waves: [number, number, number, number][] = [
    [1, 2, 0.5, 1.3],
    [3, -1, 0.3, 4.1],
    [2, 5, 0.22, 2.2],
    [-4, 3, 0.18, 5.7],
    [7, 6, 0.1, 0.9],
  ];
  for (const [k, l, a, ph] of waves) n += a * Math.sin(2 * Math.PI * (k * u + l * v) + ph + seed);
  return n; // ~[-1.3, 1.3]
};

/** Tangent-space normal map of the diamond knurl. `strength` = facet steepness. */
export const knurlNormal = (repeat: [number, number], strength = 0.75) =>
  make(
    `hk-knurl-n-${repeat.join("x")}-${strength}`,
    TILE,
    TILE,
    (ctx) => {
      const h = knurlHeight();
      const img = ctx.createImageData(TILE, TILE);
      const at = (x: number, y: number) => h[((y + TILE) % TILE) * TILE + ((x + TILE) % TILE)];
      // max per-pixel slope of the pyramid flank -> normalised to tan(facet angle) = strength
      const k = (strength * (TILE / P) * 0.5) / 2.1;
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const gx = (at(x + 1, y) - at(x - 1, y)) * 0.5;
          const gy = (at(x, y + 1) - at(x, y - 1)) * 0.5; // canvas y is -v
          let nx = -gx * k;
          let ny = gy * k;
          let nz = 1;
          const l = Math.hypot(nx, ny, nz);
          nx /= l;
          ny /= l;
          nz /= l;
          const i = (y * TILE + x) * 4;
          img.data[i] = (nx * 0.5 + 0.5) * 255;
          img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
          img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    { repeat },
  );

/** Albedo: bright steel on the pyramid tops, chalk packed into the grooves. */
export const knurlColor = (repeat: [number, number]) =>
  make(
    `hk-knurl-c-${repeat.join("x")}`,
    TILE,
    TILE,
    (ctx) => {
      const h = knurlHeight();
      const img = ctx.createImageData(TILE, TILE);
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const hv = h[y * TILE + x];
          const n = tileNoise(x / TILE, y / TILE, 1.7);
          const chalk = Math.max(0, Math.min(1, (0.3 - hv) * 2.2 + n * 0.45 - 0.1)) * 0.6;
          const wear = 1 + n * 0.06;
          const steel = [178 * wear, 182 * wear, 190 * wear];
          const ch = [236, 230, 222];
          const i = (y * TILE + x) * 4;
          for (let c = 0; c < 3; c++) img.data[i + c] = steel[c] * (1 - chalk) + ch[c] * chalk;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    { repeat, srgb: true },
  );

/** Packed G = roughness, B = metalness (three.js convention). Chalk = rough dielectric. */
export const knurlOrm = (repeat: [number, number]) =>
  make(
    `hk-knurl-orm-${repeat.join("x")}`,
    TILE,
    TILE,
    (ctx) => {
      const h = knurlHeight();
      const img = ctx.createImageData(TILE, TILE);
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) {
          const hv = h[y * TILE + x];
          const n = tileNoise(x / TILE, y / TILE, 1.7);
          const chalk = Math.max(0, Math.min(1, (0.3 - hv) * 2.2 + n * 0.45 - 0.1)) * 0.6;
          const rough = 0.14 + (1 - hv) * 0.12 + chalk * 0.6;
          const metal = 1 - chalk;
          const i = (y * TILE + x) * 4;
          img.data[i] = 255;
          img.data[i + 1] = rough * 255;
          img.data[i + 2] = metal * 255;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    { repeat },
  );

/** Fine circumferential machining lines (roughness) for collar and sleeve. */
export const turnedRough = (repeatV: number) =>
  make(
    `hk-turned-${repeatV}`,
    4,
    256,
    (ctx) => {
      let s = 977;
      const r = () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
      };
      for (let y = 0; y < 256; y++) {
        const g = 70 + r() * 70;
        ctx.fillStyle = `rgb(${g},${g},${g})`;
        ctx.fillRect(0, y, 4, 1);
      }
    },
    { repeat: [1, repeatV] },
  );

/** Soft lens-bokeh disc (slightly brighter rim) for out-of-focus chalk motes. */
export const bokehSprite = () =>
  make("hk-bokeh", 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(0.72, "rgba(255,255,255,0.7)");
    g.addColorStop(0.86, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });

/** Soft round mote. */
export const softDot = () =>
  make("hk-dot", 64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.6)");
    g.addColorStop(0.6, "rgba(255,255,255,0.15)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });

/** Wispy puff sprite for the impact dust cloud. */
export const puffSprite = () =>
  make("hk-puff", 128, 128, (ctx) => {
    let s = 4242;
    const r = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < 14; i++) {
      const x = 64 + (r() - 0.5) * 40;
      const y = 64 + (r() - 0.5) * 40;
      const rad = 18 + r() * 26;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, "rgba(255,255,255,0.22)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }
    // fade the square edges
    const m = ctx.createRadialGradient(64, 64, 30, 64, 64, 64);
    m.addColorStop(0, "rgba(0,0,0,0)");
    m.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = m;
    ctx.fillRect(0, 0, 128, 128);
  });

/** Soft elliptical glow for haze cards. */
export const hazeTex = () =>
  make("hk-haze", 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 150, 0, 128, 150, 128);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.35, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
