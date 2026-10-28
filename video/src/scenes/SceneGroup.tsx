import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Flash, LightLeak } from "../components/Finish";
import { FootageSlot } from "../components/FootageSlot";
import { KineticWords } from "../components/KineticWords";
import { COLORS } from "../lib/brand";
import { local, wordAt } from "../lib/timeline";
import { GroupCgi, type Hit } from "./group/GroupCgi";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// VO word landings (frames relative to the scene start, 12.0 s)
const VO = {
  hisas: local("group", wordAt("حصص")), // 14
  jamaiya: local("group", wordAt("جماعية")), // 24
  ajwaa: local("group", wordAt("أجواء")), // 47
  hamasiya: local("group", wordAt("حماسية")), // 62
  tahaddi: local("group", wordAt("وتحدّي")), // 89
  yikhallik: local("group", wordAt("يخلّيك")), // 107
};

const SYNC_END = 90; // group_sync -> group_energy
const CRASH = 120; // crash cymbal, 16.0 s
const FILL = 210; // tom fill, 19.0-20.0 s
const END = 240;

// Card timing: each card is fully gone (8 f exit) before the next one lands.
const CARD1_OUT = VO.ajwaa - 10;
const CARD2_OUT = VO.tahaddi - 10;
const CARD3_OUT = 172;

const HITS: Hit[] = [
  { at: 0, amount: 30, decay: 9 },
  { at: 90, amount: 10, decay: 4 },
  { at: 105, amount: 10, decay: 4 },
  { at: CRASH, amount: 36, decay: 9 },
  { at: 135, amount: 12, decay: 4 },
  { at: 180, amount: 12, decay: 4 },
  { at: 210, amount: 14, decay: 3 },
  { at: 225, amount: 16, decay: 3 },
];

// Type block: two stacked lines, upper-middle of the safe area (x 90-940).
const TEXT_TOP = 300;
const TEXT_SIZE = 170;
const TEXT_LH = 1.02;
const TEXT_LEFT = 90;
const TEXT_W = 850;

const MONTAGE_CUTS = [150, 165, 180, 195];
const FILL_CUTS = [FILL, 216, 222, 227, 231, 234];

/**
 * Scene "group" (12.0-20.0 s, 240 frames) - group energy shown as equipment moving in unison.
 * f0-44    kettlebell formation (3x4) swinging phase-locked to the beat; close 3/4 from just above
 *          the top of the swing so every handle reads open, contact shadows on the floor (drop flash)
 * f45-89   four pairs of battle ropes waving in sync, three-quarter side view, orange floor pool
 * f90-119  slam balls: two rows down an aisle (one-point perspective), every ball hits the floor
 *          on the beat (squash, contact shadow, shock ring, floor reflection)
 * f120-149 crash: floor-level hero on the front ball; the hit is a burst on the impact, below the type
 * f150-209 montage: new angle on every beat
 * f210-239 tom fill flash cuts, whip + white-out into the breakdown
 */
export const SceneGroup: React.FC = () => {
  const frame = useCurrentFrame();

  // scrim behind the type follows the cards
  const cardOn = interpolate(frame, [VO.hisas - 6, VO.hisas + 4, CARD3_OUT, CARD3_OUT + 10], [0, 1, 1, 0], clamp);

  // whip + white-out into the breakdown
  const whip = interpolate(frame, [234, END - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const white = interpolate(frame, [231, END - 1], [0, 0.94], { ...clamp, easing: Easing.in(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: "#0b0b0d", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          filter: whip > 0.01 ? `blur(${whip * 14}px) brightness(${1 + whip * 0.6})` : undefined,
          transform: whip > 0.01 ? `scale(${1 + whip * 0.12})` : undefined,
        }}
      >
        <Sequence durationInFrames={SYNC_END} name="group_sync CGI">
          <FootageSlot slot="group_sync">
            <GroupCgi offset={0} hits={HITS} />
          </FootageSlot>
        </Sequence>
        <Sequence from={SYNC_END} durationInFrames={END - SYNC_END} name="group_energy CGI">
          <FootageSlot slot="group_energy">
            <GroupCgi offset={SYNC_END} hits={HITS} />
          </FootageSlot>
        </Sequence>
      </AbsoluteFill>

      {/* ---- grade: floor falls off to black towards the camera (and under the platform UI) */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,11,13,0) 68%, rgba(11,11,13,0.55) 88%, rgba(11,11,13,0.8) 100%)" }} />

      {/* ---- type scrim: darkens the upper-middle band only while a card is up */}
      <AbsoluteFill
        style={{
          opacity: cardOn,
          background: `radial-gradient(ellipse 80% 19% at 47.7% 29%, rgba(8,8,10,0.66), rgba(8,8,10,0) 100%),
            linear-gradient(180deg, rgba(11,11,13,0.45) 0%, rgba(11,11,13,0.2) 22%, rgba(11,11,13,0) 48%)`,
        }}
      />

      {/* ---- light & flashes on the hits: every whitening is <= 3 frames, then straight back to black.
           They sit UNDER the type, so the words keep full contrast through every hit. */}
      <LightLeak from={2} to={30} intensity={0.22} y={72} />
      {/* two stacked flashes = a hard 1-frame peak with a fast tail (f0 .8, f1 .13, f2 0) */}
      <Flash at={0} peak={0.55} length={1} />
      <Flash at={0} peak={0.25} length={2} />
      <Flash at={45} peak={0.16} length={2} />
      <Flash at={SYNC_END} peak={0.22} length={2} />
      <ImpactFlash at={CRASH} />
      {MONTAGE_CUTS.map((at) => (
        <Flash key={at} at={at} peak={0.16} length={2} />
      ))}
      {FILL_CUTS.map((at, i) => (
        <Flash key={at} at={at} peak={0.3} length={2} color={i % 2 ? COLORS.orange : COLORS.white} />
      ))}

      {/* ---- kinetic type: one card at a time, two stacked words, upper-middle of the safe area */}
      <Card from={0} to={CARD1_OUT + 10} out={CARD1_OUT} style="rise" line1={["حصص", VO.hisas]} line2={["جماعية", VO.jamaiya]} />
      <Card from={CARD1_OUT + 8} to={CARD2_OUT + 10} out={CARD2_OUT} style="rise" line1={["طاقة", VO.ajwaa]} line2={["أعلى", VO.hamasiya]} />
      <Card
        from={CARD2_OUT + 8}
        to={CARD3_OUT + 10}
        out={CARD3_OUT}
        style="slam"
        line1={["تحدٍّ", VO.tahaddi]}
        line2={["جديد", VO.yikhallik]}
        punch={CRASH}
      />

      {/* ---- white-out into the breakdown */}
      {white > 0.001 ? <AbsoluteFill style={{ background: "#fff6ef", opacity: white }} /> : null}
    </AbsoluteFill>
  );
};

/**
 * Crash hit: a hot burst centred on the floor impact (lower two thirds) instead of a full-frame
 * white-out, so the type zone stays dark. 1-frame peak, gone after 3 frames.
 */
const ImpactFlash: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const k = frame < at || frame > at + 2 ? 0 : [1, 0.38, 0.12][frame - at];
  if (k <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "screen",
        pointerEvents: "none",
        opacity: k,
        background: `radial-gradient(ellipse 95% 48% at 50% 74%, rgba(255,244,236,0.92) 0%, rgba(255,150,96,0.55) 45%, rgba(255,84,32,0.18) 70%, rgba(0,0,0,0) 100%)`,
      }}
    />
  );
};

/**
 * One type card: white word over orange word, each landing on its VO frame. All frames are
 * scene frames; the card lives in its own Sequence so it fully unmounts before the next one.
 */
const Card: React.FC<{
  from: number;
  to: number;
  out: number;
  style: "rise" | "slam";
  line1: [string, number];
  line2: [string, number];
  /** scene frame of a music hit: the settled card kicks once (scale punch) */
  punch?: number;
}> = ({ from, to, out, style, line1, line2, punch }) => (
  <Sequence from={from} durationInFrames={to - from} layout="none" name={`card ${line1[0]} ${line2[0]}`}>
    <CardBody from={from} out={out} style={style} line1={line1} line2={line2} punch={punch} />
  </Sequence>
);

const CardBody: React.FC<{
  from: number;
  out: number;
  style: "rise" | "slam";
  line1: [string, number];
  line2: [string, number];
  punch?: number;
}> = ({ from, out, style, line1, line2, punch }) => {
  const lf = useCurrentFrame(); // relative to the card's Sequence
  const k = punch === undefined || lf + from < punch ? 0 : Math.exp(-(lf + from - punch) / 3.5);
  return (
    <div
      style={{
        transform: k > 0.002 ? `scale(${1 + 0.07 * k})` : undefined,
        transformOrigin: `50% ${TEXT_SIZE}px`,
        position: "absolute",
        left: TEXT_LEFT,
        width: TEXT_W,
        top: TEXT_TOP,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <KineticWords fontSize={TEXT_SIZE} lineHeight={TEXT_LH} style={style} out={out - from} words={[{ text: line1[0], at: line1[1] - from }]} />
      <div style={{ marginTop: -TEXT_SIZE * 0.2 }}>
        <KineticWords
          fontSize={TEXT_SIZE}
          lineHeight={TEXT_LH}
          style={style}
          out={out - from}
          words={[{ text: line2[0], at: line2[1] - from, color: COLORS.orange }]}
        />
      </div>
    </div>
  );
};
