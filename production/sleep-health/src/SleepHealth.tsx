import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {BRAND} from './brand';
import {loadBrandFonts} from './fonts';
import {SCENES} from './timeline';
import {Background} from './components/Background';
import {Scene} from './components/Scene';
import {Subtitles} from './components/Subtitles';
import {Hook} from './scenes/Hook';
import {BrainScene} from './scenes/Brain';
import {ImmuneScene} from './scenes/Immune';
import {HeartScene} from './scenes/HeartScene';
import {RegularScene} from './scenes/Regular';
import {AdviceScene} from './scenes/Advice';
import {FinaleScene} from './scenes/Finale';

export const SleepHealth: React.FC = () => {
  loadBrandFonts();
  return (
    <AbsoluteFill style={{background: BRAND.ink, overflow: 'hidden'}}>
      <Audio src={staticFile('audio/mix.wav')} />
      <Background />
      <Scene range={SCENES.hook}><Hook /></Scene>
      <Scene range={SCENES.brain}><BrainScene /></Scene>
      <Scene range={SCENES.immune}><ImmuneScene /></Scene>
      <Scene range={SCENES.heart}><HeartScene /></Scene>
      <Scene range={SCENES.regular}><RegularScene /></Scene>
      <Scene range={SCENES.advice}><AdviceScene /></Scene>
      <Scene range={SCENES.finale} exit={0.01}><FinaleScene /></Scene>
      <Subtitles />
    </AbsoluteFill>
  );
};
