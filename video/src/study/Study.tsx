import React from "react";
import { AbsoluteFill, Audio, Easing, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain } from "../components/Finish";
import { LogoLockup } from "../components/Logo";
import { FONTS } from "../lib/brand";
import { loadBrandFonts } from "../lib/fonts";
import { MCOLORS, SLANT } from "../motion/design";
import { DrawPath, Glow, Ring, clamp, prog } from "../motion/kit";

loadBrandFonts();

// "What the studies say" — an educational reel (49 s, 1080x1920, 30 fps): four findings about building
// muscle with bodyweight training, each with its source on screen, then RESHAPE as the way to apply them.
//   1. Kikuchi & Nakazato 2017, J Exerc Sci Fit 15(1):37-42 — push-ups vs bench press at a similar load (40% 1RM),
//      8 weeks: comparable hypertrophy and strength gain.
//   2. Kotarsky et al. 2018, J Strength Cond Res 32(3):651-659 — progressive calisthenic push-up training,
//      3 days/week for 4 weeks, increased upper-body strength.
//   3. Schoenfeld, Ogborn & Krieger 2017, J Sports Sci 35(11):1073-1082 — dose-response meta-analysis:
//      10+ weekly sets per muscle gave greater gains than fewer.
//   4. Morton et al. 2018, Br J Sports Med 52(6):376-384 — 49 studies: protein beyond ~1.6 g/kg/day gave no
//      further gain in fat-free mass.
//
// Transitions follow the motion library («مقاطع الموشن جرافيك»): every scene is made out of the previous
// one. A shape floods the frame and contracts into an object of the next scene (fist → dumbbell, dumbbell
// plate → the "fact" pill, the orange line → the logo mark); the four findings share one header, one card
// that changes size, and one source chip, with copy that rolls behind a mask; the card collapses into the
// rule the closing lines rise from. No crossfades, no slides of whole screens, no 3D flips.
// Scene lengths follow the phrases of the voice-over (scripts/build_study_audio.py places the takes).
const BG = "#F7F0E9", INK = "#17181A", SOFT = "#6E6A66", TRACK = "rgba(23,24,26,0.12)", OR = MCOLORS.orange, RED = "#E71C2B";
const T = { hook: 0, myth: 144, facts: 279, bridge: 1126, cta: 1230, end: 1467 };
export const STUDY_DURATION = T.end;
/** Start of each finding inside the facts sequence, plus its end. */
const B = [0, 240, 480, 642, 847];

const txt = (size: number, color: string = INK, weight = 900): React.CSSProperties => ({
  fontFamily: FONTS.display, fontWeight: weight, fontSize: size, color, direction: "rtl", textAlign: "center", lineHeight: 1.15, whiteSpace: "nowrap",
});
const soft = { damping: 20, stiffness: 150, mass: 0.9 };
const io = Easing.bezier(0.65, 0, 0.35, 1);
const useS = (at: number, cfg = soft) => { const frame = useCurrentFrame(); const { fps } = useVideoConfig(); return spring({ frame: frame - at, fps, config: cfg }); };

/** Copy that rises out of a mask line and, with `out`, leaves upward behind the same mask. */
const Rise: React.FC<{ at: number; out?: number; y: number; children: React.ReactNode; style: React.CSSProperties; from?: "below" | "above" }> = ({ at, out, y, children, style, from = "below" }) => {
  const frame = useCurrentFrame();
  const s = useS(at);
  const o = out === undefined ? 0 : prog(frame, out, out + 10, Easing.in(Easing.cubic));
  if (frame < at || o >= 1) return null;
  const dir = from === "below" ? 1 : -1;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, overflow: "hidden", padding: "14px 0" }}>
      <div style={{ ...style, transform: `translateY(${(1 - s) * 112 * dir - o * 112}%)` }}>{children}</div>
    </div>
  );
};
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => <svg width={1080} height={1920} style={{ position: "absolute" }}>{children}</svg>;

/**
 * Flood: a circle grows from a point of the outgoing scene until it covers the frame (the cut happens
 * underneath at `at`), then contracts onto a point of the incoming scene and hands over to the object there.
 */
const Flood: React.FC<{ at: number; from: [number, number]; to: [number, number]; color: string; r1?: number; grow?: number; shrink?: number }> = ({ at, from, to, color, r1 = 0, grow = 10, shrink = 11 }) => {
  const frame = useCurrentFrame();
  if (frame < at - grow || frame > at + shrink) return null;
  const R = 2500;
  const growing = frame < at;
  const r = growing ? interpolate(frame, [at - grow, at], [0, R], { ...clamp, easing: Easing.in(Easing.cubic) }) : interpolate(frame, [at, at + shrink], [R, r1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const [x, y] = growing ? from : to;
  return <AbsoluteFill style={{ background: color, clipPath: `circle(${r}px at ${x}px ${y}px)` }} />;
};

/**
 * The athlete is a generated character (Higgsfield MAGI-2 clips of one approved reference), keyed off its
 * flat background into transparent WebM by scripts/clean_hf_clip.py. In the 16:9 exercise clips the floor
 * is at 88.5% of the height and the figure spans 10–80% of the width; in the 9:16 hook clip the feet are at 95%.
 */
const Clip: React.FC<{ name: string; left: number; top: number; width: number; rate?: number; style?: React.CSSProperties }> = ({ name, left, top, width, rate = 1, style }) => (
  <OffthreadVideo src={staticFile(`study/${name}.webm`)} transparent muted playbackRate={rate} style={{ position: "absolute", left, top, width, ...style }} />
);
const FIST: [number, number] = [540, 930];      // the crossed arms at the end of the hook
const DUMB: [number, number] = [540, 1000];     // centre of the dumbbell
const PILL: [number, number] = [540, 296];      // centre of the "fact n of 4" pill
const RULE_Y = 812;                             // the rule the closing lines rise from
const MARK: [number, number] = [318, 398];      // the logo mark on the end card

// ------------------------------------------------------------------ hook
const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const rise = prog(frame, 50, 84, Easing.inOut(Easing.cubic));
  return (
    <AbsoluteFill>
      <Glow x={540} y={1180} r={380 + 300 * rise} opacity={0.1 + 0.35 * rise} color="#FFB08A" />
      <Svg>
        <line x1={240} x2={840} y1={1500} y2={1500} stroke="rgba(23,24,26,0.18)" strokeWidth={4} />
        <ellipse cx={540} cy={1502} rx={190} ry={20} fill="rgba(23,24,26,0.13)" />
      </Svg>
      <Clip name="hook" left={287} top={645} width={506} rate={1.08} />
      <Svg><Ring x={FIST[0]} y={FIST[1]} at={84} r0={30} r1={420} dur={22} width={7} /></Svg>
      <Rise at={4} y={300} style={txt(128)}>ودّك توصل</Rise>
      <Rise at={16} y={456} style={txt(88, OR)}>لأفضل نسخة من جسمك؟</Rise>
      <Rise at={82} y={610} style={txt(60, SOFT, 700)}>هذا اللي تقوله الدراسات 👇</Rise>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the myth
const Myth: React.FC = () => {
  const land = useS(6, { damping: 14, stiffness: 180, mass: 0.8 });     // the dumbbell grows out of the flood's last dot
  return (
    <AbsoluteFill>
      <Rise at={10} y={330} style={txt(120)}>لازم حديد</Rise>
      <Rise at={18} y={480} style={txt(120)}>عشان تبني عضل؟</Rise>
      <Svg>
        <g transform={`translate(${DUMB[0]} ${DUMB[1]}) scale(${land})`}>
          <rect x={-190} y={-18} width={380} height={36} rx={18} fill="#8A8D94" />
          {[-1, 1].map((d) => (
            <g key={d} transform={`scale(${d} 1)`}>
              <rect x={150} y={-120} width={70} height={240} rx={22} fill={INK} />
              <rect x={226} y={-86} width={48} height={172} rx={18} fill="#3A3D45" />
            </g>
          ))}
        </g>
        <DrawPath d="M370,830 L710,1170" at={108} dur={7} width={46} stroke={OR} />
        <DrawPath d="M710,830 L370,1170" at={113} dur={7} width={46} stroke={OR} />
        <Ring x={540} y={1000} at={114} r0={120} r1={620} dur={20} width={8} />
      </Svg>
      <Rise at={82} y={1290} style={txt(104, OR)}>العلم يقول: لا</Rise>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the four findings: one header, one card, one source chip
const FACTS = [
  { a: "الضغط يبني صدرك", b: "مثل البنش برس", bSize: 110, h: 664, src: "Kikuchi & Nakazato · J Exerc Sci Fit · 2017" },
  { a: "السر مو في التمرين", b: "السر في التدرّج", bSize: 110, h: 640, src: "Kotarsky et al. · J Strength Cond Res · 2018" },
  { a: "كل عضلة تحتاج", b: "10 مجموعات بالأسبوع", bSize: 94, h: 600, src: "Schoenfeld et al. · J Sports Sci · 2017" },
  { a: "بروتينك اليومي", b: "1.6 غ لكل كيلو", bSize: 110, h: 644, src: "Morton et al. · Br J Sports Med · 2018 · 49 studies" },
];
const Caption: React.FC<{ at: number; top: number; children: React.ReactNode }> = ({ at, top, children }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 12);
  return <div style={{ position: "absolute", left: 0, right: 0, top, opacity: p, transform: `translateY(${(1 - p) * 18}px)`, ...txt(46, SOFT, 700) }}>{children}</div>;
};
const C1: React.FC = () => {
  const frame = useCurrentFrame();
  const g = prog(frame, 150, 195, Easing.out(Easing.cubic));
  const bar = (x: number, label: string, col: string) => (
    <g>
      <rect x={x} y={450 - 250 * g} width={150} height={250 * g} rx={18} fill={col} />
      <text x={x + 75} y={502} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={40} fill={INK} direction="rtl">{label}</text>
    </g>
  );
  return (
    <>
      <svg width={860} height={560} style={{ position: "absolute" }}>
        <rect width={430} height={560} fill="#FBE3D3" />
        <rect y={420} width={430} height={140} fill="#F3CDB6" />
        <ellipse cx={212} cy={424} rx={170} ry={11} fill="rgba(23,24,26,0.12)" />
        {bar(500, "ضغط", OR)}
        {bar(680, "بنش", INK)}
        <text x={665} y={76} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={38} fill={SOFT} direction="rtl">نمو عضلة الصدر</text>
        <text x={665} y={160} textAnchor="middle" fontFamily={FONTS.display} fontWeight={900} fontSize={76} fill={OR} opacity={prog(frame, 192, 204)}>=</text>
      </svg>
      <div style={{ position: "absolute", left: 0, top: 0, width: 430, height: 560, overflow: "hidden" }}>
        <Clip name="pushup" left={-44} top={163} width={520} />
      </div>
      <Caption at={206} top={582}>8 أسابيع · بحمل متقارب · نفس النتيجة</Caption>
    </>
  );
};
// 2. progression, shown instead of charted: the same athlete, and the exercise gets harder — hands on a
// box, then the floor, then feet on the box. Each harder variation wipes in behind an orange edge while its
// name rolls and the difficulty marker climbs.
const C2: React.FC = () => {
  const frame = useCurrentFrame();
  const FLOOR = 430, W = 730, L = 142, TOP = FLOOR - 0.885 * (W * 9) / 16;
  const r = [1, prog(frame, 104, 120, io), prog(frame, 142, 158, io)];
  const lv = frame < 112 ? 0 : frame < 150 ? 1 : 2;
  const clips = ["incline", "pushup", "decline"];
  const names = ["ضغط مائل", "ضغط عادي", "ضغط منحدر"];
  const roll = r[1] + r[2];
  const pop = (at: number) => 1 + 0.25 * Math.max(0, 1 - Math.abs(frame - at - 6) / 6);
  return (
    <>
      <svg width={860} height={520} style={{ position: "absolute" }}>
        <rect width={860} height={520} fill="#FBE3D3" />
        <rect y={FLOOR} width={860} height={90} fill="#F3CDB6" />
        <ellipse cx={L + 0.45 * W} cy={FLOOR + 4} rx={300} ry={12} fill="rgba(23,24,26,0.12)" />
      </svg>
      {/* the outgoing variation is wiped away to the left as the incoming one is revealed from the right */}
      {clips.map((c, i) => {
        const inn = r[i], out = i < 2 ? r[i + 1] : 0;
        if (inn <= 0 || out >= 1) return null;
        return (
          <div key={c} style={{ position: "absolute", left: 0, top: 0, width: 860, height: 520, clipPath: `inset(0 ${out * 100}% 0 ${(1 - inn) * 100}%)` }}>
            <Clip name={c} left={L} top={TOP} width={W} />
          </div>
        );
      })}
      {[1, 2].map((i) => (r[i] > 0 && r[i] < 1 ? <div key={i} style={{ position: "absolute", top: 0, height: 520, width: 10, left: (1 - r[i]) * 860 - 5, background: OR }} /> : null))}
      <svg width={860} height={520} style={{ position: "absolute" }}>
        {/* difficulty: three steps, the marker climbs with the exercise */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${76} ${330 - i * 86})`}>
            <rect x={-46} y={-30} width={92} height={60} rx={16} fill={i <= lv ? OR : "#FFFFFF"} transform={`scale(${i === lv ? pop(i === 0 ? 14 : i === 1 ? 112 : 150) : 1})`} opacity={prog(frame, 12 + i * 4, 22 + i * 4)} />
            <text x={0} y={15} textAnchor="middle" fontFamily={FONTS.latin} fontWeight={700} fontSize={40} fill={i <= lv ? "#FFFFFF" : SOFT} opacity={prog(frame, 12 + i * 4, 22 + i * 4)}>{i + 1}</text>
          </g>
        ))}
      </svg>
      {/* the name of the variation rolls behind a mask as the exercise changes */}
      <div style={{ position: "absolute", top: 26, right: 44, height: 76, overflow: "hidden", opacity: prog(frame, 10, 20) }}>
        <div style={{ transform: `translateY(${-roll * 76}px)` }}>
          {names.map((n) => <div key={n} style={{ height: 76, ...txt(54, INK, 900), textAlign: "right" }}>{n}</div>)}
        </div>
      </div>
      <div style={{ position: "absolute", top: 26, left: 130, ...txt(34, SOFT, 700), opacity: prog(frame, 14, 24) }}>الصعوبة</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 544, ...txt(38, SOFT, 700), opacity: prog(frame, 172, 184) }}>كل ما سهل… صعّبه · قوة أعلى في 4 أسابيع</div>
    </>
  );
};
const C3: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.round(prog(frame, 36, 84, Easing.linear) * 10);
  return (
    <>
      <div style={{ position: "absolute", top: 34, left: 0, right: 0, textAlign: "center", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 190, color: n >= 10 ? OR : INK, lineHeight: 1 }}>{n}{n >= 10 ? "+" : ""}</div>
      <div style={{ position: "absolute", top: 290, left: 70, right: 70, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 18, direction: "rtl" }}>
        {Array.from({ length: 10 }, (_, i) => <div key={i} style={{ height: 72, borderRadius: 16, background: i < n ? OR : TRACK, transform: `scale(${i < n ? 1 : 0.92})` }} />)}
      </div>
      <Caption at={118} top={504}>أقل من كذا… نمو أقل</Caption>
    </>
  );
};
const C4: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <svg width={860} height={540} style={{ position: "absolute" }}>
        <line x1={90} x2={790} y1={450} y2={450} stroke={TRACK} strokeWidth={5} />
        <line x1={90} x2={90} y1={70} y2={450} stroke={TRACK} strokeWidth={5} />
        <DrawPath d="M90,430 C240,400 330,170 470,140 L770,132" at={30} dur={54} width={12} stroke={OR} />
        <g opacity={prog(frame, 78, 90)}>
          <line x1={470} x2={470} y1={140} y2={450} stroke={INK} strokeWidth={4} strokeDasharray="10 10" />
          <circle cx={470} cy={140} r={18} fill={INK} />
          <text x={470} y={506} textAnchor="middle" fontFamily={FONTS.latin} fontWeight={700} fontSize={46} fill={INK}>1.6</text>
          <text x={640} y={96} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={40} fill={SOFT} direction="rtl">بعدها ما يزيد البناء</text>
        </g>
        <text x={200} y={56} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={36} fill={SOFT} direction="rtl">بناء العضل</text>
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 552, ...txt(50, INK, 800), opacity: prog(frame, 112, 124) }}>وزنك 70 كغ ← <span style={{ color: OR }}>112 غ</span> باليوم</div>
    </>
  );
};
const CONTENT = [C1, C2, C3, C4];

/** A value that rolls behind a mask whenever the finding changes (pill number, source). */
const Roll: React.FC<{ items: React.ReactNode[]; h: number; style?: React.CSSProperties }> = ({ items, h, style }) => {
  const frame = useCurrentFrame();
  const pos = B.slice(1, 4).reduce((acc, b) => acc + prog(frame, b - 2, b + 12, io), 0);
  return (
    <div style={{ height: h, overflow: "hidden", ...style }}>
      <div style={{ transform: `translateY(${-pos * h}px)` }}>{items.map((it, i) => <div key={i} style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center" }}>{it}</div>)}</div>
    </div>
  );
};
const Facts: React.FC = () => {
  const frame = useCurrentFrame();
  // header: the pill opens out of the dot the ink flood leaves behind
  const pill = prog(frame, 9, 22, Easing.out(Easing.cubic));
  // card: grows out of its own centre once, then only changes height; at the end it collapses into the rule
  const born = useS(14);
  const end = prog(frame, B[4] - 14, B[4] - 1, io);
  let h = FACTS[0].h;
  for (let i = 1; i < 4; i++) h += (FACTS[i].h - FACTS[i - 1].h) * prog(frame, B[i] - 2, B[i] + 12, io);
  const top = 780 + (RULE_Y - 780) * end, height = h + (6 - h) * end, width = 860 + (640 - 860) * end;
  const leave = prog(frame, B[4] - 16, B[4] - 6, Easing.in(Easing.cubic));   // header and chip clear before the collapse ends
  return (
    <AbsoluteFill>
      {/* header */}
      <div style={{ position: "absolute", top: PILL[1] - 34, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `translateY(${-leave * 140}px)`, opacity: 1 - leave }}>
        <div style={{ background: INK, borderRadius: 40, height: 68, width: 68 + (330 - 68) * pill, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 12, opacity: prog(frame, 16, 24), whiteSpace: "nowrap" }}>
            <div style={txt(44, "#FFFFFF", 800)}>الحقيقة</div>
            <Roll h={60} items={[1, 2, 3, 4].map((n) => <div key={n} style={{ fontFamily: FONTS.latin, fontWeight: 700, fontSize: 46, color: OR }}>{n}</div>)} />
            <div style={txt(44, "#FFFFFF", 800)}>من 4</div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: 368, left: 0, right: 0, display: "flex", flexDirection: "row-reverse", justifyContent: "center", gap: 14, opacity: prog(frame, 14, 24) * (1 - leave) }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ width: 120, height: 12, transform: `skewX(${SLANT}deg)`, background: TRACK }}>
            <div style={{ height: "100%", marginLeft: "auto", background: OR, width: `${prog(frame, B[i] + (i === 0 ? 16 : 0), B[i] + (i === 0 ? 30 : 14), io) * 100}%` }} />
          </div>
        ))}
      </div>
      {/* headlines: the old pair leaves upward behind the mask as the new pair rises */}
      {FACTS.map((f, i) => (
        <React.Fragment key={i}>
          <Rise at={B[i] + (i === 0 ? 18 : 4)} out={B[i + 1] - 6} y={420} style={txt(110)}>{f.a}</Rise>
          <Rise at={B[i] + (i === 0 ? 26 : 10)} out={B[i + 1] - 3} y={i === 2 ? 562 : 556} style={txt(f.bSize, OR)}>{f.b}</Rise>
        </React.Fragment>
      ))}
      {/* the card */}
      <div style={{ position: "absolute", left: 540 - width / 2, top, width, height, borderRadius: 54 * (1 - end) + 3, background: end > 0.55 ? INK : "#FFFFFF", border: end > 0.55 ? "none" : "2px solid rgba(23,24,26,0.06)", boxShadow: `0 30px 90px rgba(120,70,30,${0.2 * (1 - end)})`, overflow: "hidden", transform: `scale(${0.3 + 0.7 * born})`, opacity: Math.min(1, born * 1.6) }}>
        {CONTENT.map((C, i) => {
          const inP = i === 0 ? 1 : prog(frame, B[i] - 2, B[i] + 12, io);
          const outP = i === 3 ? 0 : prog(frame, B[i + 1] - 2, B[i + 1] + 12, io);
          if (inP <= 0 || outP >= 1) return null;
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: 0, width: 860, height: FACTS[i].h, transform: `translateY(${(1 - inP) * 100 - outP * 100}%)`, opacity: 1 - end * 2 }}>
              <Sequence from={B[i]} layout="none"><C /></Sequence>
            </div>
          );
        })}
      </div>
      {/* source chip */}
      <div style={{ position: "absolute", top: 1486, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: prog(frame, 30, 42) * (1 - leave), transform: `translateY(${leave * 60}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#FFFFFF", border: "2px solid rgba(23,24,26,0.08)", borderRadius: 18, padding: "6px 26px", boxShadow: "0 10px 30px rgba(120,70,30,0.12)" }}>
          <Roll h={52} style={{ width: 640 }} items={FACTS.map((f) => <div key={f.src} style={{ fontFamily: FONTS.latin, fontWeight: 600, fontSize: 28, color: SOFT, direction: "ltr", whiteSpace: "nowrap" }}>{f.src}</div>)} />
          <div style={txt(32, OR, 800)}>المصدر</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ bridge: both lines come out of the rule the card became
const Bridge: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = prog(frame, 54, 66, io);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: RULE_Y, left: 540 - (640 + 120 * grow) / 2, width: 640 + 120 * grow, height: 6 + 8 * grow, borderRadius: 7, background: grow > 0.5 ? OR : INK }} />
      <Rise at={2} y={636} style={txt(124)}>المعلومة سهلة…</Rise>
      <Rise at={54} y={836} from="above" style={txt(106, OR)}>التطبيق هو الصعب</Rise>
      <Rise at={74} y={1010} from="above" style={txt(58, SOFT, 700)}>تدرّج · مجموعات · بروتين… كل يوم</Rise>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ soft CTA: the flood lands on the logo mark
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = useS(8, { damping: 15, stiffness: 190, mass: 0.8 });
  const items = ["برنامج متدرّج على مستواك", "مجموعاتك محسوبة", "تغذيتك بالغرام"];
  return (
    <AbsoluteFill>
      <Glow x={540} y={520} r={560} opacity={0.3 * logo} color="#FFB08A" />
      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${0.6 + 0.4 * logo})`, transformOrigin: `${MARK[0]}px 68px`, opacity: Math.min(1, logo * 2) }}>
        <LogoLockup width={600} wordColor={INK} wordReveal={prog(frame, 12, 26)} />
      </div>
      <Rise at={22} y={600} style={txt(96)}>نرتّبها لك كلها</Rise>
      <div style={{ position: "absolute", top: 800, left: 150, right: 150, display: "flex", flexDirection: "column", gap: 22 }}>
        {items.map((t, i) => {
          const s = spring({ frame: frame - (74 + i * 24), fps, config: soft });
          return (
            <div key={t} style={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", gap: 22, background: "#FFFFFF", borderRadius: 28, padding: "24px 34px", boxShadow: "0 16px 50px rgba(120,70,30,0.14)", clipPath: `inset(0 0 0 ${(1 - s) * 100}% round 28px)` }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: OR, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 38, color: "#FFFFFF", transform: `scale(${s})` }}>✓</div>
              <div style={{ ...txt(50, INK, 800), textAlign: "right", flex: 1 }}>{t}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1270, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ background: INK, borderRadius: 70, padding: "26px 70px", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 76, color: "#FFFFFF", direction: "ltr", boxShadow: "0 24px 70px rgba(255,84,32,0.35)", clipPath: `inset(0 ${(1 - prog(frame, 163, 179, io)) * 50}% round 70px)` }}>reshape-online.com</div>
      </div>
    </AbsoluteFill>
  );
};

export const Study: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 55% at 50% 30%, #FFFFFF 0%, rgba(255,255,255,0) 70%), radial-gradient(ellipse 90% 50% at 50% 100%, #F6DCCB 0%, rgba(246,220,203,0) 70%)" }} />
    <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(23,24,26,0.10) 2px, transparent 2px)", backgroundSize: "54px 54px", opacity: 0.6 }} />
    <Sequence name="hook" from={T.hook} durationInFrames={T.myth - T.hook}><Hook /></Sequence>
    <Sequence name="myth" from={T.myth} durationInFrames={T.facts - T.myth}><Myth /></Sequence>
    <Sequence name="facts" from={T.facts} durationInFrames={T.bridge - T.facts}><Facts /></Sequence>
    <Sequence name="bridge" from={T.bridge} durationInFrames={T.cta - T.bridge}><Bridge /></Sequence>
    <Sequence name="cta" from={T.cta} durationInFrames={T.end - T.cta}><Cta /></Sequence>
    {/* scene-to-scene: a shape of one scene floods the frame and contracts into an object of the next */}
    <Flood at={T.myth} from={FIST} to={DUMB} color={OR} />
    <Flood at={T.facts} from={[730, 1000]} to={PILL} color={INK} r1={34} />
    <Flood at={T.cta} from={[540, RULE_Y]} to={MARK} color={RED} r1={0} />
    <Audio src={staticFile("audio/study/mix.wav")} />
    <Grain opacity={0.02} />
  </AbsoluteFill>
);
