import React from "react";
import { CalculateMetadataFunction, Composition, Folder } from "remotion";
import { Ad } from "./Ad";
import { ensureBrandFonts } from "./brand/fonts";
import { Timeline } from "./lib/timeline";
import { getTemplate, TEMPLATES } from "./templates";
import defaultTimeline from "../public/jobs/brand-launch-01/timeline.json";

ensureBrandFonts();

type AdProps = { timeline: Timeline; muted?: boolean };

const calculateAdMetadata: CalculateMetadataFunction<AdProps> = ({ props }) => ({
  durationInFrames: props.timeline.durationInFrames,
  fps: props.timeline.fps,
  width: props.timeline.width,
  height: props.timeline.height,
});

const sample = defaultTimeline as unknown as Timeline;

/** One scene of a timeline, standalone — used by the template library and the contact sheet. */
const SceneOnly: React.FC<{ timeline: Timeline; sceneId: string }> = ({ timeline, sceneId }) => {
  const scene = timeline.scenes.find((s) => s.id === sceneId) ?? timeline.scenes[0];
  const Template = getTemplate(scene.template);
  return <Template cues={scene.cues} words={scene.words} durationInFrames={scene.durationInFrames} {...scene.props} />;
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Ad"
        component={Ad}
        defaultProps={{ timeline: sample, muted: false } as AdProps}
        calculateMetadata={calculateAdMetadata}
        durationInFrames={sample.durationInFrames}
        fps={sample.fps}
        width={sample.width}
        height={sample.height}
      />
      <Folder name="Template-Library">
        {Object.keys(TEMPLATES).map((templateId) => {
          const scene = sample.scenes.find((s) => s.template === templateId);
          if (!scene) return null;
          return (
            <Composition
              key={templateId}
              id={`T-${templateId}`}
              component={SceneOnly}
              defaultProps={{ timeline: sample, sceneId: scene.id }}
              durationInFrames={scene.durationInFrames}
              fps={sample.fps}
              width={sample.width}
              height={sample.height}
            />
          );
        })}
      </Folder>
    </>
  );
};
