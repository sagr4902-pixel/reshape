import React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { Lab } from "./cgi/Lab";
import { TypeTest } from "./components/TypeTest";
import { Commercial, SCENES } from "./Commercial";
import { Grain, Vignette } from "./components/Finish";
import { VIDEO } from "./lib/brand";
import { DURATION_FRAMES, scene } from "./lib/timeline";

// A single scene rendered in isolation (with the global finish), for look-dev and review.
const ScenePreview: React.FC<{ Component: React.FC }> = ({ Component }) => (
  <AbsoluteFill>
    <Component />
    <Grain />
    <Vignette strength={0.55} />
  </AbsoluteFill>
);

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ReshapeCommercial"
        component={Commercial}
        durationInFrames={DURATION_FRAMES}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{ safeArea: false }}
      />
      {SCENES.map(({ id, Component }) => (
        <Composition
          key={id}
          id={`Scene-${id}`}
          component={() => <ScenePreview Component={Component} />}
          durationInFrames={scene(id).duration}
          fps={VIDEO.fps}
          width={VIDEO.width}
          height={VIDEO.height}
        />
      ))}
      <Composition id="TypeTest" component={TypeTest} durationInFrames={1} fps={30} width={1080} height={1920} />
      <Composition id="Lab" component={Lab} durationInFrames={60} fps={30} width={1080} height={1920} defaultProps={{ shot: 0 }} />
    </>
  );
};
