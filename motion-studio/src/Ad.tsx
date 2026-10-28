import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { color } from "./brand/tokens";
import { SlantReveal } from "./components/SlantReveal";
import { Timeline } from "./lib/timeline";
import { getTemplate } from "./templates";

/**
 * Renders a full advertisement from a timeline (scripts/build-timeline.ts).
 * Scenes overlap by `transitionFrames`; the incoming scene is wiped in on the
 * brand slant. Audio is a single pre-mixed track (scripts/mix-audio.ts) so the
 * Studio preview and the final render sound identical.
 */
export const Ad: React.FC<{ timeline: Timeline; muted?: boolean }> = ({ timeline, muted = false }) => {
  const T = timeline.transitionFrames;
  return (
    <AbsoluteFill style={{ backgroundColor: color.ink }}>
      {timeline.scenes.map((scene, i) => {
        const Template = getTemplate(scene.template);
        const isLast = i === timeline.scenes.length - 1;
        return (
          <Sequence
            key={scene.id}
            name={`${String(i + 1).padStart(2, "0")} ${scene.id} · ${scene.template}`}
            from={scene.from}
            durationInFrames={scene.durationInFrames + (isLast ? 0 : T)}
            premountFor={30}
          >
            <SlantReveal length={T} enabled={i > 0}>
              <Template cues={scene.cues} words={scene.words} durationInFrames={scene.durationInFrames} {...scene.props} />
            </SlantReveal>
          </Sequence>
        );
      })}
      {!muted && timeline.audio.mix ? <Audio src={staticFile(timeline.audio.mix)} /> : null}
      {!muted && !timeline.audio.mix ? <Audio src={staticFile(timeline.audio.voice)} /> : null}
    </AbsoluteFill>
  );
};
