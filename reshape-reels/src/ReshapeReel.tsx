import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from './theme';
import { BEATS, PUNCHES, REFRAMES, SFX, sec } from './timeline';
import { loadReshapeFonts } from './fonts';
import { SafeArea } from './components/SafeArea';
import { PunchZoom } from './components/PunchZoom';
import { DynamicReframe } from './components/DynamicReframe';
import { SoundCue } from './components/SoundCue';
import { WordCaption, CaptionGroup } from './components/WordCaption';
import { HookCard } from './components/HookCard';
import { BloodFlowPopup } from './components/BloodFlowPopup';
import { ScientificStudyCard } from './components/ScientificStudyCard';
import { BrandEndCard } from './components/BrandEndCard';

export type ReelProps = { captions: CaptionGroup[]; debugSafe?: boolean };

const Beat: React.FC<{ beat: { from: number; to: number }; children: (d: number) => React.ReactNode }> = ({
  beat,
  children,
}) => {
  const d = sec(beat.to) - sec(beat.from);
  return (
    <Sequence from={sec(beat.from)} durationInFrames={d} layout="none">
      {children(d)}
    </Sequence>
  );
};

export const ReshapeReel: React.FC<ReelProps> = ({ captions, debugSafe = false }) => {
  loadReshapeFonts();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* ---------- audio ---------- */}
      <Audio src={staticFile('voice.wav')} />
      {SFX.map((c, i) => (
        <SoundCue key={i} at={c.at} src={c.src} volume={c.volume} />
      ))}

      {/* ---------- speaker layer: reframe -> punch -> fit ---------- */}
      <DynamicReframe reframes={REFRAMES}>
        <PunchZoom punches={PUNCHES} originY="46%">
          <AbsoluteFill style={{ transform: 'scale(0.88)', transformOrigin: '50% 50%' }}>
            <OffthreadVideo
              src={staticFile('speaker.mp4')}
              muted
              style={{ position: 'absolute', width: 1350, height: 2400, left: (width - 1350) / 2, top: (height - 2400) / 2 }}
            />
          </AbsoluteFill>
        </PunchZoom>
      </DynamicReframe>

      {/* ---------- graphics layer ---------- */}
      <SafeArea debug={debugSafe}>
        <Beat beat={BEATS.hook}>{(d) => <HookCard durationInFrames={d} />}</Beat>
        <Beat beat={BEATS.bloodFlow}>{(d) => <BloodFlowPopup durationInFrames={d} />}</Beat>
        <Beat beat={BEATS.study}>{(d) => <ScientificStudyCard durationInFrames={d} />}</Beat>
        <Beat beat={BEATS.outro}>{(d) => <BrandEndCard durationInFrames={d} />}</Beat>

        {/* captions sit above the panels in z-order but below them in the frame */}
        <WordCaption groups={captions} />
      </SafeArea>
    </AbsoluteFill>
  );
};
