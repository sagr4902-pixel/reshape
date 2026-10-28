import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, random, Sequence, useCurrentFrame } from "remotion";
import { Flash, LightLeak } from "../components/Finish";
import { FootageSlot } from "../components/FootageSlot";
import { KineticWords } from "../components/KineticWords";
import { COLORS } from "../lib/brand";
import { RepShot } from "./transformation/RepShot";
import { StairShot } from "./transformation/StairShot";
import { BLACK_FROM, CUT_REP, REP_NOTES, VO } from "./transformation/timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Line 1 lands word by word from مهما; بداية lands on the 2nd bell note. */
const L1 = { kull: VO.mahma, mustawa: VO.mahma + 5, lahu: VO.mahma + 9, bidaya: 23 };
/** Line 1 steps back to secondary just before line 2 arrives. */
const L1_DIM = 40;
const L2 = { wabidayatak: 45, huna: VO.huna };
const TEXT_OUT = 108;

/**
 * Scene "transformation" (20.0-26.0 s, 180 frames) - "every level has a beginning".
 * f0-119   transformation_push: plate-stack staircase, a warm light climbs one step per bell note
 *          while the camera cranes up alongside; type: "كلّ مستوى له بداية" / "وبدايتك هنا".
 * f120-174 transformation_finish: slow-motion final rep, barbell rising from a low angle,
 *          light building with the snare roll.
 * f175-179 black (near-silence before the drop).
 */
export const SceneTransformation: React.FC = () => {
  const frame = useCurrentFrame();

  // ---- rep shot: bell pulses + build
  const pulse = REP_NOTES.reduce((acc, at) => acc + (frame >= at ? Math.exp(-(frame - at) / 8) : 0), 0);
  const build = interpolate(frame, [CUT_REP, BLACK_FROM - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });

  // ---- type: line 1 becomes the warm kicker above line 2
  const dim = interpolate(frame, [L1_DIM, L1_DIM + 12], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const l1Color = interpolateColors(dim, [0, 1], [COLORS.white, COLORS.warm]);
  const l1Accent = interpolateColors(dim, [0, 1], [COLORS.orange, COLORS.warm]);

  return (
    <AbsoluteFill style={{ background: "#0b0b0d", overflow: "hidden" }}>
      {/* ---------- shot 1: the staircase */}
      <Sequence durationInFrames={CUT_REP} name="push: plate staircase">
        <FootageSlot slot="transformation_push">
          <StairShot frame={frame} />
        </FootageSlot>
        {/* scrim behind the type (upper safe area) */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(9,9,11,0.78) 0%, rgba(9,9,11,0.55) 22%, rgba(9,9,11,0.25) 38%, rgba(9,9,11,0) 50%)",
          }}
        />
      </Sequence>

      {/* ---------- shot 2: slow-motion final rep */}
      <Sequence from={CUT_REP} durationInFrames={BLACK_FROM - CUT_REP} name="finish: final rep">
        <FootageSlot slot="transformation_finish">
          <AbsoluteFill
            style={{
              filter: `brightness(${1 + build * 0.25})`,
              // the snare roll: a faint tremor that grows with the build
              transform: `translate(${(random(`tx${frame}`) - 0.5) * 7 * build ** 2}px, ${(random(`ty${frame}`) - 0.5) * 7 * build ** 2}px) scale(1.01)`,
            }}
          >
            <RepShot f={frame - CUT_REP} pulse={Math.min(1, pulse)} build={build} />
          </AbsoluteFill>
        </FootageSlot>
        {/* the build: overhead light floods down into frame before the silence */}
        <AbsoluteFill
          style={{
            background: "linear-gradient(180deg, rgba(255,236,220,1) 0%, rgba(255,170,120,0.75) 30%, rgba(255,110,60,0.25) 60%, rgba(0,0,0,0) 85%)",
            mixBlendMode: "screen",
            opacity: interpolate(frame, [160, BLACK_FROM - 1], [0, 0.8], { ...clamp, easing: Easing.in(Easing.cubic) }),
          }}
        />
      </Sequence>

      {/* ---------- type */}
      <div style={{ position: "absolute", left: 115, right: 115, top: 300 }}>
        <div
          style={{
            transform: `translateY(${-dim * 40}px) scale(${1 - dim * 0.22})`,
            transformOrigin: "50% 0%",
          }}
        >
          <KineticWords
            fontSize={150}
            style="rise"
            color={l1Color}
            out={TEXT_OUT}
            lineHeight={1.15}
            words={[
              { text: "كلّ", at: L1.kull },
              { text: "مستوى", at: L1.mustawa },
              { text: "له", at: L1.lahu },
              { text: "بداية", at: L1.bidaya, color: l1Accent },
            ]}
          />
        </div>
      </div>
      <div style={{ position: "absolute", left: 115, right: 115, top: 640 }}>
        <KineticWords
          fontSize={155}
          gap={0.24}
          style="blur"
          out={TEXT_OUT + 2}
          words={[
            { text: "وبدايتك", at: L2.wabidayatak },
            { text: "هنا", at: L2.huna, color: COLORS.orange },
          ]}
        />
      </div>

      {/* ---------- accents */}
      {/* the group scene ends on a white-out: fade down out of it instead of snapping to dark */}
      <Flash at={0} color="#fff1e6" peak={0.75} length={9} />
      <LightLeak from={52} to={112} intensity={0.32} y={62} />
      <Flash at={CUT_REP} color="#ffb98f" peak={0.2} length={7} />
      {REP_NOTES.slice(1).map((at) => (
        <Flash key={at} at={at} color="#ff9a5c" peak={0.12} length={6} />
      ))}
      <LightLeak from={138} to={176} intensity={0.4} y={36} />

      {/* ---------- silence before the drop */}
      {frame >= BLACK_FROM ? <AbsoluteFill style={{ background: "#000" }} /> : null}
    </AbsoluteFill>
  );
};
