import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ensureFonts} from '../../kit/fonts';
import {Grain, Vignette} from '../../kit/Stage';
import {C} from '../../kit/theme';
import {blurSamplesAt, SCENES, voLines, type SceneId} from './timeline';
import {S1Hook} from './scenes/S1Hook';
import {S2Foundation} from './scenes/S2Foundation';
import {S3Building} from './scenes/S3Building';
import {S4Split} from './scenes/S4Split';
import {S5Facility} from './scenes/S5Facility';
import {S6Reveal} from './scenes/S6Reveal';

ensureFonts();

export type SceneProps = {f: number};
export const SCENE_COMPONENTS: Record<SceneId, React.FC<SceneProps>> = {
  S1: S1Hook, S2: S2Foundation, S3: S3Building, S4: S4Split, S5: S5Facility, S6: S6Reveal,
};

/** Renders every scene whose window contains frame f (later scenes on top). */
export const Scenes: React.FC<{f: number; only?: SceneId}> = ({f, only}) => (
  <>
    {(Object.keys(SCENES) as SceneId[]).map((id) => {
      if (only && id !== only) return null;
      const w = SCENES[id];
      if (f < w.from || f >= w.to) return null;
      const Comp = SCENE_COMPONENTS[id];
      return <Comp key={id} f={f} />;
    })}
  </>
);

/** Reads the (possibly fractional, motion-blur-shifted) frame itself. */
const ScenesNow: React.FC = () => {
  const f = useCurrentFrame();
  return <Scenes f={f} />;
};

export const Film: React.FC<{withAudio?: boolean; mixFile?: string; blur?: number}> = ({withAudio = true, mixFile, blur = 0}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.ink}}>
      {blur > 1 ? (
        <CameraMotionBlur shutterAngle={170} samples={blur === 1000 ? blurSamplesAt(f) : blur}>
          <AbsoluteFill style={{background: C.ink}}>
            <ScenesNow />
          </AbsoluteFill>
        </CameraMotionBlur>
      ) : (
        <ScenesNow />
      )}
      <Vignette strength={0.32} />
      <Grain frame={f} opacity={0.06} />
      {withAudio && mixFile ? <Audio src={staticFile(mixFile)} /> : null}
      {withAudio && !mixFile
        ? voLines().map((l) => (
            <Sequence key={l.id} from={l.at} durationInFrames={Math.ceil(l.duration * 30) + 6}>
              <Audio src={staticFile(l.file)} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};

/** Preview of one scene with its own frame range (for stills / review). */
export const ScenePreview: React.FC<{scene: SceneId}> = ({scene}) => {
  const local = useCurrentFrame();
  const f = SCENES[scene].from + local;
  return (
    <AbsoluteFill style={{background: C.ink}}>
      <Scenes f={f} only={scene} />
      <Grain frame={f} opacity={0.06} />
    </AbsoluteFill>
  );
};
