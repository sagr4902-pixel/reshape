import React, { useMemo } from 'react';
import { evolvePath, getLength } from '@remotion/paths';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';
import { BloodParticle } from './BloodParticle';

const VB = { w: 500, h: 470 };
const TRUNK = 'M 250 18 L 250 128';
const BRANCHES = [
  'M 250 128 C 250 188 120 192 112 256 C 108 292 118 300 114 338',
  'M 250 128 C 252 190 246 214 250 338',
  'M 250 128 C 250 188 380 192 388 256 C 392 292 382 300 386 338',
];
/** capillary splays, so the vessel ends organically instead of on flat feet */
const FORKS = [114, 250, 386].flatMap((x) => [
  `M ${x} 338 C ${x - 6} 368 ${x - 22} 372 ${x - 34} 396`,
  `M ${x} 338 C ${x + 6} 368 ${x + 22} 372 ${x + 34} 396`,
]);
/** full routes for the cells: trunk + one branch, so flow is continuous */
const LANES = BRANCHES.map((b) => TRUNK + ' ' + b.replace(/^M [\d.]+ [\d.]+ /, ''));


/**
 * The blood-flow moment. Rather than a panel parked beside him, the word he
 * actually says — PUMP — sprouts a vessel that grows down into the open sky
 * beside his head, branches, and fills with cells travelling one way.
 *
 * Scientifically it says only what is defensible: flow to working muscle rises.
 * The tissue glow is capped low on purpose; nothing here implies growth.
 */
export const VesselBloom: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const lens = useMemo(() => LANES.map((d) => getLength(d)), []);

  const wordIn = spring({ frame, fps, config: T.spring.pop, durationInFrames: 16 });
  const trunkP = interpolate(t, [0.20, 0.62], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const branchP = interpolate(t, [0.52, 1.18], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const flow = interpolate(t, [1.02, 1.42], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const glow = interpolate(Math.sin(Math.max(t - 1.25, 0) * Math.PI * 1.5), [0, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    * interpolate(t, [1.25, 1.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tagIn = interpolate(t, [1.15, 1.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const trunkEv = evolvePath(trunkP, TRUNK);

  return (
    <div style={{ position: 'absolute', left: 566, top: 214, width: VB.w, height: VB.h + 140, opacity: out }}>
      {/* the spoken word, which the vessel grows out of */}
      <div
        style={{
          fontFamily: T.font.display,
          fontSize: 92,
          color: T.color.text,
          textAlign: 'center',
          letterSpacing: 2,
          textShadow: '0 4px 20px rgba(0,0,0,.6)',
          opacity: wordIn,
          transform: `scale(${interpolate(wordIn, [0, 1], [0.82, 1])})`,
          marginBottom: -18,
        }}
      >
        PUMP
      </div>

      <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width={VB.w} height={VB.h}>
        <defs>
          <radialGradient id="tissue">
            <stop offset="0%" stopColor={T.color.blood} stopOpacity={0.30} />
            <stop offset="100%" stopColor={T.color.blood} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* working tissue answering the flow — deliberately faint */}
        <ellipse cx={250} cy={340} rx={220} ry={96} fill="url(#tissue)" opacity={glow} />

        {BRANCHES.map((d, i) => {
          const ev = evolvePath(Math.max(branchP * 1.2 - i * 0.1, 0), d);
          return (
            <path key={i} d={d} stroke={T.color.blood} strokeWidth={T.stroke.capillary} fill="none"
              strokeLinecap="round" opacity={0.85}
              strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
          );
        })}
        <path d={TRUNK} stroke={T.color.blood} strokeWidth={T.stroke.vessel} fill="none" strokeLinecap="round"
          strokeDasharray={trunkEv.strokeDasharray} strokeDashoffset={trunkEv.strokeDashoffset} />
        {FORKS.map((d, i) => {
          const ev = evolvePath(Math.max(branchP * 1.6 - 0.62, 0), d);
          return (
            <path key={`f${i}`} d={d} stroke={T.color.blood} strokeWidth={3.4} fill="none" strokeLinecap="round"
              opacity={0.8} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
          );
        })}

        <g opacity={flow}>
          {LANES.map((d, li) =>
            new Array(5).fill(0).map((_, pi) => {
              const phase = (t / 1.55 + pi / 5 + li * 0.19) % 1;
              return <BloodParticle key={`${li}-${pi}`} path={d} length={lens[li]} progress={phase} r={5} />;
            }),
          )}
        </g>
      </svg>

      <div style={{ textAlign: 'center', marginTop: -46, opacity: tagIn }}>
        <div style={{ fontFamily: T.font.body, fontSize: 26, color: T.color.accent, letterSpacing: 2,
          textShadow: '0 2px 14px rgba(0,0,0,.95), 0 0 26px rgba(0,0,0,.8)' }}>
          EXERCISE HYPEREMIA
        </div>
        <div style={{ fontFamily: T.font.body, fontSize: 20, color: T.color.text, marginTop: 7, opacity: 0.92,
          textShadow: '0 2px 14px rgba(0,0,0,.95), 0 0 26px rgba(0,0,0,.85)' }}>
          blood flow to working muscle rises
        </div>
      </div>
    </div>
  );
};
