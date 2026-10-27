import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, FONT} from '../brand';
import {easeInOut, lerp, ramp, rnd, useSec} from '../motion';
import {Headline, StudyLabel, Chip} from '../components/Text';
import {Moon, Shield} from '../components/Icons';

/** 14:12–21:36 — defence rings; as sleep hours drop, more particles get through. */
export const ImmuneScene: React.FC = () => {
  const t = useSec();
  const reveal = ramp(t, 0.1, 1.5);
  const drop = ramp(t, 2.4, 5.0, easeInOut); // sleep 8h -> 5h
  const integrity = lerp(1, 0.35, drop);
  const cx = 540;
  const cy = 820;
  const ringR = 210;
  const particles = Array.from({length: 22}, (_, i) => {
    const a = rnd(i * 3 + 11) * Math.PI * 2;
    const start = 0.6 + rnd(i * 5 + 2) * 6.0;
    const speed = 90 + rnd(i * 7 + 1) * 60;
    const dist = 560 - speed * (t - start);
    const thresh = rnd(i * 9 + 4); // passes if integrity < thresh
    const passes = integrity < thresh;
    if (t < start || dist < 30) return null;
    let op = 1;
    if (!passes && dist < ringR) op = Math.max(0, 1 - (ringR - dist) / 40); // blocked, dissolves at the ring
    if (dist < 80) op = Math.min(op, dist / 80);
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    return (
      <g key={i} transform={`translate(${x} ${y}) rotate(${t * 40 + i * 30})`} opacity={op * reveal}>
        <circle r={9} fill="none" stroke={passes ? BRAND.bad : 'rgba(255,255,255,.55)'} strokeWidth={2} />
        {[0, 60, 120, 180, 240, 300].map((d) => (
          <line key={d} x1={Math.cos((d * Math.PI) / 180) * 9} y1={Math.sin((d * Math.PI) / 180) * 9} x2={Math.cos((d * Math.PI) / 180) * 15} y2={Math.sin((d * Math.PI) / 180) * 15} stroke={passes ? BRAND.bad : 'rgba(255,255,255,.55)'} strokeWidth={2} strokeLinecap="round" />
        ))}
      </g>
    );
  });
  const hours = lerp(8, 5, drop);
  return (
    <AbsoluteFill>
      <Headline text="نومك مرتبط بصحة مناعتك" at={0.25} top={200} size={84} emph={['مناعتك']} />
      <StudyLabel text="PRATHER ET AL. — SLEEP, 2015" at={1.1} top={500} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {particles}
      </svg>
      <div style={{position: 'absolute', left: cx, top: cy, transform: 'translate(-50%,-50%)'}}>
        <Shield t={t} integrity={integrity} reveal={reveal} size={480} />
      </div>

      {/* sleep hours bar */}
      <div dir="rtl" style={{position: 'absolute', top: 1180, left: 120, width: 840, opacity: ramp(t, 1.8, 2.3)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONT.disp, fontSize: 44, fontWeight: 800, color: BRAND.strong}}>
          <span style={{display: 'flex', alignItems: 'center', gap: 14}}>
            <Moon size={40} /> ساعات نومك
          </span>
          <span dir="ltr" style={{fontFamily: FONT.data, fontSize: 40, color: drop > 0.5 ? BRAND.bad : BRAND.orange, letterSpacing: '.04em'}}>{hours.toFixed(1)} h</span>
        </div>
        <div style={{position: 'relative', height: 18, marginTop: 18, borderRadius: 9, background: 'rgba(255,255,255,.08)'}}>
          <div style={{position: 'absolute', top: 0, right: 0, height: '100%', width: `${(hours / 9) * 100}%`, borderRadius: 9, background: `linear-gradient(270deg, ${drop > 0.5 ? BRAND.bad : BRAND.orange}, rgba(255,84,32,.4))`, boxShadow: '0 0 18px rgba(255,84,32,.45)'}} />
          {[7, 9].map((h) => (
            <div key={h} style={{position: 'absolute', top: -8, bottom: -8, right: `${(h / 9) * 100}%`, width: 2, background: 'rgba(255,255,255,.35)'}} />
          ))}
          <div style={{position: 'absolute', top: 30, right: `${(7 / 9) * 100}%`, transform: 'translateX(50%)', fontFamily: FONT.ar, fontSize: 24, color: BRAND.muted}}>٧ س</div>
        </div>
      </div>
      <Chip text="قلة النوم ارتبطت باحتمال أعلى للإصابة بالزكام" at={5.2} accent style={{left: '50%', transform: 'translateX(-50%)', top: 1380}} />
    </AbsoluteFill>
  );
};
