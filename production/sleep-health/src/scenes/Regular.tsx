import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, FONT} from '../brand';
import {easeInOut, lerp, ramp, rnd, useSec} from '../motion';
import {Headline, StudyLabel, Chip} from '../components/Text';
import {Moon} from '../components/Icons';

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** 28:36–33:36 — scattered bedtimes snap into a steady rhythm. */
export const RegularScene: React.FC = () => {
  const t = useSec();
  const show = ramp(t, 0.3, 1.0);
  const snap = ramp(t, 1.7, 3.3, easeInOut);
  const top0 = 640;
  const gridH = 560; // 20:00 -> 10:00 (14h)
  const colW = 104;
  const gap = 18;
  const x0 = 540 - (7 * colW + 6 * gap) / 2;
  const hourPx = gridH / 14;
  return (
    <AbsoluteFill>
      <Headline text="الانتظام مهم بعد" at={0.25} top={200} size={92} emph={['الانتظام']} />
      <StudyLabel text="WINDRED ET AL. — SLEEP, 2024" at={1.0} top={500} />

      <div style={{position: 'absolute', top: top0, left: x0, width: 7 * colW + 6 * gap, height: gridH, opacity: show}}>
        {/* hour guides */}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((h) => (
          <div key={h} style={{position: 'absolute', top: h * hourPx, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,.07)'}} />
        ))}
        {/* aligned guide lines (appear when snapped) */}
        {[3, 11].map((h, i) => (
          <div key={i} style={{position: 'absolute', top: h * hourPx, left: -30, right: -30, height: 2, background: BRAND.orange, opacity: snap * 0.7, boxShadow: '0 0 12px rgba(255,84,32,.6)'}} />
        ))}
        {DAYS.map((d, i) => {
          // RTL: Sunday on the right
          const col = 6 - i;
          const left = col * (colW + gap);
          const messyTop = 3 + (rnd(i * 6 + 1) - 0.5) * 5; // hours after 20:00
          const messyLen = 5 + rnd(i * 6 + 2) * 4;
          const topH = lerp(messyTop, 3, snap);
          const lenH = lerp(messyLen, 8, snap);
          const outlier = messyLen < 6 || Math.abs(messyTop - 3) > 1.6;
          return (
            <div key={i} style={{position: 'absolute', left, top: 0, width: colW, height: gridH}}>
              <div style={{position: 'absolute', inset: 0, borderRadius: 18, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)'}} />
              <div
                style={{
                  position: 'absolute',
                  left: 10,
                  right: 10,
                  top: topH * hourPx,
                  height: lenH * hourPx,
                  borderRadius: 14,
                  background: `linear-gradient(180deg, rgba(255,84,32,${lerp(outlier ? 0.28 : 0.14, 0.42, snap)}), rgba(255,84,32,${lerp(0.06, 0.16, snap)}))`,
                  border: `1px solid rgba(255,84,32,${lerp(outlier ? 0.5 : 0.25, 0.8, snap)})`,
                  boxShadow: `0 0 ${18 * snap}px rgba(255,84,32,${0.35 * snap})`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: 12,
                  transition: 'none',
                }}
              >
                <Moon size={26} color={`rgba(255,120,70,${0.6 + 0.4 * snap})`} />
              </div>
              <div dir="rtl" style={{position: 'absolute', top: gridH + 16, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.ar, fontSize: 22, fontWeight: 600, color: BRAND.muted}}>
                {d}
              </div>
            </div>
          );
        })}
        {/* axis labels */}
        <div dir="rtl" style={{position: 'absolute', right: -112, top: 3 * hourPx - 18, fontFamily: FONT.ar, fontSize: 24, color: BRAND.orange, opacity: snap}}>نوم</div>
        <div dir="rtl" style={{position: 'absolute', right: -112, top: 11 * hourPx - 18, fontFamily: FONT.ar, fontSize: 24, color: BRAND.orange, opacity: snap}}>صحو</div>
      </div>
      <Chip text="نفس وقت النوم والصحو — كل يوم" at={3.2} accent style={{left: '50%', transform: 'translateX(-50%)', top: 1300}} />
      <Chip text="دراسة متابعة على ~٦١ ألف شخص" at={3.8} style={{left: '50%', transform: 'translateX(-50%)', top: 1380}} />
    </AbsoluteFill>
  );
};
