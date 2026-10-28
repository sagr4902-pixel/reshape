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
 * f0-44    kettlebell formation (3x3) swinging phase-locked to the beat, low 3/4 push (drop flash)
 * f45-89   four pairs of battle ropes waving in sync, three-quarter side view, orange rim
 * f90-149  slam balls hitting the floor on every beat (dust puffs); crash at f120 cuts to floor level
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

      {/* ---- light & flashes on the hits */}
      <LightLeak from={0} to={36} intensity={0.32} y={28} />
      <LightLeak from={CRASH - 2} to={CRASH + 40} intensity={0.42} y={62} />
      <Flash at={0} peak={0.9} length={7} />
      <Flash at={45} peak={0.22} length={4} />
      <Flash at={SYNC_END} peak={0.3} length={5} />
      <Flash at={CRASH} peak={0.85} length={10} />
      {MONTAGE_CUTS.map((at) => (
        <Flash key={at} at={at} peak={0.26} length={4} />
      ))}
      {FILL_CUTS.map((at, i) => (
        <Flash key={at} at={at} peak={0.42} length={3} color={i % 2 ? COLORS.orange : COLORS.white} />
      ))}

      {/* ---- kinetic type: one card at a time, two stacked words, upper-middle of the safe area */}
      <Card from={0} to={CARD1_OUT + 10} out={CARD1_OUT} style="rise" line1={["حصص", VO.hisas]} line2={["جماعية", VO.jamaiya]} />
      <Card from={CARD1_OUT + 8} to={CARD2_OUT + 10} out={CARD2_OUT} style="rise" line1={["طاقة", VO.ajwaa]} line2={["أعلى", VO.hamasiya]} />
      <Card from={CARD2_OUT + 8} to={CARD3_OUT + 10} out={CARD3_OUT} style="slam" line1={["تحدٍّ", VO.tahaddi]} line2={["جديد", VO.yikhallik]} />

      {/* ---- white-out into the breakdown */}
      {white > 0.001 ? <AbsoluteFill style={{ background: "#fff6ef", opacity: white }} /> : null}
    </AbsoluteFill>
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
}> = ({ from, to, out, style, line1, line2 }) => (
  <Sequence from={from} durationInFrames={to - from} layout="none" name={`card ${line1[0]} ${line2[0]}`}>
    <div
      style={{
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
  </Sequence>
);
