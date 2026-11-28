import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain } from "../components/Finish";
import { LogoLockup } from "../components/Logo";
import { FONTS } from "../lib/brand";
import { loadBrandFonts } from "../lib/fonts";
import { Athlete, climb, lerpPose, P, Pose, squat } from "../motion/Athlete";
import { MCOLORS, SLANT } from "../motion/design";
import { DrawPath, Glow, Grid, Ring, prog } from "../motion/kit";
import data from "./timeline.json";

loadBrandFonts();

// reshape-online.com ad v2 — 19.5 s, 1080x1920, 30 fps. One idea: "the best version of your body" and
// the four things RESHAPE gives you to get there. One layout for every step (logo, step marker, two-line
// headline, one visual), calm eased motion, voice + soft SFX only (no music).
const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
type SceneId = "hook" | "level" | "video" | "nutrition" | "coach" | "cta";
const HT = data as { durationSeconds: number; scenes: { id: SceneId; start: number; end: number }[]; phrases: { text: string; start: number; end: number }[] };
export const HYPE_DURATION = f(HT.durationSeconds);
const sc = (id: SceneId) => HT.scenes.find((s) => s.id === id)!;
const len = (id: SceneId) => f(sc(id).end) - f(sc(id).start);
/** Scene-relative frame at which phrase `i` starts. */
const ph = (id: SceneId, i: number) => f(HT.phrases[i].start) - f(sc(id).start);

const txt = (size: number, color: string = MCOLORS.white, weight = 900): React.CSSProperties => ({
  fontFamily: FONTS.display, fontWeight: weight, fontSize: size, color, direction: "rtl", textAlign: "center", lineHeight: 1.15, whiteSpace: "nowrap",
});
const soft = { damping: 20, stiffness: 150, mass: 0.9 };

/** A line of copy that rises into place behind a mask (one move, no bounce). */
const Rise: React.FC<{ at: number; y: number; children: React.ReactNode; style: React.CSSProperties }> = ({ at, y, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: soft });
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, overflow: "hidden", padding: "14px 0" }}>
      <div style={{ ...style, transform: `translateY(${(1 - s) * 110}%)`, opacity: Math.min(1, s * 1.5) }}>{children}</div>
    </div>
  );
};

/** Scene wrapper: content clears just before the next step. */
const Step: React.FC<{ id: SceneId; children: React.ReactNode }> = ({ id, children }) => {
  const frame = useCurrentFrame();
  const out = prog(frame, len(id) - 6, len(id), Easing.in(Easing.cubic));
  return <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${out * -50}px)` }}>{children}</AbsoluteFill>;
};

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute" }}>{children}</svg>;

/** The fixed frame of every step: logo on top, 4-part step marker, two-line headline. */
const STEPS: SceneId[] = ["level", "video", "nutrition", "coach"];
const Marker: React.FC<{ id: SceneId; at?: number }> = ({ id, at = 0 }) => {
  const frame = useCurrentFrame();
  const n = STEPS.indexOf(id);
  return (
    <div style={{ position: "absolute", top: 372, left: 0, right: 0, display: "flex", flexDirection: "row-reverse", justifyContent: "center", gap: 14, opacity: prog(frame, at, at + 8) }}>
      {STEPS.map((_, i) => (
        <div key={i} style={{ width: 120, height: 12, transform: `skewX(${SLANT}deg)`, background: "rgba(255,255,255,0.16)" }}>
          <div style={{ height: "100%", background: MCOLORS.orange, width: `${(i < n ? 1 : i === n ? prog(frame, at + 2, at + 14) : 0) * 100}%`, marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  );
};
const TopLogo: React.FC = () => (
  <div style={{ position: "absolute", top: 262, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
    <LogoLockup width={300} wordColor={MCOLORS.white} />
  </div>
);
const Head: React.FC<{ a: string; b: string; at: number; at2?: number }> = ({ a, b, at, at2 }) => (
  <>
    <Rise at={at} y={430} style={txt(112)}>{a}</Rise>
    <Rise at={at2 ?? at + 5} y={570} style={txt(112, MCOLORS.orange)}>{b}</Rise>
  </>
);
const Card: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: soft });
  return (
    <div style={{ position: "absolute", left: 190, top: 800, width: 700, height: 700, borderRadius: 54, background: MCOLORS.panel, border: "3px solid rgba(255,255,255,0.14)", boxShadow: "0 40px 120px rgba(0,0,0,0.6)", overflow: "hidden", transform: `translateY(${(1 - s) * 160}px) scale(${0.92 + 0.08 * s})`, opacity: Math.min(1, s * 1.4) }}>
      {children}
    </div>
  );
};

// ------------------------------------------------------------------ hook: the title
const SLOUCH: Pose = { torso: 16, head: 14, armN: [10, 16], armF: [4, 10], legN: [4, -2], legF: [-4, -6] };
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ph("hook", 0);
  const rise = prog(frame, a + 26, a + 52, Easing.inOut(Easing.cubic));
  return (
    <Step id="hook">
      <Glow x={540} y={1150} r={380 + 300 * rise} opacity={0.12 + 0.3 * rise} />
      <Svg>
        <line x1={240} x2={840} y1={1500} y2={1500} stroke="rgba(255,255,255,0.3)" strokeWidth={4} />
        <Athlete pose={lerpPose(SLOUCH, P.victory, rise)} x={540} y={1500} scale={1.95} rim={10 * rise} color={rise > 0.5 ? MCOLORS.white : "#B9BABE"} />
        <Ring x={540} y={1150} at={a + 46} r0={120} r1={720} dur={24} width={7} />
      </Svg>
      <Rise at={a} y={330} style={txt(128)}>ودّك توصل</Rise>
      <Rise at={a + 14} y={480} style={txt(98, MCOLORS.orange)}>لأفضل نسخة من جسمك؟</Rise>
    </Step>
  );
};

// ------------------------------------------------------------------ 1. a program at your level
const Level: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ph("level", 1), b = ph("level", 2);
  const inS = spring({ frame: frame - a, fps, config: soft });
  const up = spring({ frame: frame - (b - 8), fps, config: soft });
  const levels = ["مبتدئ", "متوسط", "متقدم"];
  const pick = Math.min(2, Math.floor(prog(frame, b + 14, b + 44, Easing.linear) * 2.999));
  return (
    <Step id="level">
      <Glow x={540} y={640 - 300 * up} r={520} opacity={0.3 * inS * (1 - up * 0.6)} />
      {/* the logo lands in the centre, then becomes the fixed header of every step */}
      <div style={{ position: "absolute", top: 640 - 378 * up, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, inS * 1.6), transform: `scale(${(1.25 - 0.25 * inS) * (1 - 0.6 * up)})`, transformOrigin: "50% 0" }}>
        <LogoLockup width={750} wordColor={MCOLORS.white} wordReveal={prog(frame, a + 2, a + 16)} />
      </div>
      <Marker id="level" at={b - 2} />
      <Head a="برنامجك مبني" b="على مستواك" at={b} />
      <div style={{ position: "absolute", top: 860, left: 190, width: 700, display: "flex", flexDirection: "column-reverse", gap: 26 }}>
        {levels.map((l, i) => {
          const s = spring({ frame: frame - (b + 8 + i * 4), fps, config: soft });
          const on = frame >= b + 14 && pick === i;
          return (
            <div key={l} style={{ height: 150, borderRadius: 30, background: on ? MCOLORS.orange : MCOLORS.panel, border: `3px solid ${on ? MCOLORS.orange : "rgba(255,255,255,0.14)"}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: s, transform: `translateY(${(1 - s) * 60}px) scale(${on ? 1.04 : 1})`, width: "100%" }}>
              <div style={txt(76, on ? MCOLORS.black : MCOLORS.white, 800)}>{l}</div>
            </div>
          );
        })}
      </div>
    </Step>
  );
};

// ------------------------------------------------------------------ 2. every exercise on video
const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ph("video", 3);
  return (
    <Step id="video">
      <TopLogo />
      <Marker id="video" />
      <Head a="كل تمرين" b="بفيديو" at={a} />
      <Card at={a + 4}>
        <svg width={700} height={700}>
          <rect width={700} height={540} fill={MCOLORS.ink} />
          <line x1={0} x2={700} y1={480} y2={480} stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
          <Athlete pose={squat((frame / 30) % 1)} x={230} y={480} scale={1.3} bg={MCOLORS.ink} rim={4} />
          <circle cx={520} cy={270} r={74} fill={MCOLORS.orange} />
          <path d="M500,232 L500,308 L562,270 Z" fill={MCOLORS.white} />
          <rect x={50} y={600} width={600} height={14} rx={7} fill="rgba(255,255,255,0.14)" />
          <rect x={50} y={600} width={600 * prog(frame, a, len("video"), Easing.linear)} height={14} rx={7} fill={MCOLORS.orange} />
        </svg>
      </Card>
    </Step>
  );
};

// ------------------------------------------------------------------ 3. nutrition worked out to the calorie
const Nutrition: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ph("nutrition", 4);
  const p = prog(frame, a + 8, a + 40);
  const macros: [string, number, string][] = [["بروتين", 0.82, MCOLORS.orange], ["كارب", 0.66, MCOLORS.white], ["دهون", 0.4, MCOLORS.orangeHi]];
  return (
    <Step id="nutrition">
      <TopLogo />
      <Marker id="nutrition" />
      <Head a="تغذيتك محسوبة" b="بالسعرة" at={a} at2={a + 30} />
      <Card at={a + 4}>
        <svg width={700} height={700}>
          <circle cx={350} cy={210} r={136} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={28} />
          <circle cx={350} cy={210} r={136} fill="none" stroke={MCOLORS.orange} strokeWidth={28} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 136 * p * 0.86} 2000`} transform="rotate(-90 350 210)" />
          {macros.map(([, v, col], i) => (
            <g key={i}>
              <rect x={60} y={452 + i * 84} width={400} height={22} rx={11} fill="rgba(255,255,255,0.12)" />
              <rect x={60 + 400 * (1 - v * p)} y={452 + i * 84} width={400 * v * p} height={22} rx={11} fill={col} />
            </g>
          ))}
        </svg>
        <div style={{ position: "absolute", top: 146, left: 0, right: 0, textAlign: "center", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 96, color: MCOLORS.white }}>{Math.round((p * 2500) / 50) * 50}</div>
        <div style={{ position: "absolute", top: 256, left: 0, right: 0, ...txt(38, MCOLORS.mute, 700) }}>سعرة</div>
        {macros.map(([n], i) => <div key={n} style={{ position: "absolute", top: 426 + i * 84, right: 56, ...txt(46, MCOLORS.white, 800), textAlign: "right" }}>{n}</div>)}
      </Card>
    </Step>
  );
};

// ------------------------------------------------------------------ 4. the coach follows you step by step
const Coach: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ph("coach", 5), b = ph("coach", 6);
  const steps = 5, sx = 150, sy = 84, x0 = 930, y0 = 1440;
  const stair = Array.from({ length: steps }, (_, i) => `L${x0 - (i + 1) * sx},${y0 - i * sy} L${x0 - (i + 1) * sx},${y0 - (i + 1) * sy}`).join(" ");
  const t = prog(frame, b, b + 50, Easing.inOut(Easing.quad)) * (steps - 0.4);
  const k = Math.floor(t), fr = t - k;
  return (
    <Step id="coach">
      <TopLogo />
      <Marker id="coach" />
      <Head a="وأنا معك" b="أتابعك خطوة بخطوة" at={a} at2={b} />
      <Svg>
        <DrawPath d={`M${x0 + 60},${y0} L${x0},${y0} ${stair} L90,${y0 - steps * sy}`} at={a + 6} dur={30} width={8} stroke={MCOLORS.white} cap="butt" />
        {Array.from({ length: steps }, (_, i) => <circle key={i} cx={x0 - (i + 0.5) * sx} cy={y0 - i * sy - 24} r={k > i ? 14 : 0} fill={MCOLORS.orange} />)}
        <Athlete pose={frame < b ? P.stand : climb((frame / 16) % 1)} x={x0 - 40 - (k + fr) * sx} y={y0 - Math.min(steps, k + (fr > 0.5 ? 1 : 0)) * sy} scale={0.95} flip rim={4} opacity={prog(frame, a + 10, a + 18)} />
      </Svg>
      <div style={{ position: "absolute", top: 1490, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: prog(frame, a + 10, a + 20) }}>
        <div style={{ background: MCOLORS.orange, transform: `skewX(${SLANT}deg)`, padding: "8px 40px" }}>
          <div style={{ ...txt(50, MCOLORS.black, 800), transform: `skewX(${-SLANT}deg)` }}>الكابتن محمد الصقر</div>
        </div>
      </div>
    </Step>
  );
};

// ------------------------------------------------------------------ CTA
const URL = "reshape-online.com";
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ph("cta", 7), b = ph("cta", 8), c = ph("cta", 9);
  const hit = c + 46;
  const out = prog(frame, b - 6, b - 1, Easing.in(Easing.cubic));
  const typed = Math.round(prog(frame, c, c + 34, Easing.linear) * URL.length);
  const pill = spring({ frame: frame - (c - 6), fps, config: soft });
  const logo = spring({ frame: frame - hit, fps, config: soft });
  const now = spring({ frame: frame - b, fps, config: { damping: 15, stiffness: 190, mass: 0.8 } });
  return (
    <AbsoluteFill>
      <Glow x={540} y={760} r={680} opacity={0.3 * prog(frame, b, b + 12)} />
      <Svg><Ring x={540} y={600} at={b} r0={100} r1={820} dur={24} width={8} /></Svg>
      <div style={{ opacity: 1 - out }}><Rise at={a} y={470} style={txt(140)}>لا تأجّل…</Rise></div>
      {frame >= b ? (
        <div style={{ position: "absolute", top: 470, left: 0, right: 0, ...txt(176, MCOLORS.orange), opacity: Math.min(1, now * 1.5), transform: `scale(${1.5 - 0.5 * now})` }}>سجّل الحين!</div>
      ) : null}
      <div style={{ position: "absolute", top: 860, left: 90, right: 90, height: 150, borderRadius: 75, background: MCOLORS.white, opacity: Math.min(1, pill * 1.5), transform: `translateY(${(1 - pill) * 60}px)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 70px rgba(255,84,32,0.5)" }}>
        <div style={{ fontFamily: FONTS.latin, fontWeight: 700, fontSize: 82, color: MCOLORS.black, direction: "ltr" }}>
          {URL.slice(0, typed)}
          <span style={{ color: MCOLORS.orange, opacity: typed < URL.length || Math.floor(frame / 9) % 2 ? 1 : 0 }}>|</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1170, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, logo * 1.6), transform: `scale(${1.2 - 0.2 * logo})` }}>
        <LogoLockup width={620} wordColor={MCOLORS.white} wordReveal={prog(frame, hit + 2, hit + 16)} />
      </div>
      <div style={{ position: "absolute", top: 1430, left: 0, right: 0, ...txt(50, MCOLORS.warm, 700), opacity: prog(frame, hit + 12, hit + 24) }}>أفضل نسخة منك تبدأ اليوم</div>
    </AbsoluteFill>
  );
};

const SCENES: { id: SceneId; C: React.FC }[] = [
  { id: "hook", C: Hook }, { id: "level", C: Level }, { id: "video", C: Video }, { id: "nutrition", C: Nutrition }, { id: "coach", C: Coach }, { id: "cta", C: Cta },
];

export const Hype: React.FC = () => (
  <AbsoluteFill style={{ background: MCOLORS.black }}>
    <Grid speed={0.5} opacity={0.8} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
    {SCENES.map(({ id, C }) => (
      <Sequence key={id} name={id} from={f(sc(id).start)} durationInFrames={len(id)}>
        <C />
      </Sequence>
    ))}
    <Grain opacity={0.03} />
    <Audio src={staticFile("audio/hype/mix.wav")} />
  </AbsoluteFill>
);
