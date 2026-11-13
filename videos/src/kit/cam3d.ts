import {H, W} from './theme';
import type {V2, V3} from './math';

/** Minimal perspective camera: world y is up, units ≈ centimetres. */
export type Cam = {pos: V3; target: V3; fov: number; roll?: number; cx?: number; cy?: number};

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1e-9;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export type Projected = {x: number; y: number; z: number; s: number; visible: boolean};

export const makeProjector = (cam: Cam) => {
  const f = nrm(sub(cam.target, cam.pos));
  const r = nrm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const F = H / 2 / Math.tan(((cam.fov * Math.PI) / 180) / 2);
  const cr = Math.cos(cam.roll ?? 0), sr = Math.sin(cam.roll ?? 0);
  const cx = cam.cx ?? W / 2, cy = cam.cy ?? H / 2;
  return (p: V3): Projected => {
    const d = sub(p, cam.pos);
    let xc = dot(d, r), yc = dot(d, u);
    const zc = dot(d, f);
    const x2 = xc * cr - yc * sr;
    yc = xc * sr + yc * cr;
    xc = x2;
    const zz = Math.max(zc, 1);
    const s = F / zz;
    return {x: cx + xc * s, y: cy - yc * s, z: zc, s, visible: zc > 5};
  };
};

export const toV2 = (p: Projected): V2 => [p.x, p.y];
