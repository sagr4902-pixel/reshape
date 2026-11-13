import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {clockWipe} from '@remotion/transitions/clock-wipe';
import {flip} from '@remotion/transitions/flip';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ensureFonts} from '../../kit/fonts';
import {Grain} from '../../kit/Stage';
import {FinaleScene, FlashScene, HandstandScene, HomeVideo, KidsScene, LeverScene, PillsScene, PullUpScene} from './scenes';
import {AT, CUTS, LINES, TOTAL, TR, type VId} from './timeline';

ensureFonts();

/** Sequence starts (absolute) for each scene; transitions overlap the end of one scene and the start of the next. */
const SEQ = [
  {id: 'a', start: 0, end: CUTS.drop, C: HomeVideo},
  {id: 'b', start: CUTS.drop, end: CUTS.toHand, C: PullUpScene},
  {id: 'c', start: CUTS.toHand - TR.toHand, end: CUTS.toLever, C: HandstandScene},
  {id: 'd', start: CUTS.toLever - TR.toLever, end: CUTS.toFlash, C: LeverScene},
  {id: 'e', start: CUTS.toFlash, end: CUTS.toKids, C: FlashScene},
  {id: 'f', start: CUTS.toKids - TR.toKids, end: CUTS.toPills, C: KidsScene},
  {id: 'g', start: CUTS.toPills - TR.toPills, end: CUTS.toFinale, C: PillsScene},
  {id: 'h', start: CUTS.toFinale, end: TOTAL, C: FinaleScene},
] as const;

const renderAt = (id: string, F: number) => {
  const s = SEQ.find((x) => x.id === id);
  if (!s || id === 'g') return null;
  const Comp = s.C as React.FC<{F: number}>;
  return <Comp F={F} />;
};

const Scene: React.FC<{start: number; C: React.FC<any>}> = ({start, C}) => {
  const f = useCurrentFrame();
  return <C F={f + start} render={renderAt} />;
};

export const HypeCut: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={SEQ[0].end - SEQ[0].start} premountFor={30}><Scene start={SEQ[0].start} C={SEQ[0].C} /></TransitionSeries.Sequence>
    <TransitionSeries.Sequence durationInFrames={SEQ[1].end - SEQ[1].start} premountFor={30}><Scene start={SEQ[1].start} C={SEQ[1].C} /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({direction: 'from-right'})} timing={linearTiming({durationInFrames: TR.toHand})} />
    <TransitionSeries.Sequence durationInFrames={SEQ[2].end - SEQ[2].start} premountFor={30}><Scene start={SEQ[2].start} C={SEQ[2].C} /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={flip({direction: 'from-left'})} timing={linearTiming({durationInFrames: TR.toLever})} />
    <TransitionSeries.Sequence durationInFrames={SEQ[3].end - SEQ[3].start} premountFor={30}><Scene start={SEQ[3].start} C={SEQ[3].C} /></TransitionSeries.Sequence>
    <TransitionSeries.Sequence durationInFrames={SEQ[4].end - SEQ[4].start} premountFor={30}><Scene start={SEQ[4].start} C={SEQ[4].C} /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: TR.toKids})} />
    <TransitionSeries.Sequence durationInFrames={SEQ[5].end - SEQ[5].start} premountFor={30}><Scene start={SEQ[5].start} C={SEQ[5].C} /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={clockWipe({width: 1080, height: 1920})} timing={linearTiming({durationInFrames: TR.toPills})} />
    <TransitionSeries.Sequence durationInFrames={SEQ[6].end - SEQ[6].start} premountFor={30}><Scene start={SEQ[6].start} C={SEQ[6].C} /></TransitionSeries.Sequence>
    <TransitionSeries.Sequence durationInFrames={SEQ[7].end - SEQ[7].start} premountFor={30}><Scene start={SEQ[7].start} C={SEQ[7].C} /></TransitionSeries.Sequence>
  </TransitionSeries>
);

/** Motion blur only around cuts and impacts. */
const BLUR_WINDOWS: Array<[number, number]> = [
  [CUTS.drop - 8, CUTS.drop + 8], [CUTS.toHand - 10, CUTS.toHand + 2], [CUTS.toLever - 12, CUTS.toLever + 2], [CUTS.toKids - 11, CUTS.toKids + 2],
  [CUTS.toPills - 14, CUTS.toPills + 4], [96, 110], [CUTS.toFinale + 36, CUTS.toFinale + 76],
];
const blurAt = (f: number) => (BLUR_WINDOWS.some(([a, b]) => f >= a && f <= b) ? 6 : 1);

export const Hype: React.FC<{withAudio?: boolean; mixFile?: string; blur?: boolean}> = ({withAudio = true, mixFile, blur = false}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {blur && blurAt(f) > 1 ? (
        <CameraMotionBlur shutterAngle={170} samples={blurAt(f)}><HypeCut /></CameraMotionBlur>
      ) : (
        <HypeCut />
      )}
      <Grain frame={f} opacity={0.06} />
      {withAudio && mixFile ? <Audio src={staticFile(mixFile)} /> : null}
      {withAudio && !mixFile
        ? (Object.keys(AT) as VId[]).map((id) => (
            <Sequence key={id} from={AT[id]} durationInFrames={Math.ceil(LINES[id].duration * 30) + 4}>
              <Audio src={staticFile(LINES[id].file)} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};
