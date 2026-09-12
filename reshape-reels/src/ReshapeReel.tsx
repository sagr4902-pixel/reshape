import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import { BEATS, CAPTION_DISPLAY, CAPTION_SUPPRESS, FOCUS, PUNCHES, REFRAMES, SFX, STRIKE_AT, sec } from './timeline';
import { loadReshapeFonts } from './fonts';
import { SafeArea } from './components/SafeArea';
import { PunchZoom } from './components/PunchZoom';
import { DynamicReframe } from './components/DynamicReframe';
import { FocusVignette } from './components/FocusVignette';
import { SoundCue } from './components/SoundCue';
import { WordCaption, CaptionGroup } from './components/WordCaption';
import { TopicTag } from './components/TopicTag';
import { VesselBloom } from './components/VesselBloom';
import { StruckClaim } from './components/StruckClaim';
import { EvidenceBars } from './components/EvidenceBars';
import { PointerTag } from './components/PointerTag';
import { SignOff } from './components/SignOff';

export type ReelProps = { captions: CaptionGroup[]; debugSafe?: boolean };

/** caption groups carrying the misconception, reused as display typography */
const CLAIM_LINES = { eyebrow: 8, lines: [[9], [10], [11]] };

const Beat: React.FC<{
  beat: { from: number; to: number };
  children: (d: number) => React.ReactNode;
}> = ({ beat, children }) => {
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
  const g = (i: number) => captions[i]?.words ?? [];

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Audio src={staticFile('voice.wav')} />
      {SFX.map((c, i) => (
        <SoundCue key={i} at={c.at} src={c.src} volume={c.volume} />
      ))}

      {/* speaker plate: reframe -> punch -> fit, with overscan so edges never show */}
      <DynamicReframe reframes={REFRAMES}>
        <PunchZoom punches={PUNCHES} originY="46%">
          <AbsoluteFill style={{ transform: 'scale(0.88)', transformOrigin: '50% 50%' }}>
            <OffthreadVideo
              src={staticFile('speaker.mp4')}
              muted
              style={{
                position: 'absolute',
                width: 1350,
                height: 2400,
                left: (width - 1350) / 2,
                top: (height - 2400) / 2,
              }}
            />
          </AbsoluteFill>
        </PunchZoom>
      </DynamicReframe>

      <FocusVignette windows={FOCUS} />

      <SafeArea debug={debugSafe}>
        <Beat beat={BEATS.topic}>
          {(d) => <TopicTag durationInFrames={d} kicker="الموضوع" title="تمرين وزن الجسم" />}
        </Beat>

        <Beat beat={BEATS.vessel}>{(d) => <VesselBloom durationInFrames={d} />}</Beat>

        <Beat beat={BEATS.claim}>
          {(d) => (
            <StruckClaim
              durationInFrames={d}
              strikeAt={STRIKE_AT - BEATS.claim.from}
              eyebrow={g(CLAIM_LINES.eyebrow).map((w) => w.w).join(' ')}
              lines={CLAIM_LINES.lines.map((ids) =>
                ids.flatMap(g).map((w) => ({ ...w, s: w.s - BEATS.claim.from, e: w.e - BEATS.claim.from })),
              )}
            />
          )}
        </Beat>

        <Beat beat={BEATS.pointer}>
          {(d) => (
            <PointerTag
              durationInFrames={d}
              label="أبو صقر"
              x={128}
              y={520}
              d="M 300 585 L 398 585 L 500 892"
              dot={[500, 892]}
            />
          )}
        </Beat>

        <Beat beat={BEATS.evidence}>{(d) => <EvidenceBars durationInFrames={d} />}</Beat>
        <Beat beat={BEATS.signOff}>{(d) => <SignOff durationInFrames={d} />}</Beat>

        <WordCaption groups={captions} suppress={CAPTION_SUPPRESS} display={CAPTION_DISPLAY} />
      </SafeArea>
    </AbsoluteFill>
  );
};
