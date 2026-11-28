import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Flash, Grain, useShake } from "../components/Finish";
import { LogoLockup } from "../components/Logo";
import { FONTS } from "../lib/brand";
import { loadBrandFonts } from "../lib/fonts";
import { Athlete, climb, run, squat, lerpPose, Pose } from "../motion/Athlete";
import { MCOLORS, SLANT } from "../motion/design";
import { Chevrons, DrawPath, Glow, Grid, LayeredWord, Particles, PerspectiveFloor, ProgressBar, Ring, SlantBar, SlantWipe, clamp, prog } from "../motion/kit";
import data from "./timeline.json";

loadBrandFonts();

// reshape-online.com hype ad — 27 s, 1080x1920, 30 fps. Built from the motion kit; every beat is
// keyed to the coach's spoken phrases (timeline.json, written by scripts/build_hype_audio.py).
const FPS = 30;
const f = (s: number) => Math.round(s * FPS);
type SceneId = "hook" | "problem" | "brand" | "features" | "coach" | "skills" | "cta";
const HT = data as { durationSeconds: number; beat: number; scenes: { id: SceneId; start: number; end: number }[]; phrases: { text: string; start: number; end: number }[] };
export const HYPE_DURATION = f(HT.durationSeconds);
const sc = (id: SceneId) => HT.scenes.find((s) => s.id === id)!;
/** Scene-relative frame at which phrase `i` (global index) starts. */
const ph = (id: SceneId, i: number) => f(HT.phrases[i].start) - f(sc(id).start);

const txt = (size: number, color: string = MCOLORS.white, weight = 900): React.CSSProperties => ({
  fontFamily: FONTS.display, fontWeight: weight, fontSize: size, color, direction: "rtl", textAlign: "center", lineHeight: 1.12, whiteSpace: "nowrap",
});

/** A word that slams in: overshoot scale + quick fade, optional exit. */
const Slam: React.FC<{ at: number; out?: number; y: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({ at, out, y, children, style, from = 1.7 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 240, mass: 0.7 } });
  const o = out === undefined ? 1 : 1 - prog(frame, out, out + 6, Easing.in(Easing.cubic));
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, opacity: Math.min(1, s * 1.6) * o, transform: `scale(${from + (1 - from) * s}) translateY(${(1 - o) * -40}px)`, ...style }}>
      {children}
    </div>
  );
};

const Line: React.FC<{ text: string; at: number; out?: number; y: number; size: number; color?: string; echo?: string }> = ({ text, at, out, y, size, color, echo }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y }}>
    <LayeredWord text={text} at={at} out={out} size={size} color={color} echo={echo} />
  </div>
);

const Shake: React.FC<{ at: number; amount?: number; children: React.ReactNode }> = ({ at, amount = 30, children }) => {
  const s = useShake(at, amount, 7);
  return <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)` }}>{children}</AbsoluteFill>;
};

const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", ...style }}>{children}</svg>
);

// ------------------------------------------------------------------ 1. hook
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const p2 = ph("hook", 1);
  const year = 2021 + Math.min(5, Math.floor(prog(frame, 6, p2 - 4, Easing.linear) * 5.999));
  const stuck = 0.22 + (frame >= p2 ? (random(`st${frame}`) - 0.5) * 0.03 : Math.sin(frame / 3) * 0.012);
  return (
    <Shake at={p2} amount={26}>
      <Svg>
        <PerspectiveFloor horizon={1180} scroll={frame * 0.12} opacity={0.9} />
        <Athlete pose={run((frame / 22) % 1)} x={540} y={1400} scale={2.1} rim={6} />
        <ProgressBar x={170} y={1500} w={740} value={stuck} h={18} />
        <Ring x={540} y={1100} at={p2} r0={80} r1={700} dur={18} width={8} color={MCOLORS.white} />
      </Svg>
      <div style={{ position: "absolute", top: 262, left: 0, right: 0, textAlign: "center", fontFamily: FONTS.latin, fontStyle: "italic", fontWeight: 800, fontSize: 64, letterSpacing: "0.12em", color: MCOLORS.orange, opacity: prog(frame, 4, 12) }}>
        {year}
      </div>
      <Line text="تتمرن من سنين…" at={ph("hook", 0)} y={350} size={128} />
      <Slam at={p2} y={520}><div style={txt(124, MCOLORS.orange)}>ومكانك ما تغيّر؟!</div></Slam>
      <div style={{ position: "absolute", top: 1436, right: 170, ...txt(40, MCOLORS.mute, 700), opacity: prog(frame, 8, 16) }}>تطوّرك</div>
      <Flash at={p2} peak={0.5} />
    </Shake>
  );
};

// ------------------------------------------------------------------ 2. problem
const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ph("problem", 2), b = ph("problem", 3), c = ph("problem", 4);
  const scribble = (i: number) => {
    let d = `M${80 + random(`sx${i}`) * 920},${760 + random(`sy${i}`) * 700}`;
    for (let k = 0; k < 6; k++) d += ` L${60 + random(`x${i}-${k}`) * 960},${700 + random(`y${i}-${k}`) * 820}`;
    return d;
  };
  return (
    <Shake at={c} amount={38}>
      <Svg style={{ opacity: 1 - prog(frame, c - 2, c + 4) }}>
        {[0, 1, 2, 3, 4].map((i) => <DrawPath key={i} d={scribble(i)} at={a + 4 + i * 5} dur={26} width={i % 2 ? 5 : 3} stroke={i % 2 ? "rgba(255,255,255,0.28)" : "rgba(255,84,32,0.5)"} />)}
      </Svg>
      <Line text="المشكلة مو فيك…" at={a} out={c - 3} y={380} size={122} />
      <Line text="المشكلة إنك" at={b} out={c - 3} y={560} size={96} color={MCOLORS.mute} echo={MCOLORS.white} />
      {frame >= c ? <Glow x={540} y={900} r={620} opacity={0.38} /> : null}
      <SlantBar x={90} y={1030} w={900} h={26} inAt={c + 2} dur={8} />
      <Slam at={c} y={560}><div style={txt(118)}>تتمرن</div></Slam>
      <Slam at={c + 5} y={720} from={2.2}><div style={txt(190, MCOLORS.orange)}>بدون خطة!</div></Slam>
      <Svg><Ring x={540} y={860} at={c + 5} r0={90} r1={820} dur={20} width={10} /></Svg>
      <Flash at={c + 5} peak={0.7} />
    </Shake>
  );
};

// ------------------------------------------------------------------ 3. brand + level
const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = ph("brand", 6);
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 200, mass: 0.8 } });
  const levels = ["مبتدئ", "متوسط", "متقدم"];
  const lock = b + 38;
  const active = frame < b + 8 ? -1 : frame < lock ? Math.floor((frame - b - 8) / 5) % 3 : 3;
  return (
    <AbsoluteFill>
      <Glow x={540} y={520} r={560} opacity={0.32 * s} />
      <Svg>
        <Ring x={540} y={520} at={0} r0={100} r1={760} dur={22} width={9} />
        <Chevrons x={130} y={1560} opacity={prog(frame, b, b + 10) * 0.8} />
        <Chevrons x={950} y={1560} opacity={prog(frame, b, b + 10) * 0.8} speed={2.8} />
      </Svg>
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${1.5 - 0.5 * s})`, opacity: Math.min(1, s * 2) }}>
        <LogoLockup width={720} wordColor={MCOLORS.white} wordReveal={prog(frame, 3, 16)} />
      </div>
      <Line text="برنامجك" at={b} y={770} size={132} />
      <Line text="مبني على مستواك!" at={b + 8} y={930} size={118} color={MCOLORS.orange} echo={MCOLORS.white} />
      <div style={{ position: "absolute", top: 1180, left: 90, right: 90, display: "flex", flexDirection: "row-reverse", gap: 22, justifyContent: "center" }}>
        {levels.map((l, i) => {
          const on = active === i || active === 3;
          const inP = spring({ frame: frame - (b + 6 + i * 4), fps, config: { damping: 15, stiffness: 220 } });
          return (
            <div key={l} style={{ transform: `skewX(${SLANT}deg) translateY(${(1 - inP) * 80}px) scale(${on ? 1.06 : 1})`, opacity: inP, background: on ? MCOLORS.orange : MCOLORS.panel, border: `3px solid ${on ? MCOLORS.orange : "rgba(255,255,255,0.18)"}`, padding: "22px 44px" }}>
              <div style={{ ...txt(62, on ? MCOLORS.black : MCOLORS.white, 800), transform: `skewX(${-SLANT}deg)` }}>{l}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1370, left: 0, right: 0, ...txt(48, MCOLORS.mute, 700), opacity: prog(frame, lock, lock + 8) }}>أي مستوى… نبدأ من مكانك</div>
      <Flash at={0} peak={0.8} />
      <Flash at={lock} peak={0.35} color={MCOLORS.orange} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4. features: video + nutrition
const Card: React.FC<{ children: React.ReactNode; x: number; rot?: number; opacity?: number }> = ({ children, x, rot = 0, opacity = 1 }) => (
  <div style={{ position: "absolute", left: 190 + x, top: 640, width: 700, height: 820, borderRadius: 54, background: MCOLORS.panel, border: "3px solid rgba(255,255,255,0.14)", boxShadow: "0 40px 120px rgba(0,0,0,0.6)", overflow: "hidden", transform: `rotate(${rot}deg)`, opacity }}>
    {children}
  </div>
);
const Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ph("features", 7), b = ph("features", 8);
  const inA = spring({ frame: frame - a, fps, config: { damping: 16, stiffness: 180 } });
  const sw = spring({ frame: frame - (b - 4), fps, config: { damping: 17, stiffness: 170 } });
  const kcal = Math.round(prog(frame, b, b + 26) * 2500 / 50) * 50;
  const ring = prog(frame, b, b + 26);
  const macros: [string, number, string][] = [["بروتين", 0.82, MCOLORS.orange], ["كارب", 0.66, MCOLORS.white], ["دهون", 0.4, MCOLORS.orangeHi]];
  return (
    <AbsoluteFill>
      <Glow x={540} y={1050} r={640} opacity={0.26} />
      <Line text="كل تمرين بفيديو" at={a} out={b - 5} y={330} size={120} />
      <Line text="وتغذيتك محسوبة لك" at={b} y={290} size={104} />
      <Slam at={b + 12} y={440}><div style={txt(132, MCOLORS.orange)}>بالسعرة!</div></Slam>
      {/* video card */}
      <Card x={(1 - inA) * 900 - sw * 1000} rot={(1 - inA) * 8 - sw * 10}>
        <svg width={700} height={820}>
          <rect width={700} height={560} fill={MCOLORS.ink} />
          <line x1={0} x2={700} y1={500} y2={500} stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
          <Athlete pose={squat((frame / 26) % 1)} x={350} y={500} scale={1.35} bg={MCOLORS.ink} rim={4} />
          <circle cx={350} cy={280} r={86} fill="rgba(255,84,32,0.92)" transform={`scale(${1 + 0.05 * Math.sin(frame / 3)})`} style={{ transformOrigin: "350px 280px" }} />
          <path d="M326,236 L326,324 L398,280 Z" fill={MCOLORS.white} />
          <rect x={50} y={610} width={600} height={12} rx={6} fill="rgba(255,255,255,0.14)" />
          <rect x={50} y={610} width={600 * prog(frame, a, b + 10, Easing.linear)} height={12} rx={6} fill={MCOLORS.orange} />
          <rect x={50} y={670} width={380} height={30} rx={8} fill="rgba(255,255,255,0.85)" />
          <rect x={50} y={724} width={240} height={22} rx={8} fill="rgba(255,255,255,0.3)" />
        </svg>
      </Card>
      {/* nutrition card */}
      <Card x={(1 - sw) * 1000} rot={(1 - sw) * 10}>
        <svg width={700} height={820}>
          <circle cx={350} cy={250} r={150} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={30} />
          <circle cx={350} cy={250} r={150} fill="none" stroke={MCOLORS.orange} strokeWidth={30} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 150 * ring * 0.86} 2000`} transform="rotate(-90 350 250)" />
          {macros.map(([, v, col], i) => (
            <g key={i}>
              <rect x={60} y={520 + i * 96} width={400} height={22} rx={11} fill="rgba(255,255,255,0.12)" />
              <rect x={60 + 400 * (1 - v * prog(frame, b + 6 + i * 4, b + 26 + i * 4))} y={520 + i * 96} width={400 * v * prog(frame, b + 6 + i * 4, b + 26 + i * 4)} height={22} rx={11} fill={col} />
            </g>
          ))}
        </svg>
        <div style={{ position: "absolute", top: 180, left: 0, right: 0, textAlign: "center", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 104, color: MCOLORS.white }}>{kcal}</div>
        <div style={{ position: "absolute", top: 298, left: 0, right: 0, ...txt(40, MCOLORS.mute, 700) }}>سعرة</div>
        {macros.map(([n], i) => <div key={n} style={{ position: "absolute", top: 494 + i * 96, right: 56, ...txt(46, MCOLORS.white, 800), textAlign: "right" }}>{n}</div>)}
      </Card>
      <Flash at={b + 12} peak={0.4} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5. coach
const Coach: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ph("coach", 9), b = ph("coach", 10);
  const steps = 5, sx = 150, sy = 70, x0 = 930, y0 = 1520;
  const stair = Array.from({ length: steps }, (_, i) => `L${x0 - (i + 1) * sx},${y0 - i * sy} L${x0 - (i + 1) * sx},${y0 - (i + 1) * sy}`).join(" ");
  const t = prog(frame, b, b + 46, Easing.inOut(Easing.quad)) * (steps - 0.4);
  const k = Math.floor(t), fr = t - k;
  return (
    <AbsoluteFill>
      <Glow x={540} y={520} r={560} opacity={0.3} />
      <Slam at={a} y={300}><div style={txt(196)}>وأنا معك</div></Slam>
      <div style={{ position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: prog(frame, a + 8, a + 16), transform: `translateY(${(1 - prog(frame, a + 8, a + 16)) * 30}px)` }}>
        <div style={{ background: MCOLORS.orange, transform: `skewX(${SLANT}deg)`, padding: "12px 44px" }}>
          <div style={{ ...txt(58, MCOLORS.black, 800), transform: `skewX(${-SLANT}deg)` }}>الكابتن محمد الصقر</div>
        </div>
      </div>
      <Line text="أتابعك خطوة بخطوة" at={b} y={680} size={100} color={MCOLORS.orange} echo={MCOLORS.white} />
      <Svg>
        <DrawPath d={`M${x0 + 80},${y0} L${x0},${y0} ${stair} L60,${y0 - steps * sy}`} at={b - 6} dur={30} width={8} stroke={MCOLORS.white} cap="butt" />
        {Array.from({ length: steps }, (_, i) => (
          <circle key={i} cx={x0 - (i + 0.5) * sx - sx / 2 + sx / 2} cy={y0 - i * sy - 22} r={k > i ? 13 : 0} fill={MCOLORS.orange} />
        ))}
        {frame >= b ? <Athlete pose={climb((frame / 14) % 1)} x={x0 - 40 - (k + fr) * sx} y={y0 - Math.min(steps, k + (fr > 0.5 ? 1 : 0)) * sy} scale={0.95} flip rim={4} /> : null}
        <Chevrons x={110} y={y0 - steps * sy - 60} opacity={prog(frame, b + 34, b + 44)} size={30} />
      </Svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6. skills
const HANG: Pose = { torso: 0, head: -4, armN: [176, 178], armF: [172, 176], legN: [4, 6], legF: [-2, 2] };
const TOP: Pose = { torso: 8, head: 0, armN: [14, 4], armF: [8, 0], legN: [10, 6], legF: [4, 2] };
const Skills: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ph("skills", 11), b = ph("skills", 12), c = ph("skills", 13);
  const up = prog(frame, a + 6, a + 26, Easing.inOut(Easing.cubic));
  const lever = prog(frame, b + 2, b + 18, Easing.inOut(Easing.cubic));
  const BAR = 1030;
  const wipe = prog(frame, c - 2, c + 7, Easing.inOut(Easing.cubic));
  return (
    <Shake at={c} amount={42}>
      <Svg>
        <Particles count={46} seed="sk" opacity={0.5} />
        <line x1={170} x2={910} y1={BAR} y2={BAR} stroke={MCOLORS.white} strokeWidth={14} strokeLinecap="round" />
        <line x1={200} x2={200} y1={BAR} y2={1560} stroke="rgba(255,255,255,0.35)" strokeWidth={10} />
        <line x1={880} x2={880} y1={BAR} y2={1560} stroke="rgba(255,255,255,0.35)" strokeWidth={10} />
        {frame < b ? (
          // muscle-up: from the hang to support above the bar
          <Athlete pose={lerpPose(HANG, TOP, up)} x={540} y={BAR + 560 - up * 335} scale={1.5} rim={6} />
        ) : (
          // front lever: the body turns horizontal under the bar
          <g transform={`rotate(${-88 * lever} 540 ${BAR + 40})`}>
            <Athlete pose={{ ...HANG, armN: [176 - 82 * lever, 178 - 84 * lever], armF: [172 - 80 * lever, 176 - 82 * lever] }} x={540} y={BAR + 560} scale={1.5} rim={6} />
          </g>
        )}
        <Ring x={540} y={BAR - 60} at={a + 24} r0={60} r1={520} dur={16} width={7} />
        <Ring x={540} y={BAR + 60} at={b + 16} r0={60} r1={520} dur={16} width={7} />
      </Svg>
      <Line text="أول مسل أب؟" at={a} out={b - 4} y={330} size={140} />
      <Line text="أول فرونت ليفر؟" at={b} out={c - 4} y={330} size={124} />
      <div style={{ position: "absolute", top: 520, left: 0, right: 0, textAlign: "center", fontFamily: FONTS.latin, fontStyle: "italic", fontWeight: 800, fontSize: 44, letterSpacing: "0.3em", color: MCOLORS.orange, opacity: frame < c - 4 ? prog(frame, a + 6, a + 14) : 0 }}>
        {frame < b ? "FIRST MUSCLE-UP" : "FRONT LEVER"}
      </div>
      {/* the answer: the frame turns orange */}
      {wipe > 0 ? <AbsoluteFill style={{ background: MCOLORS.orange, clipPath: `circle(${wipe * 130}% at 50% 48%)` }} /> : null}
      <Slam at={c} y={740} from={2.4}><div style={txt(176, MCOLORS.black)}>بتوصل لها!</div></Slam>
      <Svg><Ring x={540} y={860} at={c} r0={120} r1={900} dur={18} width={12} color={MCOLORS.black} /></Svg>
      <Flash at={c} peak={0.9} />
    </Shake>
  );
};

// ------------------------------------------------------------------ 7. CTA
const URL = "reshape-online.com";
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = ph("cta", 14), b = ph("cta", 15), c = ph("cta", 16);
  const hit = c + 44;
  const typed = Math.round(prog(frame, c, c + 30, Easing.linear) * URL.length);
  const pill = spring({ frame: frame - (c - 6), fps, config: { damping: 15, stiffness: 190 } });
  const logo = spring({ frame: frame - hit, fps, config: { damping: 13, stiffness: 210, mass: 0.8 } });
  const beat = Math.exp(-((frame + f(sc("cta").start)) % 15) / 5);
  return (
    <Shake at={b} amount={36}>
      <Glow x={540} y={760} r={680} opacity={0.3 + 0.08 * beat} />
      <Svg>
        <Particles count={40} seed="cta" opacity={0.55} />
        <Ring x={540} y={640} at={b} r0={100} r1={860} dur={20} width={10} />
        <Ring x={540} y={1300} at={hit} r0={80} r1={640} dur={22} width={8} color={MCOLORS.white} />
      </Svg>
      <Line text="لا تأجّل…" at={a} out={b - 3} y={420} size={150} />
      <Slam at={b} y={450} from={2.3}>
        <div style={{ ...txt(170, MCOLORS.orange), transform: `scale(${1 + 0.03 * beat})` }}>سجّل الحين!</div>
      </Slam>
      <SlantBar x={150} y={700} w={780} h={22} inAt={b + 4} dur={8} color={MCOLORS.white} />
      {/* address bar, typed as the coach says it */}
      <div style={{ position: "absolute", top: 850, left: 90, right: 90, height: 150, borderRadius: 75, background: MCOLORS.white, opacity: Math.min(1, pill * 1.5), transform: `scale(${0.7 + 0.3 * pill})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 ${60 + 40 * beat}px rgba(255,84,32,0.55)` }}>
        <div style={{ fontFamily: FONTS.latin, fontWeight: 700, fontSize: 82, color: MCOLORS.black, direction: "ltr", letterSpacing: "0.01em" }}>
          {URL.slice(0, typed)}
          <span style={{ color: MCOLORS.orange, opacity: typed < URL.length || Math.floor(frame / 8) % 2 ? 1 : 0 }}>|</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 1160, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, logo * 1.6), transform: `scale(${1.6 - 0.6 * logo})` }}>
        <LogoLockup width={620} wordColor={MCOLORS.white} wordReveal={prog(frame, hit + 2, hit + 14)} />
      </div>
      <div style={{ position: "absolute", top: 1420, left: 0, right: 0, ...txt(50, MCOLORS.warm, 700), opacity: prog(frame, hit + 10, hit + 22) }}>برنامجك · تغذيتك · متابعة الكابتن</div>
      <Flash at={b} peak={0.75} />
      <Flash at={hit} peak={0.5} />
    </Shake>
  );
};

const SCENES: { id: SceneId; C: React.FC }[] = [
  { id: "hook", C: Hook }, { id: "problem", C: Problem }, { id: "brand", C: Brand }, { id: "features", C: Features },
  { id: "coach", C: Coach }, { id: "skills", C: Skills }, { id: "cta", C: Cta },
];

export const Hype: React.FC = () => {
  const frame = useCurrentFrame();
  // a light push on every beat keeps the frame alive between cuts
  const pulse = 1 + 0.012 * Math.exp(-(frame % 15) / 4) * interpolate(frame, [f(7.5) - 1, f(7.5)], [0.4, 1], clamp);
  return (
    <AbsoluteFill style={{ background: MCOLORS.black }}>
      <AbsoluteFill style={{ transform: `scale(${pulse})` }}>
        <AbsoluteFill style={{ background: MCOLORS.black }} />
        <Grid speed={1.1} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
        {SCENES.map(({ id, C }) => (
          <Sequence key={id} name={id} from={f(sc(id).start)} durationInFrames={f(sc(id).end) - f(sc(id).start)}>
            <C />
          </Sequence>
        ))}
      </AbsoluteFill>
      {SCENES.slice(1).filter((s) => s.id !== "brand" && s.id !== "cta").map(({ id }) => <SlantWipe key={id} at={f(sc(id).start)} dur={10} />)}
      <Grain opacity={0.035} />
      <Audio src={staticFile("audio/hype/mix.wav")} />
    </AbsoluteFill>
  );
};
