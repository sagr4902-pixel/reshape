import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, FONT} from '../brand';
import {ramp, rnd, useSec} from '../motion';
import {Headline, StudyLabel, Chip} from '../components/Text';
import {Heart, Moon} from '../components/Icons';

/** 21:36–28:36 — sleep-habit nights linked (association) to the heart. */
export const HeartScene: React.FC = () => {
  const t = useSec();
  const reveal = ramp(t, 0.1, 1.4);
  // beats: strong ones match the SFX (local 0.4 and 2.7), plus a gentle continuous rhythm
  const beatAt = (b: number) => Math.max(0, 1 - Math.abs(t - b) / 0.22);
  const rhythm = Math.max(0, Math.sin(((t * 1.05) % 1) * Math.PI * 2)) ** 6 * 0.5;
  const beat = Math.max(beatAt(0.4), beatAt(2.7), rhythm) * reveal;
  const nights = Array.from({length: 7}, (_, i) => 4.5 + rnd(i * 4 + 8) * 4);
  const linkP = ramp(t, 2.2, 4.2);
  const ecgLen = 1200;
  const ecgP = ramp(t, 1.0, 5.4);
  return (
    <AbsoluteFill>
      <Headline text="صحة قلبك تتأثر بعادات نومك" at={0.25} top={200} size={84} emph={['قلبك']} />
      <StudyLabel text="CAPPUCCIO ET AL. — EUR HEART J, 2011" at={1.1} top={500} />

      {/* nights column (right side in RTL) */}
      <div dir="rtl" style={{position: 'absolute', top: 600, right: 110, width: 300, opacity: ramp(t, 1.0, 1.6)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.disp, fontSize: 40, fontWeight: 800, color: BRAND.strong}}>
          <Moon size={34} /> عادات النوم
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 22}}>
          {nights.map((h, i) => {
            const p = ramp(t, 1.3 + i * 0.12, 1.9 + i * 0.12);
            const short = h < 6;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <span style={{fontFamily: FONT.data, fontSize: 24, color: BRAND.muted, width: 64}}>N{i + 1}</span>
                <div style={{height: 16, width: `${(h / 9) * 220 * p}px`, borderRadius: 8, background: short ? BRAND.orange : 'rgba(255,255,255,.28)', boxShadow: short ? '0 0 14px rgba(255,84,32,.5)' : 'none'}} />
              </div>
            );
          })}
        </div>
      </div>

      {/* association links */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {nights.map((h, i) => {
          const y = 690 + i * 34;
          const short = h < 6;
          const d = `M${970 - (h / 9) * 220 - 76} ${y} C ${600} ${y}, ${560} ${880}, ${470} ${900}`;
          return <path key={i} d={d} fill="none" stroke={short ? 'rgba(255,84,32,.55)' : 'rgba(255,255,255,.14)'} strokeWidth={short ? 2.5 : 1.5} pathLength={1} strokeDasharray={`${linkP} 1`} style={{opacity: linkP}} />;
        })}
        {/* ECG */}
        <path
          d="M80 1110 H300 L330 1110 L350 1060 L372 1170 L392 1080 L410 1110 H640 L660 1110 L680 1070 L700 1160 L718 1088 L735 1110 H1000"
          fill="none"
          stroke={BRAND.orange}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeDasharray={ecgLen}
          strokeDashoffset={ecgLen * (1 - ecgP)}
          opacity={0.75}
          style={{filter: 'drop-shadow(0 0 8px rgba(255,84,32,.6))'}}
        />
      </svg>

      <div style={{position: 'absolute', left: 300, top: 880, transform: 'translate(-50%,-50%)'}}>
        <Heart beat={beat} reveal={reveal} size={420} />
      </div>
      <div dir="rtl" style={{position: 'absolute', left: 300, top: 1150, transform: 'translateX(-50%)', fontFamily: FONT.disp, fontSize: 40, fontWeight: 800, color: BRAND.strong, opacity: ramp(t, 1.4, 2)}}>
        صحة القلب
      </div>
      <Chip text="ارتباط في دراسات رصدية — مو إثبات سبب مباشر" at={4.6} style={{left: '50%', transform: 'translateX(-50%)', top: 1250}} />
      <Chip text="قلة النوم ارتبطت بخطر أعلى لأمراض القلب التاجية" at={5.4} accent style={{left: '50%', transform: 'translateX(-50%)', top: 1340}} />
    </AbsoluteFill>
  );
};
