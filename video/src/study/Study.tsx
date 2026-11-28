import React from "react";
import { AbsoluteFill, Easing, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain } from "../components/Finish";
import { LogoLockup } from "../components/Logo";
import { FONTS } from "../lib/brand";
import { loadBrandFonts } from "../lib/fonts";
import { Character } from "../hype/Character";
import { lerpPose, Pose } from "../motion/Athlete";
import { MCOLORS, SLANT } from "../motion/design";
import { DrawPath, Glow, Ring, prog } from "../motion/kit";

loadBrandFonts();

// "What the studies say" — an educational reel (36 s, 1080x1920, 30 fps): four findings about building
// muscle with bodyweight training, each with its source on screen, then RESHAPE as the way to apply them.
//   1. Kikuchi & Nakazato 2017, J Exerc Sci Fit 15(1):37-42 — push-ups vs bench press at a similar load (40% 1RM),
//      8 weeks: comparable hypertrophy and strength gain.
//   2. Kotarsky et al. 2018, J Strength Cond Res 32(3):651-659 — progressive calisthenic push-up training,
//      3 days/week for 4 weeks, increased upper-body strength.
//   3. Schoenfeld, Ogborn & Krieger 2017, J Sports Sci 35(11):1073-1082 — dose-response meta-analysis:
//      10+ weekly sets per muscle gave greater gains than fewer.
//   4. Morton et al. 2018, Br J Sports Med 52(6):376-384 — 49 studies: protein beyond ~1.6 g/kg/day gave no
//      further gain in fat-free mass.
// Draft timing is fixed here; when the voice is recorded the scene lengths follow its phrases.
const BG = "#F7F0E9", INK = "#17181A", SOFT = "#6E6A66", TRACK = "rgba(23,24,26,0.12)", OR = MCOLORS.orange;
const S = { hook: [0, 96], myth: [96, 186], f1: [186, 366], f2: [366, 528], f3: [528, 678], f4: [678, 846], bridge: [846, 942], cta: [942, 1080] } as const;
export const STUDY_DURATION = 1080;
type Id = keyof typeof S;
const len = (id: Id) => S[id][1] - S[id][0];

const txt = (size: number, color: string = INK, weight = 900): React.CSSProperties => ({
  fontFamily: FONTS.display, fontWeight: weight, fontSize: size, color, direction: "rtl", textAlign: "center", lineHeight: 1.15, whiteSpace: "nowrap",
});
const soft = { damping: 20, stiffness: 150, mass: 0.9 };
const useS = (at: number, cfg = soft) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return spring({ frame: frame - at, fps, config: cfg }); };

const Rise: React.FC<{ at: number; y: number; children: React.ReactNode; style: React.CSSProperties }> = ({ at, y, children, style }) => {
  const frame = useCurrentFrame();
  const s = useS(at);
  if (frame < at) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, overflow: "hidden", padding: "14px 0" }}>
      <div style={{ ...style, transform: `translateY(${(1 - s) * 110}%)`, opacity: Math.min(1, s * 1.5) }}>{children}</div>
    </div>
  );
};
const Fade: React.FC<{ at: number; y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, y, children, style }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 12);
  return <div style={{ position: "absolute", left: 0, right: 0, top: y, opacity: p, transform: `translateY(${(1 - p) * 24}px)`, ...style }}>{children}</div>;
};
const Step: React.FC<{ id: Id; children: React.ReactNode }> = ({ id, children }) => {
  const frame = useCurrentFrame();
  const out = prog(frame, len(id) - 7, len(id), Easing.in(Easing.cubic));
  return <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${out * -50}px)` }}>{children}</AbsoluteFill>;
};
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute" }}>{children}</svg>;

/** Fixed frame of every finding: "fact n of 4" marker, headline, and the source at the bottom. */
const FactTop: React.FC<{ n: number }> = ({ n }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <div style={{ position: "absolute", top: 262, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: INK, borderRadius: 40, padding: "10px 38px", ...txt(46, "#FFFFFF", 800), opacity: prog(frame, 0, 8) }}>الحقيقة {n} من 4</div>
      </div>
      <div style={{ position: "absolute", top: 368, left: 0, right: 0, display: "flex", flexDirection: "row-reverse", justifyContent: "center", gap: 14 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 120, height: 12, transform: `skewX(${SLANT}deg)`, background: TRACK }}>
            <div style={{ height: "100%", marginLeft: "auto", background: OR, width: `${(i < n ? 1 : i === n ? prog(frame, 2, 16) : 0) * 100}%` }} />
          </div>
        ))}
      </div>
    </>
  );
};
const Source: React.FC<{ at: number; text: string }> = ({ at, text }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 12);
  return (
    <div style={{ position: "absolute", top: 1486, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: p }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#FFFFFF", border: "2px solid rgba(23,24,26,0.08)", borderRadius: 18, padding: "12px 26px", boxShadow: "0 10px 30px rgba(120,70,30,0.12)" }}>
        <div style={{ fontFamily: FONTS.latin, fontWeight: 600, fontSize: 30, color: SOFT, direction: "ltr" }}>{text}</div>
        <div style={{ ...txt(32, OR, 800) }}>المصدر</div>
      </div>
    </div>
  );
};
const Card: React.FC<{ at: number; children: React.ReactNode; h?: number; top?: number }> = ({ at, children, h = 600, top = 820 }) => {
  const s = useS(at);
  return (
    <div style={{ position: "absolute", left: 110, top, width: 860, height: h, borderRadius: 54, background: "#FFFFFF", border: "2px solid rgba(23,24,26,0.06)", boxShadow: "0 30px 90px rgba(120,70,30,0.2)", overflow: "hidden", transform: `translateY(${(1 - s) * 140}px) scale(${0.94 + 0.06 * s})`, opacity: Math.min(1, s * 1.4) }}>
      {children}
    </div>
  );
};

// push-up: a straight body from heels to head, hands under the shoulders
const PU_TOP: Pose = { torso: 64, head: -44, armN: [2, 0], armF: [6, 2], legN: [-64, -64], legF: [-66, -62] };
const PU_LOW: Pose = { torso: 83, head: -58, armN: [-104, 2], armF: [-100, 4], legN: [-83, -83], legF: [-85, -81] };
const pushUp = (frame: number, period = 36) => lerpPose(PU_TOP, PU_LOW, 0.5 - 0.5 * Math.cos((frame / period) * 2 * Math.PI));
const SLOUCH: Pose = { torso: 16, head: 14, armN: [10, 16], armF: [4, 10], legN: [4, -2], legF: [-4, -6] };
const BEST: Pose = { torso: -3, head: -8, armN: [-10, 26], armF: [158, 168], legN: [5, 1], legF: [-7, -5] };

// ------------------------------------------------------------------ hook
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = prog(frame, 30, 56, Easing.inOut(Easing.cubic));
  return (
    <Step id="hook">
      <Glow x={540} y={1180} r={380 + 300 * rise} opacity={0.1 + 0.35 * rise} color="#FFB08A" />
      <Svg>
        <line x1={240} x2={840} y1={1500} y2={1500} stroke="rgba(23,24,26,0.18)" strokeWidth={4} />
        <Character pose={lerpPose(SLOUCH, BEST, rise)} x={540} y={1500} scale={1.9} tone={rise} />
        <Ring x={540} y={1180} at={52} r0={120} r1={700} dur={24} width={7} />
      </Svg>
      <Rise at={4} y={300} style={txt(128)}>ودّك توصل</Rise>
      <Rise at={16} y={456} style={txt(88, OR)}>لأفضل نسخة من جسمك؟</Rise>
      <Fade at={58} y={620}><div style={txt(60, SOFT, 700)}>هذا اللي تقوله الدراسات 👇</div></Fade>
    </Step>
  );
};

// ------------------------------------------------------------------ the myth
const Myth: React.FC = () => {
  const frame = useCurrentFrame();
  const x = useS(44, { damping: 12, stiffness: 220, mass: 0.7 });
  return (
    <Step id="myth">
      <Rise at={2} y={330} style={txt(120)}>لازم حديد</Rise>
      <Rise at={10} y={480} style={txt(120)}>عشان تبني عضل؟</Rise>
      <Svg>
        {/* dumbbell */}
        <g transform="translate(540 1000)" opacity={prog(frame, 8, 18)}>
          <rect x={-190} y={-18} width={380} height={36} rx={18} fill="#8A8D94" />
          {[-1, 1].map((d) => (
            <g key={d} transform={`scale(${d} 1)`}>
              <rect x={150} y={-120} width={70} height={240} rx={22} fill={INK} />
              <rect x={226} y={-86} width={48} height={172} rx={18} fill="#3A3D45" />
            </g>
          ))}
        </g>
        {frame >= 44 ? (
          <g transform={`translate(540 1000) scale(${2 - x})`} opacity={Math.min(1, x * 1.5)}>
            <path d="M-170,-170 L170,170 M170,-170 L-170,170" stroke={OR} strokeWidth={46} strokeLinecap="round" />
          </g>
        ) : null}
        <Ring x={540} y={1000} at={44} r0={120} r1={620} dur={20} width={8} />
      </Svg>
      <Fade at={54} y={1290}><div style={txt(104, OR)}>العلم يقول: لا</div></Fade>
    </Step>
  );
};

// ------------------------------------------------------------------ 1. push-ups build the chest like the bench press
const Fact1: React.FC = () => {
  const frame = useCurrentFrame();
  const g = prog(frame, 62, 110, Easing.out(Easing.cubic));
  const bar = (x: number, label: string, col: string) => (
    <g>
      <rect x={x} y={470 - 250 * g} width={150} height={250 * g} rx={18} fill={col} />
      <text x={x + 75} y={520} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={40} fill={INK} direction="rtl">{label}</text>
    </g>
  );
  return (
    <Step id="f1">
      <FactTop n={1} />
      <Rise at={8} y={420} style={txt(110)}>الضغط يبني صدرك</Rise>
      <Rise at={16} y={556} style={txt(110, OR)}>مثل البنش برس</Rise>
      <Card at={24} h={580} top={770}>
        <svg width={860} height={580}>
          <rect width={430} height={580} fill="#FBE3D3" />
          <rect y={430} width={430} height={150} fill="#F3CDB6" />
          <Character pose={pushUp(frame)} x={250} y={432} scale={1.02} />
          {bar(500, "ضغط", OR)}
          {bar(680, "بنش", INK)}
          <text x={665} y={84} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={38} fill={SOFT} direction="rtl">نمو عضلة الصدر</text>
          <text x={665} y={168} textAnchor="middle" fontFamily={FONTS.display} fontWeight={900} fontSize={76} fill={OR} opacity={prog(frame, 104, 116)}>=</text>
        </svg>
      </Card>
      <Fade at={112} y={1380}><div style={txt(52, SOFT, 700)}>8 أسابيع · بحمل متقارب · نفس النتيجة</div></Fade>
      <Source at={40} text="Kikuchi & Nakazato · J Exerc Sci Fit · 2017" />
    </Step>
  );
};

// ------------------------------------------------------------------ 2. progression is the secret
const Fact2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const lv = ["مائل", "عادي", "أصعب", "أصعب +"];
  const cur = Math.min(3, Math.floor(prog(frame, 40, 118, Easing.linear) * 3.999));
  return (
    <Step id="f2">
      <FactTop n={2} />
      <Rise at={8} y={420} style={txt(110)}>السر مو في التمرين</Rise>
      <Rise at={16} y={556} style={txt(110, OR)}>السر في التدرّج</Rise>
      <div style={{ position: "absolute", top: 800, left: 110, width: 860, height: 520, display: "flex", flexDirection: "row-reverse", alignItems: "flex-end", gap: 22 }}>
        {lv.map((l, i) => {
          const s = spring({ frame: frame - (26 + i * 5), fps, config: soft });
          const on = i <= cur && frame >= 40;
          return (
            <div key={l} style={{ flex: 1, height: (170 + i * 110) * s, borderRadius: 26, background: on ? OR : "#FFFFFF", border: `3px solid ${on ? OR : "rgba(23,24,26,0.08)"}`, boxShadow: "0 16px 50px rgba(120,70,30,0.14)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 22 }}>
              <div style={{ ...txt(48, on ? "#FFFFFF" : INK, 800), opacity: s }}>{l}</div>
            </div>
          );
        })}
      </div>
      <Fade at={100} y={1352}><div style={txt(50, SOFT, 700)}>كل ما سهل عليك… صعّبه</div><div style={txt(44, SOFT, 700)}>القوة زادت في 4 أسابيع</div></Fade>
      <Source at={40} text="Kotarsky et al. · J Strength Cond Res · 2018" />
    </Step>
  );
};

// ------------------------------------------------------------------ 3. ten sets a week
const Fact3: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(prog(frame, 30, 84, Easing.linear) * 10);
  return (
    <Step id="f3">
      <FactTop n={3} />
      <Rise at={8} y={420} style={txt(110)}>كل عضلة تحتاج</Rise>
      <Rise at={16} y={562} style={txt(94, OR)}>10 مجموعات بالأسبوع</Rise>
      <Card at={22} h={520} top={800}>
        <div style={{ position: "absolute", top: 34, left: 0, right: 0, textAlign: "center", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 190, color: n >= 10 ? OR : INK, lineHeight: 1 }}>{n}{n >= 10 ? "+" : ""}</div>
        <div style={{ position: "absolute", top: 300, left: 70, right: 70, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18, direction: "rtl" }}>
          {Array.from({ length: 10 }, (_, i) => <div key={i} style={{ height: 72, borderRadius: 16, background: i < n ? OR : TRACK, transform: `scale(${i < n ? 1 : 0.92})` }} />)}
        </div>
      </Card>
      <Fade at={92} y={1370}><div style={txt(52, SOFT, 700)}>أقل من كذا… نمو أقل</div></Fade>
      <Source at={40} text="Schoenfeld et al. · J Sports Sci · 2017" />
    </Step>
  );
};

// ------------------------------------------------------------------ 4. protein: 1.6 g per kg
const Fact4: React.FC = () => {
  const frame = useCurrentFrame();
  const curve = "M90,430 C240,400 330,170 470,140 L770,132";
  return (
    <Step id="f4">
      <FactTop n={4} />
      <Rise at={8} y={420} style={txt(110)}>بروتينك اليومي</Rise>
      <Rise at={16} y={556} style={{ ...txt(110, OR), direction: "rtl" }}>1.6 غ لكل كيلو</Rise>
      <Card at={22} h={540} top={790}>
        <svg width={860} height={540}>
          <line x1={90} x2={790} y1={450} y2={450} stroke={TRACK} strokeWidth={5} />
          <line x1={90} x2={90} y1={70} y2={450} stroke={TRACK} strokeWidth={5} />
          <DrawPath d={curve} at={30} dur={54} width={12} stroke={OR} />
          <g opacity={prog(frame, 78, 90)}>
            <line x1={470} x2={470} y1={140} y2={450} stroke={INK} strokeWidth={4} strokeDasharray="10 10" />
            <circle cx={470} cy={140} r={18} fill={INK} />
            <text x={470} y={506} textAnchor="middle" fontFamily={FONTS.latin} fontWeight={700} fontSize={46} fill={INK}>1.6</text>
            <text x={640} y={96} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={40} fill={SOFT} direction="rtl">بعدها ما يزيد البناء</text>
          </g>
          <text x={200} y={56} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={36} fill={SOFT} direction="rtl">بناء العضل</text>
        </svg>
      </Card>
      <Fade at={104} y={1372}><div style={txt(54, INK, 800)}>وزنك 70 كغ ← <span style={{ color: OR }}>112 غ</span> باليوم</div></Fade>
      <Source at={40} text="Morton et al. · Br J Sports Med · 2018 · 49 studies" />
    </Step>
  );
};

// ------------------------------------------------------------------ bridge
const Bridge: React.FC = () => (
  <Step id="bridge">
    <Rise at={4} y={640} style={txt(124)}>المعلومة سهلة…</Rise>
    <Rise at={34} y={820} style={txt(106, OR)}>التطبيق هو الصعب</Rise>
    <Fade at={52} y={1020}><div style={txt(58, SOFT, 700)}>تدرّج · مجموعات · بروتين… كل يوم</div></Fade>
  </Step>
);

// ------------------------------------------------------------------ soft CTA
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = useS(4);
  const items = ["برنامج متدرّج على مستواك", "مجموعاتك محسوبة", "تغذيتك بالغرام"];
  return (
    <AbsoluteFill>
      <Glow x={540} y={520} r={560} opacity={0.3 * logo} color="#FFB08A" />
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: Math.min(1, logo * 1.6), transform: `scale(${1.2 - 0.2 * logo})` }}>
        <LogoLockup width={600} wordColor={INK} wordReveal={prog(frame, 6, 20)} />
      </div>
      <Rise at={16} y={600} style={txt(96)}>نرتّبها لك كلها</Rise>
      <div style={{ position: "absolute", top: 800, left: 150, right: 150, display: "flex", flexDirection: "column", gap: 22 }}>
        {items.map((t, i) => {
          const s = spring({ frame: frame - (30 + i * 8), fps, config: soft });
          return (
            <div key={t} style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 22, background: "#FFFFFF", borderRadius: 28, padding: "24px 34px", boxShadow: "0 16px 50px rgba(120,70,30,0.14)", opacity: s, transform: `translateY(${(1 - s) * 50}px)` }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: OR, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 38, color: "#FFFFFF" }}>✓</div>
              <div style={{ ...txt(50, INK, 800), textAlign: "right", flex: 1 }}>{t}</div>
            </div>
          );
        })}
      </div>
      <Fade at={70} y={1270} style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ background: INK, borderRadius: 70, padding: "26px 70px", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 76, color: "#FFFFFF", direction: "ltr", boxShadow: "0 24px 70px rgba(255,84,32,0.35)" }}>reshape-online.com</div>
      </Fade>
    </AbsoluteFill>
  );
};

const SCENES: { id: Id; C: React.FC }[] = [
  { id: "hook", C: Hook }, { id: "myth", C: Myth }, { id: "f1", C: Fact1 }, { id: "f2", C: Fact2 }, { id: "f3", C: Fact3 }, { id: "f4", C: Fact4 }, { id: "bridge", C: Bridge }, { id: "cta", C: Cta },
];

export const Study: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 30%, #FFFFFF 0%, rgba(255,255,255,0) 70%), radial-gradient(ellipse 90% 50% at 50% 100%, #F6DCCB 0%, rgba(246,220,203,0) 70%)" }} />
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(23,24,26,0.10) 2px, transparent 2px)", backgroundSize: "54px 54px", opacity: 0.6 }} />
    {SCENES.map(({ id, C }) => (
      <Sequence key={id} name={id} from={S[id][0]} durationInFrames={len(id)}>
        <C />
      </Sequence>
    ))}
    <Grain opacity={0.02} />
  </AbsoluteFill>
);
