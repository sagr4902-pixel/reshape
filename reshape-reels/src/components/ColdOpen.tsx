import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/**
 * Cold open. His own silhouette — matted from the pose he lands later — holds
 * in the dark while the claim the video answers is put as a question. The flash
 * at the end is the cut into the live take, so the shape you were looking at
 * becomes the man talking.
 */
export const ColdOpen: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const D = durationInFrames / fps;

  const sil = spring({ frame, fps, config: T.spring.panel, durationInFrames: 30 });
  const silScale = interpolate(sil, [0, 1], [1.08, 1]);
  const rise = interpolate(t, [0.25, 0.95], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rise2 = interpolate(t, [0.5, 1.2], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const rule = interpolate(t, [0.15, 0.8], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // the cut: a fast push plus a flash frame
  const cut = interpolate(t, [D - 0.26, D], [0, 1], { easing: Easing.in(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const flash = interpolate(t, [D - 0.13, D - 0.03], [0, 0.85], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#07090C', transform: `scale(${1 + cut * 0.12})` }}>
      <AbsoluteFill style={{ background: 'radial-gradient(58% 38% at 50% 62%, rgba(255,210,74,0.13) 0%, rgba(0,0,0,0) 70%)' }} />
      <AbsoluteFill style={{ opacity: interpolate(sil, [0, 1], [0, 1]) * 0.96 }}>
        <Img
          src={staticFile('silhouette.png')}
          style={{
            position: 'absolute', width: 1350 * 0.88, height: 2400 * 0.88,
            left: (width - 1350 * 0.88) / 2, top: (height - 2400 * 0.88) / 2 + 60,
            transform: `scale(${silScale})`,
          }}
        />
      </AbsoluteFill>

      <div style={{ position: 'absolute', left: T.safe.left + 24, right: T.safe.left + 24, top: 250, direction: 'rtl', textAlign: 'center' }}>
        <div style={{
          fontFamily: T.font.body, fontSize: 30, letterSpacing: 4, color: T.color.danger,
          opacity: rule, transform: `translateY(${(1 - rule) * 10}px)`,
        }}>
          الادعاء الشائع
        </div>
        <div style={{ width: `${rule * 30}%`, height: 2, background: T.color.danger, margin: '16px auto 26px', opacity: 0.75 }} />
        <div style={{
          fontFamily: T.font.display, fontSize: 76, lineHeight: 1.32, color: T.color.text,
          textShadow: '0 6px 30px rgba(0,0,0,.85)',
        }}>
          <div style={{ opacity: rise, transform: `translateY(${(1 - rise) * 18}px)` }}>تمرين وزن الجسم</div>
          <div style={{ opacity: rise2, transform: `translateY(${(1 - rise2) * 18}px)` }}>ما يبني عضل؟</div>
        </div>
      </div>

      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
    </AbsoluteFill>
  );
};
