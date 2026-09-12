import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

const MAX_H = 250;

/**
 * The research moment, shown rather than described.
 *
 * Schoenfeld et al. (2017) found hypertrophy similar across low and high loads
 * when sets go to failure — so two bars grow and land level, and an equality
 * rule connects them. The honest caveat (strength still favours heavy) is kept
 * on screen so this cannot read as cherry-picked.
 */
export const EvidenceBars: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const grow = (delay: number) =>
    interpolate(t, [0.28 + delay, 1.02 + delay], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const a = grow(0);
  const b = grow(0.12);
  const equal = interpolate(t, [1.18, 1.52], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const head = interpolate(t, [0.05, 0.34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const src = interpolate(t, [1.42, 1.78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(frame, [durationInFrames - 11, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const Bar: React.FC<{ p: number; label: string }> = ({ p, label }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 132 }}>
      <div style={{ height: MAX_H, display: 'flex', alignItems: 'flex-end' }}>
        <div
          style={{
            width: 96,
            height: MAX_H * p,
            background: `linear-gradient(180deg, #FFE08A 0%, ${T.color.accent} 46%, rgba(255,190,40,0.92) 100%)`,
            borderRadius: `${T.radius.chip}px ${T.radius.chip}px 3px 3px`,
            boxShadow: '0 0 26px rgba(255,210,74,0.30), 0 6px 20px rgba(0,0,0,0.45)'
          }}
        />
      </div>
      <div style={{ fontFamily: T.font.body, fontSize: 20, color: T.color.text, letterSpacing: 1.5, marginTop: 14,
        textShadow: '0 2px 12px rgba(0,0,0,.95)' }}>
        {label}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', left: 86, top: 258, width: 470, opacity: out }}>
      <div style={{ opacity: head }}>
        <div style={{ fontFamily: T.font.body, fontSize: 20, letterSpacing: 3, color: T.color.accent,
          textShadow: '0 2px 12px rgba(0,0,0,.9)' }}>
          MUSCLE GROWTH
        </div>
        <div style={{ width: 58, height: 3, background: T.color.accent, marginTop: 8, borderRadius: 2 }} />
      </div>

      <div style={{ position: 'relative', marginTop: 26 }}>
        <div style={{ display: 'flex', gap: 56 }}>
          <Bar p={a} label="LOW LOAD" />
          <Bar p={b} label="HIGH LOAD" />
        </div>
        {/* equality rule lands only once both bars have settled level */}
        <div
          style={{
            position: 'absolute',
            left: 16,
            width: 306 * equal,
            top: MAX_H - MAX_H * Math.min(a, b) - 2,
            borderTop: `3px dashed ${T.color.text}`,
            opacity: equal * 0.95,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 142,
            top: MAX_H / 2 - 38,
            fontFamily: T.font.display,
            fontSize: 58,
            color: T.color.text,
            opacity: equal,
            transform: `scale(${0.7 + equal * 0.3})`,
            textShadow: '0 2px 16px rgba(0,0,0,.9)',
          }}
        >
          ≈
        </div>
      </div>

      <div style={{ opacity: src, marginTop: 22 }}>
        <div style={{ fontFamily: T.font.body, fontSize: 23, color: T.color.text,
          textShadow: '0 2px 14px rgba(0,0,0,.95)' }}>
          Schoenfeld et al. (2017)
        </div>
        <div style={{ fontFamily: T.font.body, fontSize: 19, color: 'rgba(255,255,255,0.86)', marginTop: 5,
          textShadow: '0 2px 14px rgba(0,0,0,.95)' }}>
          J Strength Cond Res · sets taken to failure
        </div>
        <div style={{ fontFamily: T.font.body, fontSize: 18, color: T.color.accent, marginTop: 12,
          textShadow: '0 2px 14px rgba(0,0,0,.95)' }}>
          Max strength still favours heavy loads.
        </div>
      </div>
    </div>
  );
};
