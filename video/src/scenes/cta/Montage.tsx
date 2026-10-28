import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FootageSlot } from "../../components/FootageSlot";
import { KineticWords } from "../../components/KineticWords";
import { LogoMark } from "../../components/Logo";
import { COLORS } from "../../lib/brand";
import { ShotBarbellSlam, ShotFloorWide, ShotKettlebells, ShotLiftOff, ShotPlateLoad, ShotRopes, ShotSlamBall } from "./Shots";
import { CUTS, T } from "./timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const SHOTS: { name: string; C: React.FC }[] = [
  { name: "barbell slam", C: ShotBarbellSlam },
  { name: "kettlebells", C: ShotKettlebells },
  { name: "ropes", C: ShotRopes },
  { name: "slam ball", C: ShotSlamBall },
  { name: "lift-off", C: ShotLiftOff },
  { name: "plate load", C: ShotPlateLoad },
  { name: "floor wide", C: ShotFloorWide },
];

/** The CGI montage (hard cut every beat), wrapped in the footage slot so club footage can replace it. */
export const MontageCgi: React.FC = () => (
  <FootageSlot slot="cta_montage">
    <AbsoluteFill style={{ background: "#0b0b0d" }}>
      {SHOTS.map(({ name, C }, i) => (
        <Sequence key={name} name={name} from={CUTS[i]} durationInFrames={CUTS[i + 1] - CUTS[i]}>
          <C />
        </Sequence>
      ))}
    </AbsoluteFill>
  </FootageSlot>
);

/** Darkens the centre band while copy sits on it, so the type always reads over the CGI. */
export const CenterScrim: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [T.reshape - 1, T.reshape + 2], [0, 1], clamp);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: o,
        background:
          "radial-gradient(ellipse 95% 30% at 50% 47%, rgba(5,5,6,0.62) 0%, rgba(5,5,6,0.42) 45%, rgba(5,5,6,0) 100%)",
      }}
    />
  );
};

/** "ريشيب…" - the authentic mark punches in on the VO, held over a dimmed frame. */
export const MarkPunch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const at = T.reshape;
  const outAt = T.ghayyir - 9;
  if (frame < at || frame > outAt + 6) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 240, mass: 0.6 }, durationInFrames: 12 });
  const exit = interpolate(frame, [outAt, outAt + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const dim = interpolate(frame, [at, at + 1, outAt, outAt + 6], [0, 0.5, 0.4, 0], clamp);
  const scale = interpolate(s, [0, 1], [1.45, 1]) * (1 + exit * 0.25);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#060607", opacity: dim }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 60 }}>
        <div
          style={{
            transform: `scale(${scale})`,
            opacity: Math.min(1, s * 2) * (1 - exit),
            filter: `drop-shadow(0 18px 50px rgba(0,0,0,0.6))${exit > 0 ? ` blur(${exit * 12}px)` : ""}`,
          }}
        >
          <LogoMark height={330} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Block: React.FC<{ top: number; children: React.ReactNode }> = ({ top, children }) => (
  <div style={{ position: "absolute", left: 90, width: 850, top }}>{children}</div>
);

/** "غيّر أداءك" then "وارفع مستواك", word-synced to the VO, big and centred. */
export const MontageCopy: React.FC = () => (
  <>
    <Sequence from={T.ghayyir - 2} durationInFrames={T.warfa - T.ghayyir} layout="none">
      <Block top={640}>
        <KineticWords fontSize={150} style="rise" out={T.warfa - T.ghayyir - 10} words={[{ text: "غيّر", at: 2 }]} />
        <div style={{ marginTop: -40 }}>
          <KineticWords
            fontSize={222}
            style="slam"
            out={T.warfa - T.ghayyir - 10}
            words={[{ text: "أداءك", at: T.adaak - T.ghayyir + 2, color: COLORS.orange }]}
          />
        </div>
      </Block>
    </Sequence>
    <Sequence from={T.warfa - 2} layout="none">
      <Block top={640}>
        <KineticWords fontSize={150} style="rise" words={[{ text: "وارفع", at: 2 }]} />
        <div style={{ marginTop: -40 }}>
          <KineticWords fontSize={222} style="slam" words={[{ text: "مستواك", at: T.mustawak - T.warfa + 2, color: COLORS.orange }]} />
        </div>
      </Block>
    </Sequence>
  </>
);
