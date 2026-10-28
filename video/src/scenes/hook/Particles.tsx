import React, { useEffect, useMemo } from "react";
import { interpolate } from "remotion";
import * as THREE from "three";
import type { Vec3 } from "../../cgi/Studio";
import { bokehSprite, puffSprite, softDot } from "./hookTextures";

// Deterministic particle helpers for the hook scene. Every position is a pure function of
// `time` (seconds), so frames render identically on every worker.

const rng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const wrap = (x: number, c: number, size: number) => {
  const lo = c - size / 2;
  return lo + ((((x - lo) % size) + size) % size);
};

const spriteFor = (kind: "dot" | "bokeh" | "puff") => (kind === "bokeh" ? bokehSprite() : kind === "puff" ? puffSprite() : softDot());

/** Slowly drifting chalk motes inside a box (wraps on all axes so the field never empties). */
export const Motes: React.FC<{
  count: number;
  time: number;
  box: Vec3;
  center: Vec3;
  size: number;
  color?: string;
  opacity?: number;
  seed?: number;
  sprite?: "dot" | "bokeh";
  drift?: Vec3;
}> = ({ count, time, box, center, size, color = "#ffd2b5", opacity = 0.5, seed = 7, sprite = "dot", drift = [0.004, 0.006, 0] }) => {
  const base = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      p: [(r() - 0.5) * box[0], (r() - 0.5) * box[1], (r() - 0.5) * box[2]] as Vec3,
      v: [(r() - 0.3) * 1.4, (r() - 0.2) * 1.4, (r() - 0.5) * 1.2] as Vec3,
      w: r() * Math.PI * 2,
    }));
  }, [count, box, seed]);
  const geo = useMemo(() => {
    const arr = new Float32Array(count * 3);
    base.forEach((b, i) => {
      const x = center[0] + b.p[0] + b.v[0] * drift[0] * time * 10 + Math.sin(time * 0.8 + b.w) * box[0] * 0.015;
      const y = center[1] + b.p[1] + b.v[1] * drift[1] * time * 10 + Math.cos(time * 0.6 + b.w) * box[1] * 0.015;
      const z = center[2] + b.p[2] + b.v[2] * drift[2] * time * 10;
      arr[i * 3] = wrap(x, center[0], box[0]);
      arr[i * 3 + 1] = wrap(y, center[1], box[1]);
      arr[i * 3 + 2] = wrap(z, center[2], box[2]);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [base, time, center, box, drift, count]);
  // a new buffer is built every frame: free the previous one so long renders do not leak
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={size}
        map={spriteFor(sprite)}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

/**
 * Floor-impact dust: chalk/rubber dust thrown out radially from contact points, slowing by
 * drag and lifting softly. `t` = seconds since impact (negative = nothing).
 */
export const ImpactDust: React.FC<{
  t: number;
  origins: Vec3[];
  count?: number;
  seed?: number;
  color?: string;
  grit?: number;
  puffs?: number;
}> = ({ t, origins, count = 170, seed = 31, color = "#e9c4a8", grit = 0.024, puffs = 100 }) => {
  const parts = useMemo(() => {
    const r = rng(seed);
    const mk = (n: number, fast: boolean) =>
      Array.from({ length: n }, (_, i) => {
        const o = origins[i % origins.length];
        const a = r() * Math.PI * 2;
        const sp = fast ? 0.8 + r() * 2.6 : 0.7 + r() * 1.5;
        return {
          o,
          d: [Math.cos(a) * sp, (fast ? 0.15 + r() * 0.9 : 0.12 + r() * 0.35) * (fast ? 1.4 : 1), Math.sin(a) * sp * 0.8] as Vec3,
          k: fast ? 3.5 + r() * 3 : 2.2 + r() * 1.4,
          jitter: r(),
        };
      });
    return { grit: mk(count, true), puff: mk(puffs, false) };
  }, [origins, count, puffs, seed]);

  const build = (list: typeof parts.grit, rise: number) => {
    const arr = new Float32Array(list.length * 3);
    const tt = Math.max(0, t);
    list.forEach((p, i) => {
      const f = (1 - Math.exp(-p.k * tt)) / p.k;
      arr[i * 3] = p.o[0] + p.d[0] * f;
      arr[i * 3 + 1] = Math.max(0.005, p.o[1] + 0.01 + p.d[1] * f + rise * tt * (0.4 + p.jitter) - (rise === 0 ? 0.9 * tt * tt * 0.5 : 0));
      arr[i * 3 + 2] = p.o[2] + p.d[2] * f;
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  };
  const gritGeo = useMemo(() => build(parts.grit, 0), [parts, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const puffGeoA = useMemo(() => build(parts.puff.slice(0, Math.ceil(parts.puff.length / 2)), 0.05), [parts, t]); // eslint-disable-line react-hooks/exhaustive-deps
  const puffGeoB = useMemo(() => build(parts.puff.slice(Math.ceil(parts.puff.length / 2)), 0.05), [parts, t]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => gritGeo.dispose(), [gritGeo]);
  useEffect(() => () => puffGeoA.dispose(), [puffGeoA]);
  useEffect(() => () => puffGeoB.dispose(), [puffGeoB]);

  if (t < 0) return null;
  // Big sprites are the expensive part on a CPU rasteriser: cap their size and stop drawing
  // each layer as soon as it has faded (the cloud is fully gone ~1.25 s after impact).
  const gone = interpolate(t, [0.75, 1.25], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gritO = Math.exp(-t / 0.35) * 0.55;
  const puffO = Math.min(1, t / 0.06) * Math.exp(-t / 0.7) * 0.32 * gone;
  return (
    <group>
      {gritO > 0.01 ? (
        <points geometry={gritGeo} frustumCulled={false}>
          <pointsMaterial size={grit} map={softDot()} color={color} transparent opacity={gritO} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>
      ) : null}
      {puffO > 0.01
        ? // two puff layers at different sprite sizes so the cloud never reads as identical discs
          ([
            [puffGeoA, Math.min(0.62, 0.3 + t * 0.5), 1],
            [puffGeoB, Math.min(0.34, 0.16 + t * 0.3), 1.25],
          ] as const).map(([g, size, k], i) => (
            <points key={i} geometry={g} frustumCulled={false}>
              <pointsMaterial
                size={size}
                map={puffSprite()}
                color="#b9a597"
                transparent
                opacity={Math.min(1, puffO * k)}
                depthWrite={false}
                blending={THREE.NormalBlending}
                sizeAttenuation
              />
            </points>
          ))
        : null}
    </group>
  );
};
