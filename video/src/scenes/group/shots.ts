import { Easing } from "remotion";
import type { CameraShot, Vec3 } from "../../cgi/Studio";
import { lerp, lerp3 } from "./motion";

export type Setup = "kb" | "rope" | "slam";

export type Shot = {
  id: string;
  from: number; // inclusive, scene frame
  to: number; // exclusive
  setup: Setup;
  a: CameraShot; // camera at `from`
  b: CameraShot; // camera at `to`
  fog?: [number, number];
  /** lighting preset index for the setup */
  look?: number;
};

const c = (position: Vec3, target: Vec3, fov = 36, roll = 0): CameraShot => ({ position, target, fov, roll });

// Every cut sits on a beat (15 f) or, in the tom fill, on the fill's 8th/16th notes.
export const SHOTS: Shot[] = [
  // ---- group_sync ---------------------------------------------------------------
  // A1 kettlebell formation: close 3/4 from the front, just above the top of the swing, so the
  // rows run diagonally up the frame and every handle is seen open (slow push, drop at f0)
  { id: "A1", from: 0, to: 45, setup: "kb", a: c([2.3, 1.78, 3.85], [-0.5, 0.62, -1.3], 42), b: c([1.95, 1.62, 3.25], [-0.5, 0.6, -1.3], 42) },
  // B1 battle ropes, elevated three-quarter side view, slow lateral drift
  { id: "B1", from: 45, to: 90, setup: "rope", a: c([1.35, 2.25, 5.6], [0.75, 0.72, -1.0], 34), b: c([0.95, 2.1, 5.35], [0.55, 0.72, -1.0], 34) },
  // ---- group_energy -------------------------------------------------------------
  // C1 slam balls: down the aisle between two rows (one-point perspective), glossy floor, push
  { id: "C1", from: 90, to: 120, setup: "slam", a: c([5.7, 1.22, -0.5], [-2, 0.0, -0.5], 32), b: c([5.2, 1.12, -0.5], [-2, 0.0, -0.5], 32) },
  // C2 after the crash: floor-level hero on the front ball of the right row, the aisle recedes
  { id: "C2", from: 120, to: 150, setup: "slam", a: c([4.9, 0.15, -1.55], [0.6, 0.66, -0.75], 32, 0.0), b: c([4.65, 0.15, -1.5], [0.6, 0.66, -0.75], 32, -0.015) },
  // ---- montage: a new angle on every beat
  { id: "A2", from: 150, to: 165, setup: "kb", a: c([0.5, 5.4, 2.4], [0, 0.4, -1.1], 40, 0.03), b: c([0.4, 5.0, 2.1], [0, 0.4, -1.1], 40, 0.0) },
  // B2 ropes, mirror of B1 and tighter: the waves cut black against the orange floor pool
  { id: "B2", from: 165, to: 180, setup: "rope", a: c([-1.2, 1.85, 4.3], [-0.2, 0.55, -1.0], 30, -0.02), b: c([-1.0, 1.75, 3.95], [-0.2, 0.55, -1.0], 30, -0.035) },
  // C3 high angle straight down the aisle: the shock rings bloom across the floor
  { id: "C3", from: 180, to: 195, setup: "slam", a: c([2.6, 4.6, -0.5], [-0.2, 0.0, -0.5], 40, 0.0), b: c([2.3, 4.2, -0.5], [-0.2, 0.0, -0.5], 40, 0.03) },
  { id: "A3", from: 195, to: 210, setup: "kb", a: c([-2.2, 1.5, 3.0], [0.4, 0.75, -0.9], 38, 0.0), b: c([-1.9, 1.4, 2.6], [0.4, 0.75, -0.9], 38, 0.02) },
  // ---- tom fill: flash cuts, accelerating
  { id: "B3", from: 210, to: 216, setup: "rope", a: c([1.25, 0.5, 2.7], [0.55, 0.78, 1.0], 30, -0.04), b: c([1.15, 0.5, 2.55], [0.55, 0.78, 1.0], 30, -0.05) },
  { id: "A4", from: 216, to: 222, setup: "kb", a: c([1.75, 1.3, 2.75], [0.85, 0.75, 1.1], 34, -0.05), b: c([1.65, 1.25, 2.6], [0.85, 0.75, 1.1], 34, -0.06) },
  { id: "C4", from: 222, to: 227, setup: "slam", a: c([2.1, 0.22, 1.75], [0.9, 0.42, 0], 36, 0.05), b: c([1.95, 0.22, 1.62], [0.9, 0.42, 0], 36, 0.06) },
  { id: "B4", from: 227, to: 231, setup: "rope", a: c([0.4, 3.6, 4.4], [-0.6, 0.4, -1.0], 40, 0.06), b: c([0.4, 3.4, 4.1], [-0.6, 0.4, -1.0], 40, 0.08) },
  { id: "C5", from: 231, to: 234, setup: "slam", a: c([5.0, 1.2, 1.6], [-1.0, 0.4, 0], 34), b: c([4.7, 1.15, 1.5], [-1.0, 0.4, 0], 34) },
  // A5: whip pan into the breakdown (fast yaw + roll), under the white flash
  { id: "A5", from: 234, to: 240, setup: "kb", a: c([2.3, 1.3, 4.6], [-0.4, 0.8, -1.0], 38, 0), b: c([2.2, 1.3, 4.2], [3.0, 1.6, 1.5], 44, 0.35) },
];

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[SHOTS.length - 1];

export const cameraAt = (shot: Shot, f: number): CameraShot => {
  const raw = (f - shot.from) / Math.max(1, shot.to - shot.from);
  const t = shot.id === "A5" ? Easing.in(Easing.cubic)(raw) : raw;
  return {
    position: lerp3(shot.a.position, shot.b.position, t),
    target: lerp3(shot.a.target, shot.b.target, t),
    fov: lerp(shot.a.fov ?? 36, shot.b.fov ?? 36, t),
    roll: lerp(shot.a.roll ?? 0, shot.b.roll ?? 0, t),
  };
};
