import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Figure, ContactShadow, OUTFITS} from '../../kit/Figure';
import {ADULT, CHILD, solve, type PoseCtl, type Props} from '../../kit/rig';
import {coachGesture, frontLever, hop, pressHandstand, pullUp, pushUp, squat, stand, storkBalance, walk} from '../../kit/poses';
import {C} from '../../kit/theme';
import {ensureFonts} from '../../kit/fonts';

ensureFonts();

type Cell = {label: string; pose: PoseCtl; P?: Props; bar?: boolean; ground?: boolean; o?: keyof typeof OUTFITS; oy?: number; s?: number};

export const RigTest: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const cells: Cell[] = [
    {label: 'stand', pose: stand(ADULT, t), ground: true},
    {label: 'squat', pose: squat(1), ground: true},
    {label: 'hang', pose: pullUp(0), bar: true},
    {label: 'pull top', pose: pullUp(1), bar: true},
    {label: 'pushup top', pose: pushUp(0), ground: true},
    {label: 'pushup bottom', pose: pushUp(1), ground: true},
    {label: 'crow', pose: pressHandstand(0), ground: true},
    {label: 'tuck hs', pose: pressHandstand(2), ground: true},
    {label: 'handstand', pose: pressHandstand(3), ground: true},
    {label: 'tuck lever', pose: frontLever(0), bar: true},
    {label: 'front lever', pose: frontLever(3), bar: true},
    {label: 'walk', pose: walk(0.15, ADULT), ground: true, o: 'coach'},
    {label: 'kid stork', pose: storkBalance(t, CHILD), P: CHILD, ground: true, o: 'kidA', s: 1.2},
    {label: 'kid hop', pose: hop(0.55, CHILD).pose, P: CHILD, ground: true, o: 'kidB', s: 1.2, oy: hop(0.55, CHILD).dy},
    {label: 'coach point', pose: coachGesture(1, t), ground: true, o: 'coach'},
  ];
  const cols = 3, cw = 360, ch = 384;
  return (
    <AbsoluteFill style={{background: C.dark}}>
      <svg width={1080} height={1920}>
        {cells.map((c, i) => {
          const cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * ch;
          const P = c.P ?? ADULT;
          const j = solve(c.pose, P);
          const s = (c.s ?? 0.78);
          const gx = cx, gy = c.bar ? cy + 70 : cy + ch - 40;
          return (
            <g key={i}>
              <rect x={cx - cw / 2 + 4} y={cy + 4} width={cw - 8} height={ch - 8} fill="none" stroke="#ffffff22" />
              {c.ground ? <line x1={cx - 160} x2={cx + 160} y1={gy} y2={gy} stroke="#ffffff33" strokeWidth={2} /> : null}
              {c.bar ? <line x1={cx - 140} x2={cx + 140} y1={gy} y2={gy} stroke={C.light} strokeWidth={8} strokeLinecap="round" /> : null}
              {c.ground ? <ContactShadow x={gx} y={gy} w={120} /> : null}
              <Figure j={j} P={P} o={OUTFITS[c.o ?? 'athlete']} x={gx} y={gy + (c.oy ?? 0) * s} scale={s} rim={{color: C.orange, dx: 2.5, dy: -1, opacity: 0.85}} />
              <text x={cx - cw / 2 + 14} y={cy + 30} fill="#ffffffaa" fontSize={22} fontFamily="Barlow SC">{c.label}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
