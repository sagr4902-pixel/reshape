/**
 * Tiny axonometric scene engine.
 *
 * One projection for every drawing on the site: plan coordinates in metres
 * (x → east, y → south, z → up) are projected with a fixed isometric camera
 * looking from the south-east corner. Output is plain SVG markup with CSS
 * classes; colours come from a theme stylesheet embedded in the file.
 *
 * Pure functions only — used by scripts/build-scenes.ts and by unit tests.
 */

export type V3 = readonly [number, number, number];
export type V2 = readonly [number, number];

export const SCALE = 30; // px per metre
const COS30 = Math.cos(Math.PI / 6);

/** Project a point in metres to unshifted scene pixels. */
export function project([x, y, z]: V3): V2 {
  return [(x - y) * COS30 * SCALE, ((x + y) * 0.5 - z) * SCALE];
}

const r = (n: number) => (Math.round(n * 10) / 10).toString();

interface Item {
  group: string;
  depth: number;
  svg: string;
}

export class SceneBuilder {
  private items: Item[] = [];
  private group = 'base';
  private seq = 0;
  minX = Infinity;
  minY = Infinity;
  maxX = -Infinity;
  maxY = -Infinity;

  setGroup(group: string) {
    this.group = group;
  }

  private p(v: V3): V2 {
    const q = project(v);
    if (q[0] < this.minX) this.minX = q[0];
    if (q[1] < this.minY) this.minY = q[1];
    if (q[0] > this.maxX) this.maxX = q[0];
    if (q[1] > this.maxY) this.maxY = q[1];
    return q;
  }

  private push(svg: string, depth: number) {
    // seq keeps insertion order stable for equal depths (deterministic output)
    this.items.push({ group: this.group, depth: depth + this.seq++ * 1e-6, svg });
  }

  private static depthOf(pts: readonly V3[]): number {
    let d = 0;
    for (const [x, y, z] of pts) d += x + y + z * 0.02;
    return d / pts.length;
  }

  private d(pts: readonly V3[], close = true): string {
    return (
      pts
        .map((v, i) => {
          const [x, y] = this.p(v);
          return `${i ? 'L' : 'M'}${r(x)} ${r(y)}`;
        })
        .join('') + (close ? 'Z' : '')
    );
  }

  /** Filled polygon. `depth` overrides painter ordering when given. */
  poly(pts: readonly V3[], cls: string, depth?: number) {
    this.push(`<path class="${cls}" d="${this.d(pts)}"/>`, depth ?? SceneBuilder.depthOf(pts));
  }

  /** Polygon with holes (even-odd). */
  polyHoles(outer: readonly V3[], holes: readonly (readonly V3[])[], cls: string, depth?: number) {
    const d = [outer, ...holes].map((ring) => this.d(ring)).join('');
    this.push(`<path class="${cls}" fill-rule="evenodd" d="${d}"/>`, depth ?? SceneBuilder.depthOf(outer));
  }

  /** Open polyline (stroke only). */
  line(pts: readonly V3[], cls: string, depth?: number) {
    this.push(`<path class="${cls}" d="${this.d(pts, false)}"/>`, depth ?? SceneBuilder.depthOf(pts));
  }

  /** Circle with a radius in metres, centred on a 3D point. */
  dot(c: V3, radius: number, cls: string, depth?: number) {
    const [x, y] = this.p(c);
    this.push(
      `<circle class="${cls}" cx="${r(x)}" cy="${r(y)}" r="${r(radius * SCALE)}"/>`,
      depth ?? c[0] + c[1] + c[2] * 0.02,
    );
  }

  /** Flat ellipse lying on a horizontal plane (soft contact shadow, floor marks). */
  floorEllipse(c: V3, rx: number, ry: number, cls: string) {
    const [x, y] = this.p(c);
    this.push(
      `<ellipse class="${cls}" cx="${r(x)}" cy="${r(y)}" rx="${r(rx * SCALE * COS30 * 1.15)}" ry="${r(ry * SCALE * 0.58)}"/>`,
      c[0] + c[1] - 0.5,
    );
  }

  /** Axis-aligned box. Draws the three faces visible from the south-east. */
  box(x: number, y: number, z: number, w: number, d: number, h: number, base: string) {
    const depth = x + w / 2 + y + d / 2 + z * 0.02;
    const x1 = x + w;
    const y1 = y + d;
    const z1 = z + h;
    this.poly([[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]], `${base}-l`, depth);
    this.poly([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], `${base}-r`, depth);
    this.poly([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], `${base}-t`, depth + 0.001);
  }

  /** Thin vertical wall between two plan points. */
  wall(a: V2, b: V2, z0: number, h: number, cls: string, depth?: number) {
    this.poly(
      [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z0 + h], [a[0], a[1], z0 + h]],
      cls,
      depth,
    );
  }

  /** Anchor point (invisible) used by tests to verify overlay alignment. */
  anchor(id: string, v: V3) {
    const [x, y] = this.p(v);
    this.push(`<circle class="anchor" data-anchor="${id}" cx="${r(x)}" cy="${r(y)}" r="1"/>`, 1e6);
    return [x, y] as V2;
  }

  bounds(margin: number) {
    return {
      x: Math.floor(this.minX - margin),
      y: Math.floor(this.minY - margin),
      w: Math.ceil(this.maxX - this.minX + margin * 2),
      h: Math.ceil(this.maxY - this.minY + margin * 2),
    };
  }

  /** Serialise groups in the given order; items inside a group are depth-sorted. */
  render(groupOrder: readonly string[], include?: (group: string) => boolean): string {
    const out: string[] = [];
    for (const g of groupOrder) {
      if (include && !include(g)) continue;
      const items = this.items.filter((i) => i.group === g).sort((a, b) => a.depth - b.depth);
      if (!items.length) continue;
      out.push(`<g data-zone="${g}">${items.map((i) => i.svg).join('')}</g>`);
    }
    return out.join('');
  }
}

/** Screen-space bounding box of a 3D box, padded. */
export function boxBounds(
  min: V3,
  max: V3,
  pad: number,
): { x: number; y: number; w: number; h: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const x of [min[0], max[0]])
    for (const y of [min[1], max[1]])
      for (const z of [min[2], max[2]]) {
        const [sx, sy] = project([x, y, z]);
        x0 = Math.min(x0, sx);
        y0 = Math.min(y0, sy);
        x1 = Math.max(x1, sx);
        y1 = Math.max(y1, sy);
      }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}
