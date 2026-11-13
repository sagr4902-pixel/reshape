import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ensureFonts} from '../../kit/fonts';
import {Grain} from '../../kit/Stage';
import {Mosaic, SECTION_COMPONENTS} from './sections';
import {Q} from './style';
import {AT, blurAt, FPS, LINES, SEC, SEQ_IDS} from './timeline';

ensureFonts();

const renderSection = (id: string, frame: number) => {
  const C = SECTION_COMPONENTS[id];
  return C ? <C f={frame} /> : null;
};

/** Every section whose window contains f (later sections on top). */
export const QuizScenes: React.FC<{f: number}> = ({f}) => (
  <>
    {(Object.keys(SEC) as Array<keyof typeof SEC>).map((id) => {
      const w = SEC[id];
      if (f < w.from || f >= w.to) return null;
      if (id === 'mosaic') return <Mosaic key={id} f={f} render={renderSection} />;
      const C = SECTION_COMPONENTS[id];
      return <C key={id} f={f} />;
    })}
  </>
);

const Now: React.FC = () => {
  const f = useCurrentFrame();
  return <QuizScenes f={f} />;
};

export const Quiz: React.FC<{withAudio?: boolean; mixFile?: string; blur?: number}> = ({withAudio = true, mixFile, blur = 0}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: Q.paper}}>
      {blur > 1 && blurAt(f) > 1 ? (
        <CameraMotionBlur shutterAngle={160} samples={blurAt(f)}>
          <AbsoluteFill style={{background: Q.paper}}><Now /></AbsoluteFill>
        </CameraMotionBlur>
      ) : (
        <Now />
      )}
      <Grain frame={Math.floor(f / 2)} opacity={0.1} />
      {withAudio && mixFile ? <Audio src={staticFile(mixFile)} /> : null}
      {withAudio && !mixFile
        ? SEQ_IDS.map((id) => (
            <Sequence key={id} from={AT[id]} durationInFrames={Math.ceil(LINES[id].duration * FPS) + 4}>
              <Audio src={staticFile(LINES[id].file)} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};
