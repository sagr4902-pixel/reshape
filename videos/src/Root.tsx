import React from 'react';
import {Composition} from 'remotion';
import {RigTest} from './films/reshape/RigTest';
import {Cover} from './films/reshape/Cover';
import {Film, ScenePreview} from './films/reshape/Film';
import {SCENES, TOTAL, type SceneId} from './films/reshape/timeline';

export const Root: React.FC = () => (
  <>
    <Composition id="ReshapeCampaign" component={Film} width={1080} height={1920} fps={30} durationInFrames={TOTAL} defaultProps={{withAudio: true}} />
    <Composition id="ReshapeFinal" component={Film} width={1080} height={1920} fps={30} durationInFrames={TOTAL} defaultProps={{withAudio: true, mixFile: 'audio/mix/reshape_mix.wav', blur: 1000}} />
    <Composition id="ReshapeBlurTest" component={Film} width={1080} height={1920} fps={30} durationInFrames={TOTAL} defaultProps={{withAudio: false, blur: 5}} />
    <Composition id="ReshapeSilent" component={Film} width={1080} height={1920} fps={30} durationInFrames={TOTAL} defaultProps={{withAudio: false}} />
    {(Object.keys(SCENES) as SceneId[]).map((id) => (
      <Composition key={id} id={`Scene${id}`} component={ScenePreview} width={1080} height={1920} fps={30}
        durationInFrames={SCENES[id].to - SCENES[id].from} defaultProps={{scene: id}} />
    ))}
    <Composition id="Cover" component={Cover} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="RigTest" component={RigTest} width={1080} height={1920} fps={30} durationInFrames={60} />
  </>
);
