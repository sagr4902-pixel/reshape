import { interpolatePath, scalePath, translatePath } from "@remotion/paths";
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { MARK_BOX, MARK_PATH } from "../../components/logoPaths";
import { KineticWords } from "../../components/KineticWords";
import { Athlete, P, deadlift, lerpPose } from "../Athlete";
import { MCOLORS } from "../design";
import { DrawPath, Glow, LayeredWord, Ring, SlantBar, clamp, easeInOut, prog } from "../kit";
import { mword } from "../timeline";

// SCENE 1 — THE HOOK (0.0–5.5 s). "مو كل تمرين يغيّرك… بس فيه تمرين… يعيد تشكيلك."
// The orange block literally *reshapes* into the RESHAPE mark, handing off to the logo reveal.

const w = (t: string, n = 0) => mword("hook", t, n);
const T = {
  mo: w("مو"),
  kul: w("كل"),
  tamreen: w("تمرين"),
  yughayyirak: w("يغيّرك"),
  bas: w("بس"),
  feeh: w("فيه"),
  tamreen2: w("تمرين", 1),
  yueed: w("يعيد"),
  tashkeelak: w("تشكيلك"),
};
const COPY1_OUT = T.bas - 12;
const COPY2_OUT = T.yueed - 6;

const CX = 540;
const FLOOR = 1390;

// morph: rigid square -> the authentic RESHAPE mark (shape unchanged, only scaled/centred)
const MARK_SCALE = 6.2;
const markCentered = translatePath(
  scalePath(translatePath(MARK_PATH, -(MARK_BOX.x + MARK_BOX.w / 2), -(MARK_BOX.y + MARK_BOX.h / 2)), MARK_SCALE, MARK_SCALE),
  CX,
  1080,
);
const square = (s: number) => `M${CX - s},${1080 - s} L${CX + s},${1080 - s} L${CX + s},${1080 + s} L${CX - s},${1080 + s} Z`;

export const M1Hook: React.FC = () => {
  const frame = useCurrentFrame();

  // athlete: appears with copy 2, does one heavy rep, then stands tall as he is "reshaped"
  const athleteIn = prog(frame, T.bas - 4, T.bas + 10);
  const repPhase = interpolate(frame, [T.bas, T.yueed], [0, 0.5], { ...clamp, easing: easeInOut });
  const toVictory = prog(frame, T.tashkeelak - 4, T.tashkeelak + 12);
  const pose = lerpPose(deadlift(repPhase), P.victory, toVictory);
  const athleteOut = prog(frame, 150, 160);

  // morphing block behind the athlete
  const morphIn = prog(frame, T.yueed - 6, T.yueed + 8);
  const morph = prog(frame, T.tashkeelak - 6, T.tashkeelak + 14, easeInOut);
  const blockPath = interpolatePath(morph, square(250), markCentered);
  const zoom = interpolate(frame, [148, 165], [1, 7], { ...clamp, easing: Easing.in(Easing.cubic) });
  const blockColor = morph > 0.5 ? MCOLORS.logoRed : MCOLORS.orange;

  return (
    <AbsoluteFill>
      {/* opening strike: a line cuts across, then the brand slant drops in */}
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <DrawPath d="M1120,980 L-40,980" at={2} dur={9} width={5} out={COPY1_OUT} />
        <DrawPath d="M1120,1010 L-40,1010" at={5} dur={9} width={2} stroke={MCOLORS.white} opacity={0.6} out={COPY1_OUT} />
      </svg>
      <SlantBar x={150} y={860} w={780} h={22} inAt={T.mo - 6} outAt={COPY1_OUT} />
      <SlantBar x={560} y={1060} w={360} h={160} inAt={T.yughayyirak - 2} outAt={COPY1_OUT} dur={8} />
      <SlantBar x={120} y={1250} w={240} h={40} inAt={T.yughayyirak + 2} outAt={COPY1_OUT} dur={8} color={MCOLORS.white} />
      {frame >= T.yughayyirak - 2 && frame < COPY1_OUT + 10 ? <Glow x={760} y={1140} r={420} opacity={0.3 * (1 - prog(frame, COPY1_OUT, COPY1_OUT + 10))} /> : null}
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <Ring x={540} y={760} at={T.yughayyirak} r0={60} r1={620} dur={20} width={8} />
      </svg>

      {/* COPY 1 */}
      <div style={{ position: "absolute", left: 115, width: 850, top: 470 }}>
        <KineticWords
          fontSize={150}
          out={COPY1_OUT}
          words={[
            { text: "مو", at: T.mo },
            { text: "كلّ", at: T.kul },
            { text: "تمرين…", at: T.tamreen },
          ]}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 650 }}>
        <LayeredWord text="يغيّرك" at={T.yughayyirak} size={270} color={MCOLORS.orange} echo={MCOLORS.white} out={COPY1_OUT} />
      </div>

      {/* the block that reshapes into the mark */}
      {morphIn > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <g transform={`translate(${CX} 1080) scale(${zoom * (0.6 + 0.4 * morphIn)}) translate(${-CX} -1080)`} opacity={morphIn}>
            <path d={blockPath} fill={blockColor} />
          </g>
        </svg>
      ) : null}

      {/* athlete */}
      {athleteIn > 0 && athleteOut < 1 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: 1 - athleteOut }}>
          <DrawPath d={`M140,${FLOOR} L940,${FLOOR}`} at={T.bas - 6} dur={12} width={4} stroke={MCOLORS.white} opacity={0.35} />
          <g style={{ clipPath: `inset(${(1 - athleteIn) * 100}% 0 0 0)` }}>
            <Athlete pose={pose} x={CX - 30} y={FLOOR} scale={2.6} prop={toVictory > 0.5 ? "none" : "plate"} />
          </g>
        </svg>
      ) : null}

      {/* COPY 2 */}
      <div style={{ position: "absolute", left: 115, width: 850, top: 330 }}>
        <KineticWords
          fontSize={120}
          style="blur"
          out={COPY2_OUT}
          words={[
            { text: "بس", at: T.bas },
            { text: "فيه", at: T.feeh },
            { text: "تمرين…", at: T.tamreen2 },
          ]}
        />
      </div>

      {/* COPY 3 */}
      <div style={{ position: "absolute", left: 115, width: 850, top: 300 }}>
        <KineticWords fontSize={130} out={146} words={[{ text: "يعيد", at: T.yueed }]} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 440 }}>
        <LayeredWord text="تشكيلك" at={T.tashkeelak} size={230} color={MCOLORS.orange} echo={MCOLORS.white} out={146} />
      </div>
    </AbsoluteFill>
  );
};
