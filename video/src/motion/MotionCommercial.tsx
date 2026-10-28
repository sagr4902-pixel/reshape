import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Grain } from "../components/Finish";
import { loadBrandFonts } from "../lib/fonts";
import { MCOLORS } from "./design";
import { Grid, SlantWipe } from "./kit";
import { M1Hook } from "./scenes/M1Hook";
import { M2Brand } from "./scenes/M2Brand";
import { M3Group } from "./scenes/M3Group";
import { M4Progress } from "./scenes/M4Progress";
import { M5Cta } from "./scenes/M5Cta";
import { MSceneId, mscene } from "./timeline";

loadBrandFonts();

export const M_SCENES: { id: MSceneId; Component: React.FC }[] = [
  { id: "hook", Component: M1Hook },
  { id: "brand", Component: M2Brand },
  { id: "group", Component: M3Group },
  { id: "transformation", Component: M4Progress },
  { id: "cta", Component: M5Cta },
];

/** Shared stage behind every scene: brand black, technical grid, soft vignette. */
export const Stage: React.FC = () => (
  <>
    <AbsoluteFill style={{ background: MCOLORS.black }} />
    <Grid />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)" }} />
  </>
);

/**
 * RESHAPE — premium motion-graphics version (35 s, 1080x1920, 30 fps).
 * Audio: Saudi voice-over + a handful of restrained non-musical SFX. NO MUSIC.
 */
export const MotionCommercial: React.FC = () => (
  <AbsoluteFill style={{ background: MCOLORS.black }}>
    <Stage />
    {M_SCENES.map(({ id, Component }) => {
      const s = mscene(id);
      return (
        <Sequence key={id} name={id} from={s.from} durationInFrames={s.duration}>
          <Component />
        </Sequence>
      );
    })}
    {/* slanted brand wipes over the scene cuts (brand -> group -> progress -> CTA) */}
    {(["group", "transformation", "cta"] as MSceneId[]).map((id) => (
      <SlantWipe key={id} at={mscene(id).from} />
    ))}
    <Grain opacity={0.035} />
    <Audio src={staticFile("audio/motion/vo.wav")} />
    <Audio src={staticFile("audio/motion/sfx.wav")} />
  </AbsoluteFill>
);
