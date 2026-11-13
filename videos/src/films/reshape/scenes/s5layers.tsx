import React from 'react';
import {ContactShadow, Figure, OUTFITS} from '../../../kit/Figure';
import {clamp, E, kf, lerp, seg, type V2} from '../../../kit/math';
import {GlowDefs, LightPool, MotionPath} from '../../../kit/Path';
import {coachGesture, squat, stand, walk} from '../../../kit/poses';
import {ADULT, d2r as A, solve, type PoseCtl} from '../../../kit/rig';
import {C} from '../../../kit/theme';
import {wordAt} from '../timeline';
import {camAt, camT, kd, PATH_D, pathW, Phrase, pr, RA, toScreen, UL, type Cam} from './s45parts';

/**
 * S5 content, drawn in the facility's world space (upper floor, left zone x < 80):
 * a coach demonstrates, the trainee practises and is corrected, milestones light up along the floor path,
 * the last one rises into a step the trainee stands on. All pure functions of the film frame f.
 */
const FIG = 1.05;
const TRAINER = {x: -575, d: 0.55};
const TRAINEE0 = {x: -360, d: 0.2};
const NODES = [{x: -205}, {x: -85}, {x: 40}];
const ND = PATH_D; // depth of the progress path / nodes (same as the facility path)
const STEP_H = 34; // rise of the last node's step (world units)

const w = (i: number) => wordAt('L5', i);

const floorAt = (cam: Cam, x: number, d: number): V2 => pr(RA, cam.x, x, RA.floor, d);

/** trainee timeline: watch → attempt 1 (too much forward lean) → corrected rep → walks the path → steps up. */
const trainee = (f: number): {pose: PoseCtl; x: number; lift: number; flip: boolean} => {
  const t = f / 30;
  const t1 = 934, t2 = 964, tw0 = 996, tw1 = 1018;
  if (f < t1) return {pose: stand(ADULT, t), x: TRAINEE0.x, lift: 0, flip: false};
  if (f < t1 + 26) {
    // attempt 1: shallow, chest collapses forward
    const k = Math.sin(((f - t1) / 26) * Math.PI);
    const p = squat(0.62 * E.inOutSine(k));
    return {pose: {...p, torso: p.torso + A(34 * k), head: (p.head ?? 0) + A(14 * k), aN: {fk: [A(150), A(140)]}, aF: {fk: [A(156), A(146)]}}, x: TRAINEE0.x, lift: 0, flip: false};
  }
  if (f < t2) return {pose: stand(ADULT, t), x: TRAINEE0.x, lift: 0, flip: false};
  if (f < t2 + 30) {
    // corrected rep: full depth, chest up
    const k = Math.sin(((f - t2) / 30) * Math.PI);
    return {pose: squat(E.inOutSine(k)), x: TRAINEE0.x, lift: 0, flip: false};
  }
  if (f < tw0) return {pose: stand(ADULT, t), x: TRAINEE0.x, lift: 0, flip: false};
  if (f < tw1) {
    const k = (f - tw0) / (tw1 - tw0);
    const x = lerp(TRAINEE0.x, NODES[2].x - 10, E.inOutSine(k));
    return {pose: walk(k * 1.6, ADULT, {stride: 22}), x, lift: 0, flip: false};
  }
  // step up onto the risen marker and stand tall
  const up = E.outCubic(seg(f, tw1, tw1 + 8));
  const p = stand(ADULT, t);
  return {pose: {...p, torso: A(0), aN: {fk: [A(172), A(160)]}}, x: NODES[2].x - 10, lift: STEP_H * up, flip: false};
};

/** coach timeline: demonstrates a slow perfect squat, then guides (points), then approves. */
const trainer = (f: number): PoseCtl => {
  const t = f / 30;
  if (f >= 900 && f < 930) return squat(E.inOutSine(Math.sin(((f - 900) / 30) * Math.PI)));
  if (f >= 936 && f < 968) return coachGesture(E.inOutSine(clamp((f - 936) / 8) * (1 - clamp((f - 960) / 8))), t);
  if (f >= 1016) return coachGesture(1 + E.inOutSine(clamp((f - 1016) / 10)), t);
  return stand(ADULT, t);
};

const Check: React.FC<{x: number; y: number; r: number; p: number}> = ({x, y, r, p}) => {
  if (p <= 0) return null;
  const e = E.outBack(clamp(p));
  const d = `M${x - r * 0.42} ${y + r * 0.02}L${x - r * 0.1} ${y + r * 0.34}L${x + r * 0.46} ${y - r * 0.3}`;
  return (
    <g opacity={clamp(p * 2)} transform={`translate(${x} ${y}) scale(${e}) translate(${-x} ${-y})`}>
      <circle cx={x} cy={y} r={r} fill={C.orange} />
      <path d={d} fill="none" stroke={C.light} strokeWidth={r * 0.2} strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={r * 2} strokeDashoffset={r * 2 * (1 - clamp((p - 0.2) / 0.6))} />
    </g>
  );
};

export const S5World: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f);
  const dimK = 0.64 * E.inOutSine(clamp((f - 1058) / 32)); // recede with the building at the exit (the path stays bright)
  const at = [w(2) + 2, w(3) + 2, w(4) + 4]; // milestones light on «خطوات», «واضحة», «وتطوّر»
  const rise = E.outCubic(seg(f, at[2] + 4, at[2] + 18));
  // progress path along the floor at depth ND: from the trainee through the three markers into the facility path (starts at x = UL)
  const x0 = TRAINEE0.x + 40;
  const pathPts: V2[] = [];
  for (let x = x0; x <= UL + 0.01; x += 12) pathPts.push(floorAt(cam, x, ND));
  pathPts.push(floorAt(cam, UL, ND));
  const fracOf = (x: number) => clamp((x - x0) / (UL - x0));
  const pathTo = kf<number>(f, [
    [922, 0, E.linear], [at[0], fracOf(NODES[0].x), E.inOutSine], [at[1], fracOf(NODES[1].x), E.inOutSine],
    [at[2], fracOf(NODES[2].x), E.inOutSine], [at[2] + 16, 1, E.inOutCubic],
  ]);
  const tr = trainee(f);
  const coach = trainer(f);
  const pT = floorAt(cam, tr.x, TRAINEE0.d);
  const pC = floorAt(cam, TRAINER.x, TRAINER.d);
  const sT = FIG * kd(TRAINEE0.d), sC = FIG * kd(TRAINER.d);
  // training mat
  const mat = [floorAt(cam, -660, 0.08), floorAt(cam, -250, 0.08), floorAt(cam, -250, 0.7), floorAt(cam, -660, 0.7)];
  // alignment line on the corrected rep (bottom of the squat)
  const align = seg(f, 972, 979) * (1 - seg(f, 990, 998));
  const jT = solve(tr.pose, ADULT);
  return (
    <g transform={camT(cam)}>
      <defs>
        <filter id="s5dim" x="-20%" y="-20%" width="140%" height="140%">
          <feComponentTransfer>
            <feFuncR type="linear" slope={1 - dimK} />
            <feFuncG type="linear" slope={1 - dimK} />
            <feFuncB type="linear" slope={1 - dimK} />
          </feComponentTransfer>
        </filter>
      </defs>
      <g filter={dimK > 0.001 ? 'url(#s5dim)' : undefined}>
      <polygon points={mat.map((p) => p.join(',')).join(' ')} fill="#26272B" opacity={0.95} />
      <polygon points={mat.map((p) => p.join(',')).join(' ')} fill="none" stroke="#4A4B51" strokeWidth={2} />
      {/* soft key light on the training zone */}
      <LightPool x={pT[0] - 90} y={pT[1] - 10} rx={420} ry={90} color={C.light} opacity={0.12} />
      {NODES.map((n, i) => {
        const on = seg(f, at[i], at[i] + 8, E.outCubic);
        const appear = seg(f, at[i] - 10, at[i]);
        const p = floorAt(cam, n.x, ND);
        const k = kd(ND);
        const lift = i === 2 ? STEP_H * rise : 0;
        return (
          <g key={i} opacity={appear}>
            {i === 2 && rise > 0 ? (
              <>
                {/* the last marker rises into a step */}
                <rect x={p[0] - 62 * k} y={p[1] - lift} width={124 * k} height={lift} fill="#3A3B40" />
                <ellipse cx={p[0]} cy={p[1] - lift} rx={62 * k} ry={13 * k} fill="#4A4B51" />
              </>
            ) : null}
            <ellipse cx={p[0]} cy={p[1] - lift} rx={46 * k} ry={10 * k} fill="none" stroke={C.orange} strokeWidth={4} opacity={0.9} />
            <ellipse cx={p[0]} cy={p[1] - lift} rx={30 * k * on} ry={6.5 * k * on} fill={C.orange} opacity={0.9} />
            {on > 0 ? <LightPool x={p[0]} y={p[1] - lift} rx={110 * k} ry={30 * k} color={C.orange} opacity={0.35 * on} /> : null}
            <Check x={p[0]} y={p[1] - lift - 64 * k} r={15} p={seg(f, at[i] + 4, at[i] + 16)} />
          </g>
        );
      })}
      {/* coach (behind) */}
      <ContactShadow x={pC[0]} y={pC[1]} w={120 * sC} opacity={0.35} />
      <Figure j={solve(coach, ADULT)} P={ADULT} o={OUTFITS.coach} x={pC[0]} y={pC[1]} scale={sC} rim={{color: C.orange, dx: 2, dy: -1, opacity: 0.6}} />
      {/* trainee (front) */}
      <ContactShadow x={pT[0]} y={pT[1] - tr.lift * kd(TRAINEE0.d)} w={130 * sT} opacity={0.4} />
      <Figure j={jT} P={ADULT} o={OUTFITS.athlete2} x={pT[0]} y={pT[1] - tr.lift * kd(TRAINEE0.d)} scale={sT} rim={{color: C.orange, dx: 2.2, dy: -1, opacity: 0.7}} />
      {align > 0 ? (
        <line x1={pT[0] + jT.pelvis[0] * sT} y1={pT[1] + jT.pelvis[1] * sT} x2={pT[0] + (jT.pelvis[0] + (jT.neckBase[0] - jT.pelvis[0]) * 1.25) * sT} y2={pT[1] + (jT.pelvis[1] + (jT.neckBase[1] - jT.pelvis[1]) * 1.25) * sT}
          stroke={C.orangeHot} strokeWidth={3} opacity={0.9 * align} strokeLinecap="round" />
      ) : null}
      </g>
      {/* progress path (stays bright like the facility path) — drawn under the cast would hide it at the feet, so it sits on top at floor level */}
      <MotionPath pts={pathPts} to={pathTo} width={pathW(cam.z)} head={pathTo < 0.995 ? 11 / Math.pow(cam.z, 0.55) : 0} glow={0.55} />
    </g>
  );
};

/** Key phrases written on the room's back wall (they live in the space and move with the camera). */
export const S5Text: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f);
  const at = (x: number, y: number) => toScreen(cam, pr(RA, cam.x, x, y, 1));
  const size = 112 * kd(1) * cam.z;
  const ph = [
    {words: [{t: 'تدريب', at: w(0)}, {t: 'حضوري', at: w(1), color: C.orange}], out: w(2) - 12, x: -380, y: 210},
    {words: [{t: 'خطوات', at: w(2)}, {t: 'واضحة', at: w(3), color: C.orange}], out: w(4) - 12, x: -300, y: 210},
    {words: [{t: 'تطوّر', at: w(4)}, {t: 'ينشاف', at: w(5), color: C.orange}], out: 1052, x: -260, y: 210},
  ];
  return (
    <>
      {ph.map((p, i) => {
        const [x, y] = at(p.x, p.y);
        return <Phrase key={i} f={f} words={p.words} outAt={p.out} size={size} x={x} y={y} gap={0.3} />;
      })}
    </>
  );
};

export const S5Overlay: React.FC<{f: number; withText?: boolean}> = ({f, withText = true}) => (
  <>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <GlowDefs />
      <S5World f={f} />
    </svg>
    {withText ? <S5Text f={f} /> : null}
  </>
);
