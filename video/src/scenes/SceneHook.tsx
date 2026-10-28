import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { Flash, LightLeak } from "../components/Finish";
import { FootageSlot } from "../components/FootageSlot";
import { KineticWords } from "../components/KineticWords";
import { COLORS } from "../lib/brand";
import { local, TIMELINE, wordAt } from "../lib/timeline";
import { MacroShot } from "./hook/MacroShot";
import { SlamShot } from "./hook/SlamShot";

// HOOK (0.0-6.0 s): black on the sub-boom -> macro of the knurled bar under a sweeping orange
// rim ("مو كلّ تمرين… يغيّرك") -> hard cut on the SLAM (2.5 s) to a loaded bar landing on the
// platform ("بس فيه تمرين…") -> low hero angle ("يعيد تشكيلك") plunging into the brand reveal.

const w = (text: string, occurrence = 0) => local("hook", wordAt(text, occurrence));
const SLAM = local("hook", TIMELINE.hits.hookSlam); // 75
// copy 1 clears right after "يغيّرك" so the bar can be lifted out of a clean frame before the slam
const COPY1_OUT = 60;

const T = {
  mo: w("مو"),
  kul: w("كل"),
  tamreen1: w("تمرين"),
  yughayyirak: w("يغيّرك"),
  bas: w("بس"),
  feeh: w("فيه"),
  tamreen2: w("تمرين", 1),
  yueed: w("يعيد"),
  tashkeelak: w("تشكيلك"),
};

const Block: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: "absolute", left: 115, width: 850, top }}>{children}</div>
);

/** Soft dark scrim behind the upper copy zone so type always reads over bright CGI. */
const Scrim: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.42) 22%, rgba(0,0,0,0.18) 40%, rgba(0,0,0,0) 52%)",
    }}
  />
);

/** Anamorphic flare that blooms through the whip in the last frames: hand-off to the logo hit. */
const ExitFlare: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [169, 179], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <AbsoluteFill
        style={{
          opacity: o,
          background: `radial-gradient(ellipse ${20 + 40 * o}% ${8 + 14 * o}% at 50% 50%, rgba(255,244,232,0.95) 0%, rgba(255,150,90,0.75) 30%, rgba(255,84,32,0.25) 65%, rgba(0,0,0,0) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 14,
          marginTop: -7,
          opacity: o,
          filter: "blur(5px)",
          background: "linear-gradient(90deg, rgba(255,84,32,0) 0%, rgba(255,170,120,0.9) 30%, rgba(255,250,240,1) 50%, rgba(255,170,120,0.9) 70%, rgba(255,84,32,0) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const SceneHook: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* SHOT 1 - knurl macro (frames 0-74; 0-8 stay black for the sub-boom) */}
      <Sequence durationInFrames={SLAM} name="hook_grip">
        <FootageSlot slot="hook_grip">
          <MacroShot />
        </FootageSlot>
      </Sequence>
      {/* SHOT 2 - the slam + hero angle (frames 75-179) */}
      <Sequence from={SLAM} name="hook_lift">
        <FootageSlot slot="hook_lift">
          <SlamShot />
        </FootageSlot>
      </Sequence>

      <Scrim />

      {/* hit accents */}
      <Flash at={SLAM} color={COLORS.white} peak={0.45} length={2} />
      <Flash at={SLAM} color={COLORS.orange} peak={0.22} length={3} />
      <LightLeak from={162} to={196} intensity={0.85} y={52} />
      <ExitFlare />

      {/* COPY 1 */}
      <Block top={330}>
        <KineticWords
          fontSize={116}
          out={COPY1_OUT}
          words={[
            { text: "مو", at: T.mo },
            { text: "كلّ", at: T.kul },
            { text: "تمرين…", at: T.tamreen1 },
          ]}
        />
        <div style={{ marginTop: -14 }}>
          <KineticWords fontSize={210} style="slam" out={COPY1_OUT} words={[{ text: "يغيّرك", at: T.yughayyirak, color: COLORS.orange }]} />
        </div>
      </Block>

      {/* COPY 2 */}
      <Block top={380}>
        <KineticWords
          fontSize={98}
          style="blur"
          out={102}
          words={[
            { text: "بس", at: T.bas },
            { text: "فيه", at: T.feeh },
            { text: "تمرين…", at: T.tamreen2 },
          ]}
        />
      </Block>

      {/* COPY 3 */}
      <Block top={330}>
        <KineticWords fontSize={140} out={163} words={[{ text: "يعيد", at: T.yueed }]} />
        <div style={{ marginTop: -18 }}>
          <KineticWords fontSize={204} style="slam" out={163} words={[{ text: "تشكيلك", at: T.tashkeelak, color: COLORS.orange }]} />
        </div>
      </Block>
    </AbsoluteFill>
  );
};
