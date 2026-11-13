import React from 'react';
import {Composition} from 'remotion';
import {RigTest} from './films/reshape/RigTest';
import {Cover} from './films/reshape/Cover';
import {Quiz} from './films/quiz/Quiz';
import {QuizCover} from './films/quiz/QuizCover';
import {Hype} from './films/hype/Hype';
import {TOTAL as HYPE_TOTAL} from './films/hype/timeline';
import {TOTAL as QUIZ_TOTAL} from './films/quiz/timeline';
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
    <Composition id="QuizV2" component={Quiz} width={1080} height={1920} fps={30} durationInFrames={QUIZ_TOTAL} defaultProps={{withAudio: true}} />
    <Composition id="QuizV2Silent" component={Quiz} width={1080} height={1920} fps={30} durationInFrames={QUIZ_TOTAL} defaultProps={{withAudio: false}} />
    <Composition id="QuizV2Final" component={Quiz} width={1080} height={1920} fps={30} durationInFrames={QUIZ_TOTAL} defaultProps={{withAudio: true, mixFile: 'audio/mix2/quiz_mix.wav', blur: 6}} />
    <Composition id="QuizCover" component={QuizCover} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="HypeV3" component={Hype} width={1080} height={1920} fps={30} durationInFrames={HYPE_TOTAL} defaultProps={{withAudio: true}} />
    <Composition id="HypeV3Silent" component={Hype} width={1080} height={1920} fps={30} durationInFrames={HYPE_TOTAL} defaultProps={{withAudio: false}} />
    <Composition id="HypeV3Final" component={Hype} width={1080} height={1920} fps={30} durationInFrames={HYPE_TOTAL} defaultProps={{withAudio: true, mixFile: 'audio/mix3/hype_mix.wav', blur: true}} />
    <Composition id="Cover" component={Cover} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="RigTest" component={RigTest} width={1080} height={1920} fps={30} durationInFrames={60} />
  </>
);
