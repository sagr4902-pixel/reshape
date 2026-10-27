import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, FONT} from '../brand';
import {easeSpring, ramp, useSec} from '../motion';
import {Eyebrow, Headline} from '../components/Text';
import {ClockIcon, Cup, Repeat} from '../components/Icons';

const CARDS = [
  {at: 2.6, title: '٧–٩ ساعات للبالغين', sub: 'الاحتياج يختلف من شخص لآخر', Icon: ClockIcon},
  {at: 4.8, title: 'ثبّت وقت نومك وصحوتك', sub: 'نفس الوقت كل يوم — حتى بالإجازة', Icon: Repeat},
  {at: 6.8, title: 'خفّف الكافيين بالمساء', sub: 'آخر فنجان قبل النوم بساعات', Icon: Cup},
];

/** 33:36–42:48 — three practical recommendations (AASM/SRS, AHA, CDC). */
export const AdviceScene: React.FC = () => {
  const t = useSec();
  return (
    <AbsoluteFill>
      <Eyebrow text="Practical advice" at={0.3} top={236} />
      <Headline text="خطوات بسيطة لنوم أفضل" at={0.4} top={290} size={84} emph={['أفضل']} />
      {CARDS.map(({at, title, sub, Icon}, i) => {
        const p = ramp(t, at, at + 0.7, easeSpring);
        const op = ramp(t, at, at + 0.35);
        const iconP = ramp(t, at + 0.3, at + 1.3);
        return (
          <div
            key={i}
            dir="rtl"
            style={{
              position: 'absolute',
              top: 560 + i * 262,
              left: 100,
              width: 880,
              height: 218,
              borderRadius: 30,
              border: '1px solid rgba(255,255,255,.14)',
              background: 'linear-gradient(160deg, rgba(255,255,255,.12), rgba(255,255,255,.035))',
              boxShadow: '0 8px 32px rgba(0,0,0,.28)',
              display: 'flex',
              alignItems: 'center',
              gap: 30,
              padding: '0 34px',
              opacity: op,
              transform: `translateY(${(1 - p) * 60}px) scale(${0.94 + 0.06 * p})`,
            }}
          >
            <div style={{width: 124, height: 124, borderRadius: 62, background: BRAND.orangeDim, border: '1px solid rgba(255,84,32,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <Icon size={78} p={iconP} />
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0}}>
              <div style={{fontFamily: FONT.disp, fontSize: 60, fontWeight: 800, color: BRAND.strong, lineHeight: 1.15}}>{title}</div>
              <div style={{fontFamily: FONT.ar, fontSize: 28, fontWeight: 500, color: BRAND.warm, opacity: 0.85}}>{sub}</div>
            </div>
            <div style={{position: 'absolute', left: 30, top: 24, fontFamily: FONT.data, fontSize: 28, color: BRAND.orange, letterSpacing: '.2em'}}>0{i + 1}</div>
          </div>
        );
      })}
      <div dir="ltr" style={{position: 'absolute', top: 1385, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.data, fontSize: 24, letterSpacing: '.22em', color: BRAND.muted, opacity: ramp(t, 7.6, 8.2)}}>
        AASM & SRS 2015 · AHA · CDC
      </div>
    </AbsoluteFill>
  );
};
