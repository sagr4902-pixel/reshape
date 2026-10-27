import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, FONT} from '../brand';
import {easeInOut, lerp, ramp, rnd, useSec} from '../motion';
import {Headline, StudyLabel, Chip} from '../components/Text';
import {Brain} from '../components/Icons';

const AR_NUM = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

/** 05:12–14:12 — two weeks of 6-hour nights; attention performance drifts down. */
export const BrainScene: React.FC = () => {
  const t = useSec();
  const reveal = ramp(t, 0.1, 1.6);
  const progress = ramp(t, 2.0, 7.4, easeInOut); // 14-day timeline
  const energy = lerp(1, 0.3, progress);
  const day = Math.max(1, Math.min(14, Math.ceil(progress * 14)));
  const barX = 120;
  const barW = 840;
  // attention curve: downward drift with small noise, drawn progressively
  const pts = Array.from({length: 15}, (_, i) => {
    const p = i / 14;
    const y = 90 - p * 52 + (rnd(i * 5) - 0.5) * 8 * p;
    return [barX + barW - p * barW, y] as [number, number];
  });
  const visible = pts.filter((_, i) => i / 14 <= progress + 0.001);
  const path = visible.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  return (
    <AbsoluteFill>
      <Headline text="قلة النوم تؤثر على التركيز" at={0.25} top={200} size={84} emph={['التركيز']} />
      <StudyLabel text="VAN DONGEN ET AL. — SLEEP, 2003" at={1.1} top={500} />

      <div style={{position: 'absolute', left: 540, top: 870, transform: 'translate(-50%,-50%)'}}>
        <Brain t={t} energy={energy} size={740} reveal={reveal} />
      </div>

      {/* 14-day restriction timeline */}
      <div dir="rtl" style={{position: 'absolute', top: 1160, left: barX, width: barW, opacity: ramp(t, 1.6, 2.1)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: FONT.disp, color: BRAND.strong}}>
          <span style={{fontSize: 44, fontWeight: 800}}>
            <span style={{color: BRAND.orange}}>٦ ساعات</span> نوم · <span style={{color: BRAND.orange}}>١٤</span> يوم
          </span>
          <span style={{fontFamily: FONT.data, fontSize: 30, letterSpacing: '.1em', color: BRAND.muted}}>
            DAY {String(day).padStart(2, '0')}
          </span>
        </div>
        <div style={{position: 'relative', height: 18, marginTop: 18, borderRadius: 9, background: 'rgba(255,255,255,.08)', overflow: 'hidden'}}>
          <div style={{position: 'absolute', top: 0, right: 0, height: '100%', width: `${progress * 100}%`, borderRadius: 9, background: `linear-gradient(270deg, ${BRAND.orange}, rgba(255,84,32,.45))`, boxShadow: '0 0 18px rgba(255,84,32,.5)'}} />
          {Array.from({length: 13}, (_, i) => (
            <div key={i} style={{position: 'absolute', top: 0, bottom: 0, right: `${((i + 1) / 14) * 100}%`, width: 2, background: 'rgba(23,24,26,.8)'}} />
          ))}
        </div>
        {/* attention drift */}
        <div style={{position: 'relative', marginTop: 26, height: 120}}>
          <svg width={barW} height={120} viewBox={`${barX} 0 ${barW} 120`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <line x1={barX} x2={barX + barW} y1={90} y2={90} stroke="rgba(255,255,255,.12)" strokeDasharray="4 8" />
            <path d={path} fill="none" stroke={BRAND.warm} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            {visible.length > 0 && (
              <circle cx={visible[visible.length - 1][0]} cy={visible[visible.length - 1][1]} r={8} fill={BRAND.orange} style={{filter: 'drop-shadow(0 0 10px rgba(255,84,32,.9))'}} />
            )}
          </svg>
          <div style={{position: 'absolute', right: 0, top: -2, fontFamily: FONT.ar, fontSize: 28, fontWeight: 600, color: BRAND.muted}}>مستوى التركيز</div>
        </div>
      </div>
      <Chip text={`أداء الانتباه يتراجع تدريجيًا — حتى لو ما حسّيت`} at={6.2} accent style={{left: '50%', transform: 'translateX(-50%)', top: 1380}} />
      <div style={{position: 'absolute', top: 1150, right: 120, fontFamily: FONT.ar, fontSize: 22, color: BRAND.muted, opacity: 0}}>{AR_NUM(day)}</div>
    </AbsoluteFill>
  );
};
