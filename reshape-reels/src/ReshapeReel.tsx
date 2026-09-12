import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import {
  BEATS_M, CAPTION_DISPLAY, CAPTION_SUPPRESS, COLD_OPEN_S, COLD_SFX, EDGE, FOCUS, FREEZE,
  ISOLATE, PLATE_USED, PUNCHES, REFRAMES, SFX, STRIKE_AT, TAIL, sec, shiftT,
} from './timeline';
import { loadReshapeFonts } from './fonts';
import { SafeArea } from './components/SafeArea';
import { PunchZoom, punchAt } from './components/PunchZoom';
import { DynamicReframe, reframeAt } from './components/DynamicReframe';
import { FocusVignette } from './components/FocusVignette';
import { HeroIsolate, EdgeGlow } from './components/HeroIsolate';
import { FlexBeat } from './components/FlexBeat';
import { ColdOpen } from './components/ColdOpen';
import { SoundCue } from './components/SoundCue';
import { WordCaption, CaptionGroup } from './components/WordCaption';
import { TopicTag } from './components/TopicTag';
import { VesselBloom } from './components/VesselBloom';
import { StruckClaim } from './components/StruckClaim';
import { EvidenceBars } from './components/EvidenceBars';
import { PointerTag } from './components/PointerTag';
import { SignOff } from './components/SignOff';
import type { TrackRec } from './plate';

export type ReelProps = { captions: CaptionGroup[]; track: TrackRec[]; debugSafe?: boolean };

const CLAIM_LINES = { eyebrow: 8, lines: [[9], [10], [11]] };

const Beat: React.FC<{ beat: { from: number; to: number }; children: (d: number) => React.ReactNode }> = ({ beat, children }) => {
  const d = sec(beat.to) - sec(beat.from);
  return <Sequence from={sec(beat.from)} durationInFrames={d} layout="none">{children(d)}</Sequence>;
};

export const ReshapeReel: React.FC<ReelProps> = ({ captions, track, debugSafe = false }) => {
  loadReshapeFonts();
  const { width, height, fps } = useVideoConfig();

  // captions arrive in source time; move them onto the retimed plate
  const caps = React.useMemo(
    () => captions.map((g) => ({
      start: shiftT(g.start), end: shiftT(g.end),
      words: g.words.map((w) => ({ ...w, s: shiftT(w.s), e: shiftT(w.e) })),
    })),
    [captions],
  );
  const g = (i: number) => caps[i]?.words ?? [];

  // arm centroids on the frozen frame, for the pose labels
  const freezeFrame = Math.round(FREEZE.from * fps);
  const rec = track[Math.min(freezeFrame, track.length - 1)] ?? {};
  const ARM_LIFT = 115;   // centroid sits mid-forearm; the peak reads higher
  const L = [(rec.L ?? [266, 1375])[0] - 20, (rec.L ?? [266, 1375])[1] - ARM_LIFT] as [number, number];
  const R = [(rec.R ?? [976, 1343])[0] + 20, (rec.R ?? [976, 1343])[1] - ARM_LIFT] as [number, number];
  const poseZoom = 1 + punchAt(FREEZE.from + 0.4, PUNCHES);
  const poseDx = reframeAt(FREEZE.from + 0.4, REFRAMES);

  return (
    <AbsoluteFill style={{ backgroundColor: '#07090C' }}>
      <Sequence durationInFrames={sec(COLD_OPEN_S)} layout="none">
        <ColdOpen durationInFrames={sec(COLD_OPEN_S)} />
        {COLD_SFX.map((c, i) => <SoundCue key={i} at={c.at} src={c.src} volume={c.volume} />)}
      </Sequence>

      <Sequence from={sec(COLD_OPEN_S)} durationInFrames={PLATE_USED} layout="none">
        <Audio src={staticFile('voice_v3.wav')} />
        {SFX.map((c, i) => <SoundCue key={i} at={c.at} src={c.src} volume={c.volume} />)}

        <DynamicReframe reframes={REFRAMES}>
          <PunchZoom punches={PUNCHES} originY="46%">
            <AbsoluteFill style={{ transform: 'scale(0.88)', transformOrigin: '50% 50%' }}>
              <OffthreadVideo src={staticFile('speaker_v3.mp4')} muted
                style={{ position: 'absolute', width: 1350, height: 2400, left: (width - 1350) / 2, top: (height - 2400) / 2 }} />
              <HeroIsolate windows={ISOLATE} />
            </AbsoluteFill>
          </PunchZoom>
        </DynamicReframe>

        <DynamicReframe reframes={REFRAMES}>
          <PunchZoom punches={PUNCHES} originY="46%">
            <AbsoluteFill style={{ transform: 'scale(0.88)', transformOrigin: '50% 50%' }}>
              <EdgeGlow windows={EDGE} />
            </AbsoluteFill>
          </PunchZoom>
        </DynamicReframe>

        <FocusVignette windows={FOCUS} />

        <SafeArea debug={debugSafe}>
          <Beat beat={BEATS_M.topic}>{(d) => <TopicTag durationInFrames={d} kicker="الموضوع" title="تمرين وزن الجسم" />}</Beat>
          <Beat beat={BEATS_M.vessel}>{(d) => <VesselBloom durationInFrames={d} />}</Beat>
          <Beat beat={BEATS_M.claim}>
            {(d) => (
              <StruckClaim
                durationInFrames={d}
                strikeAt={STRIKE_AT - BEATS_M.claim.from}
                eyebrow={g(CLAIM_LINES.eyebrow).map((w) => w.w).join(' ')}
                lines={CLAIM_LINES.lines.map((ids) =>
                  ids.flatMap(g).map((w) => ({ ...w, s: w.s - BEATS_M.claim.from, e: w.e - BEATS_M.claim.from })))}
              />
            )}
          </Beat>
          <Beat beat={BEATS_M.pointer}>
            {(d) => <PointerTag durationInFrames={d} label="أبو صقر" x={128} y={520} d="M 300 585 L 398 585 L 500 892" dot={[500, 892]} />}
          </Beat>

          <Sequence from={sec(FREEZE.from)} durationInFrames={sec(FREEZE.to) - sec(FREEZE.from)} layout="none">
            <FlexBeat durationInFrames={sec(FREEZE.to) - sec(FREEZE.from)} L={L} R={R} punch={poseZoom} dx={poseDx} />
          </Sequence>

          <Beat beat={BEATS_M.evidence}>{(d) => <EvidenceBars durationInFrames={d} />}</Beat>
          {/* frozen final gesture, pulled back and dimmed, with the lockup over it */}
          <Beat beat={{ from: TAIL.from + 0.13, to: TAIL.to + 0.03 }}>
            {(d) => <SignOff durationInFrames={d} top={1330} />}
          </Beat>

          <WordCaption groups={caps} suppress={CAPTION_SUPPRESS} display={CAPTION_DISPLAY} />
        </SafeArea>
      </Sequence>
    </AbsoluteFill>
  );
};
