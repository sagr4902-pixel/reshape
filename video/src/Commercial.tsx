import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Grain, Vignette } from "./components/Finish";
import { COLORS } from "./lib/brand";
import { loadBrandFonts } from "./lib/fonts";
import { scene, SceneId } from "./lib/timeline";
import { SceneBrand } from "./scenes/SceneBrand";
import { SceneCta } from "./scenes/SceneCta";
import { SceneGroup } from "./scenes/SceneGroup";
import { SceneHook } from "./scenes/SceneHook";
import { SceneTransformation } from "./scenes/SceneTransformation";

loadBrandFonts();

export const SCENES: { id: SceneId; Component: React.FC }[] = [
  { id: "hook", Component: SceneHook },
  { id: "brand", Component: SceneBrand },
  { id: "group", Component: SceneGroup },
  { id: "transformation", Component: SceneTransformation },
  { id: "cta", Component: SceneCta },
];

/** The 35 s RESHAPE in-club group training commercial (1080x1920, 30 fps). */
export const Commercial: React.FC<{ safeArea?: boolean }> = ({ safeArea = false }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      {SCENES.map(({ id, Component }) => {
        const s = scene(id);
        return (
          <Sequence key={id} name={id} from={s.from} durationInFrames={s.duration}>
            <Component />
          </Sequence>
        );
      })}
      <Grain />
      <Vignette strength={0.55} />
      <Audio src={staticFile("audio/vo.wav")} />
      <Audio src={staticFile("audio/music.wav")} />
      <Audio src={staticFile("audio/sfx.wav")} />
      {safeArea ? <SafeAreaGuide /> : null}
    </AbsoluteFill>
  );
};

/** Debug overlay: platform UI zones that must stay free of key copy. */
export const SafeAreaGuide: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 250, background: "rgba(0,180,255,0.25)" }} />
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 380, background: "rgba(0,180,255,0.25)" }} />
    <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 90, background: "rgba(0,180,255,0.15)" }} />
    <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 140, background: "rgba(0,180,255,0.15)" }} />
  </AbsoluteFill>
);
