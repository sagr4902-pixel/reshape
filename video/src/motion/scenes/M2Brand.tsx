import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { KineticWords } from "../../components/KineticWords";
import { LogoLockup, LogoMark } from "../../components/Logo";
import { FONTS } from "../../lib/brand";
import { Athlete, P, deadlift, run } from "../Athlete";
import { MCOLORS, SLANT } from "../design";
import { DrawPath, SlantBar, clamp, easeInOut, easeOut, prog } from "../kit";
import { mword } from "../timeline";
import { HOOK_MARK_CY, HOOK_MARK_SCALE } from "./M1Hook";

// SCENE 2 — RESHAPE INTRODUCTION (5.5–12.9 s)
// "في RESHAPE، كل حصّة هي خطوة جديدة… لقوّتك، ولياقتك، وثقتك بنفسك."

const w = (t: string, n = 0) => mword("brand", t, n);
const T = {
  brand: w("RESHAPE"),
  kul: w("كل", 1),
  hissa: w("حصّة"),
  hiya: w("هي"),
  khutwa: w("خطوة"),
  jadida: w("جديدة"),
  quwwa: w("لقوّتك"),
  liyaqa: w("ولياقتك"),
  thiqa: w("وثقتك"),
};
const LINE_OUT = T.quwwa - 8;
// the hook hands over the mark at 6.2 px per logo unit; the lockup starts at 780 px wide
const START_SCALE = (HOOK_MARK_SCALE * 389) / 780;
const END = 222;

/** Giant outlined Latin wordmark rows drifting in opposite directions (layered typography). */
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const o = prog(frame, 6, 30) * (1 - prog(frame, END - 20, END));
  const row = (y: number, dir: number, op: number) => (
    <div
      style={{
        position: "absolute",
        top: y,
        left: -400 + dir * frame * 2.2,
        whiteSpace: "nowrap",
        fontFamily: FONTS.latin,
        fontWeight: 800,
        fontStyle: "italic",
        fontSize: 250,
        lineHeight: 1,
        letterSpacing: "0.02em",
        color: "transparent",
        WebkitTextStroke: `2px rgba(255,255,255,${op})`,
      }}
    >
      RESHAPE RESHAPE RESHAPE RESHAPE
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {row(140, -1, 0.07)}
      {row(390, 1, 0.12)}
    </AbsoluteFill>
  );
};

const Panel: React.FC<{ x: number; at: number; label: string; children: React.ReactNode; accent?: boolean }> = ({ x, at, label, children, accent }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at - 3, at + 13, easeOut);
  const out = prog(frame, END - 16, END - 4, Easing.in(Easing.cubic));
  if (p <= 0) return null;
  const PW = 260;
  const PH = 480;
  return (
    <div style={{ position: "absolute", left: x, top: 720, width: PW, height: PH + 140, opacity: 1 - out, transform: `translateY(${out * 40}px)` }}>
      <div
        style={{
          position: "absolute",
          inset: `0 0 140px 0`,
          transform: `skewX(${SLANT}deg)`,
          background: "linear-gradient(180deg, #26272B 0%, #1C1D20 100%)",
          clipPath: `inset(${(1 - p) * 100}% 0 0 0)`,
          overflow: "hidden",
          borderTop: `6px solid ${accent ? MCOLORS.orange : MCOLORS.orange}`,
        }}
      >
        <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} style={{ transform: `skewX(${-SLANT}deg)` }}>
          {children}
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          top: PH + 18,
          left: -20,
          right: -20,
          textAlign: "center",
          direction: "rtl",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 74,
          color: MCOLORS.white,
          opacity: p,
          transform: `translateY(${(1 - p) * 30}px)`,
        }}
      >
        {label}
      </div>
      <div style={{ position: "absolute", top: PH + 122, left: PW / 2 - 40 * p, width: 80 * p, height: 6, background: MCOLORS.orange }} />
    </div>
  );
};

export const M2Brand: React.FC = () => {
  const frame = useCurrentFrame();

  // zoom-out reveal: the red mark that filled the screen at the end of the hook settles into
  // its lockup position, landing on the soft impact (LOGO_HIT)
  const settle = interpolate(frame, [0, 15], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const wordReveal = prog(frame, T.brand - 2, T.brand + 18, easeInOut);
  const lockY = interpolate(frame, [T.quwwa - 20, T.quwwa], [600, 470], { ...clamp, easing: easeInOut });
  const lockW = interpolate(frame, [T.quwwa - 20, T.quwwa], [780, 660], { ...clamp, easing: easeInOut });
  const lockOut = prog(frame, END - 16, END - 4, Easing.in(Easing.cubic));
  const markH = (lockW * 91) / 389;
  const markW = (markH * 95) / 91;

  const t = frame / 30;
  return (
    <AbsoluteFill>
      <Backdrop />

      {/* logo: full-screen red mark scales down into the lockup */}
      <div
        style={{
          position: "absolute",
          left: 540 - lockW / 2,
          top: lockY - markH / 2,
          width: lockW,
          opacity: 1 - lockOut,
          transform: `scale(${1 - lockOut * 0.1})`,
        }}
      >
        {wordReveal > 0 ? (
          <LogoLockup width={lockW} wordReveal={wordReveal} />
        ) : (
          <div
            style={{
              transform: `translate(${settle * (540 - (540 - lockW / 2 + markW / 2))}px, ${settle * (HOOK_MARK_CY - lockY)}px) scale(${1 + settle * (START_SCALE - 1)})`,
              transformOrigin: `${markW / 2}px ${markH / 2}px`,
            }}
          >
            <LogoMark height={markH} />
          </div>
        )}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: 1 - lockOut }}>
        <DrawPath d={`M${540 + 330},${lockY + 110} L${540 - 330},${lockY + 110}`} at={T.brand + 6} dur={16} width={4} />
      </svg>

      {/* "كلّ حصّة… خطوة جديدة" with a step graphic that builds on the VO */}
      <div style={{ position: "absolute", left: 115, width: 850, top: 760 }}>
        <KineticWords
          fontSize={66}
          weight={800}
          out={LINE_OUT}
          words={[
            { text: "كلّ", at: T.kul },
            { text: "حصّة…", at: T.hissa },
            { text: "خطوة", at: T.khutwa },
            { text: "جديدة", at: T.jadida, color: MCOLORS.orange },
          ]}
        />
      </div>
      {[T.hissa, T.hiya, T.khutwa, T.jadida].map((at, i) => (
        <SlantBar key={i} x={690 - i * 140} y={1010 - (22 + i * 30)} w={112} h={22 + i * 30} inAt={at} outAt={LINE_OUT} dur={8} color={i === 3 ? MCOLORS.orange : "rgba(255,255,255,0.85)"} from="right" />
      ))}

      {/* the triad: قوّة | لياقة | ثقة — right to left, each on its VO word */}
      <Panel x={710} at={T.quwwa} label="قوّة">
        <Athlete pose={deadlift(((frame - T.quwwa) / 34) % 1)} x={112} y={448} scale={1.12} prop="plate" bg="#1E1F22" />
      </Panel>
      <Panel x={410} at={T.liyaqa} label="لياقة">
        <Athlete pose={run(t * 1.6)} x={116} y={448} scale={1.1} bg="#1E1F22" trail={[run(t * 1.6 - 0.06), run(t * 1.6 - 0.12)]} />
      </Panel>
      <Panel x={110} at={T.thiqa} label="ثقة">
        <Athlete pose={P.victory} x={126} y={448} scale={0.98} bg="#1E1F22" rim={7} />
      </Panel>
    </AbsoluteFill>
  );
};
