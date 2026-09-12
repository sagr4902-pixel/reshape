import { Audio } from "@remotion/media";
import { parseMedia } from "@remotion/media-parser";
import React from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Composition,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, COPY, EASE, FORMAT } from "../brand/tokens";
import { AfterScene } from "../components/AfterScene";
import { BeforeScene } from "../components/BeforeScene";
import { EndCard } from "../components/EndCard";
import { FilmTexture } from "../components/FilmTexture";
import { HookFlash } from "../components/HookFlash";
import { ImpactFrame } from "../components/ImpactFrame";
import { SmartVideo } from "../components/SmartVideo";
import { SplitComparison } from "../components/SplitComparison";
import { TransformationReveal } from "../components/TransformationReveal";
import { REVEAL_FRAMES, buildTimeline, deriveShotList } from "../config/timeline";
import {
  audio as audioConfig,
  shotList as configuredShotList,
  transformation,
} from "../config/transformationData";
import type { Language, ShotList } from "../config/transformationData";

export type ReelProps = {
  beforeVideo: string;
  afterVideo: string;
  language: Language;
  shots: ShotList;
};

const T = buildTimeline();

/**
 * Measures both clips only when no shot list has been written by hand, so the
 * reel still cuts sensibly against footage nobody has watched yet.
 */
const calculateMetadata: CalculateMetadataFunction<ReelProps> = async ({ props }) => {
  let shots = configuredShotList;

  if (!shots) {
    const [before, after] = await Promise.all([
      parseMedia({ src: staticFile(props.beforeVideo), fields: { slowDurationInSeconds: true } }),
      parseMedia({ src: staticFile(props.afterVideo), fields: { slowDurationInSeconds: true } }),
    ]);
    shots = deriveShotList(before.slowDurationInSeconds, after.slowDurationInSeconds);
  }

  return {
    durationInFrames: T.total,
    props: { ...props, shots },
  };
};

export const TransformationReelComposition = () => {
  return (
    <Composition
      id="TransformationReel"
      component={TransformationReel}
      durationInFrames={T.total}
      fps={FORMAT.fps}
      width={FORMAT.width}
      height={FORMAT.height}
      calculateMetadata={calculateMetadata}
      defaultProps={{
        beforeVideo: transformation.beforeVideo,
        afterVideo: transformation.afterVideo,
        language: transformation.language,
        // Replaced by calculateMetadata; present so the type is satisfied.
        shots: configuredShotList ?? deriveShotList(8, 16),
      }}
    />
  );
};

export const TransformationReel: React.FC<ReelProps> = ({
  beforeVideo,
  afterVideo,
  language,
  shots,
}) => {
  const copy = COPY[language];
  const rtl = copy.dir === "rtl";
  const { fps } = useVideoConfig();
  const sfx = audioConfig.sfxVolume;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {/* ---------------------------------------------------------------- */}
      {/* HOOK — the finish, for one second, before anything is explained.  */}
      {/* ---------------------------------------------------------------- */}
      <Sequence name="HOOK" from={T.hook.from} durationInFrames={T.hook.durationInFrames}>
        <HookFlash
          src={afterVideo}
          flashes={shots.hookFlashes}
          framing={shots.after}
          durationInFrames={T.hook.durationInFrames}
        />
      </Sequence>

      {/* ---------------------------------------------------------------- */}
      {/* BEFORE — the working set.                                         */}
      {/* ---------------------------------------------------------------- */}
      <Sequence name="BEFORE" from={T.before.from} durationInFrames={T.before.durationInFrames}>
        <BeforeScene
          src={beforeVideo}
          shot={shots.before}
          label={copy.before}
          rtl={rtl}
          durationInFrames={T.before.durationInFrames}
          ambienceVolume={audioConfig.ambienceVolume}
        />
      </Sequence>

      {/* ---------------------------------------------------------------- */}
      {/* FREEZE — the top of the last rep, held. Height stalls here.       */}
      {/* ---------------------------------------------------------------- */}
      <Sequence name="FREEZE" from={T.freeze.from} durationInFrames={T.freeze.durationInFrames}>
        <FrozenBefore src={beforeVideo} shots={shots} label={copy.before} rtl={rtl} />
      </Sequence>

      {/* ---------------------------------------------------------------- */}
      {/* AFTER — the hero move, revealed by The Rise.                      */}
      {/* ---------------------------------------------------------------- */}
      <Sequence name="AFTER" from={T.after.from} durationInFrames={T.after.durationInFrames}>
        <TransformationReveal
          duration={REVEAL_FRAMES}
          from={
            <SmartVideo
              src={beforeVideo}
              startAt={shots.matchFreeze}
              freeze
              grade="before"
              focalX={shots.before.focalX}
              focalY={shots.before.focalY}
              scale={(shots.before.scale ?? 1.14) + 0.09}
            />
          }
          to={
            <AfterScene
              src={afterVideo}
              shot={shots.after}
              label={copy.after}
              rtl={rtl}
              durationInFrames={T.after.durationInFrames}
              ambienceVolume={audioConfig.ambienceVolume}
            />
          }
        />
      </Sequence>

      {/* ---------------------------------------------------------------- */}
      {/* IMPACT — the hit on the locked-out frame.                         */}
      {/* ---------------------------------------------------------------- */}
      <Sequence name="IMPACT" from={T.impact.from} durationInFrames={T.impact.durationInFrames}>
        <ImpactFrame duration={T.impact.durationInFrames}>
          <SmartVideo
            src={afterVideo}
            startAt={shots.peak}
            freeze
            grade="after"
            focalX={shots.after.focalX}
            focalY={shots.after.focalY}
            scale={shots.after.scale ?? 1.14}
          />
          <FilmTexture grain={0.07} vignette={0.38} />
        </ImpactFrame>
      </Sequence>

      {/* ---------------------------------------------------------------- */}
      {/* CODA — walking away from it.                                      */}
      {/* ---------------------------------------------------------------- */}
      {shots.coda ? (
        <Sequence name="CODA" from={T.coda.from} durationInFrames={T.coda.durationInFrames}>
          <AfterScene
            src={afterVideo}
            shot={shots.coda}
            label={copy.after}
            rtl={rtl}
            showLabel={false}
            durationInFrames={T.coda.durationInFrames}
            ambienceVolume={audioConfig.ambienceVolume}
          />
        </Sequence>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* COMPARISON — both frames, once, for under two seconds.            */}
      {/* ---------------------------------------------------------------- */}
      <Sequence
        name="COMPARISON"
        from={T.comparison.from}
        durationInFrames={T.comparison.durationInFrames}
      >
        <SplitComparison
          beforeSrc={beforeVideo}
          afterSrc={afterVideo}
          beforeAt={shots.comparison.before}
          afterAt={shots.comparison.after}
          // A half-width panel already crops to the centre of the frame, so the
          // split needs LESS punch than the full-frame shots, not more —
          // enough of the rig has to stay in shot for "below the bar" and
          // "above the bar" to read at a glance.
          beforeFraming={{ ...shots.before, scale: 1.06 }}
          afterFraming={{ ...shots.after, scale: 1.06 }}
          beforeLabel={copy.before}
          afterLabel={copy.after}
          rtl={rtl}
        />
      </Sequence>

      {/* ---------------------------------------------------------------- */}
      {/* END CARD — identical in every reel.                               */}
      {/* ---------------------------------------------------------------- */}
      <Sequence name="END CARD" from={T.endCard.from} durationInFrames={T.endCard.durationInFrames}>
        <EndCard language={language} />
      </Sequence>

      {/* ---------------------------------------------------------------- */}
      {/* SOUND — one riser into the reveal, one impact on the pose.        */}
      {/* ---------------------------------------------------------------- */}
      <Sequence name="SFX riser" from={T.freeze.from - Math.round(0.55 * fps)}>
        <Audio src={staticFile("sfx/riser.wav")} volume={() => sfx * 0.7} />
      </Sequence>
      <Sequence name="SFX whoosh" from={T.after.from}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={() => sfx} />
      </Sequence>
      <Sequence name="SFX impact" from={T.impact.from}>
        <Audio src={staticFile("sfx/impact.wav")} volume={() => sfx} />
      </Sequence>
      <Sequence name="SFX compare" from={T.comparison.from}>
        <Audio src={staticFile("sfx/tick.wav")} volume={() => sfx * 0.8} />
      </Sequence>
      <Sequence name="SFX end card" from={T.endCard.from}>
        <Audio src={staticFile("sfx/impact.wav")} volume={() => sfx * 0.55} />
      </Sequence>

      {audioConfig.music ? (
        <Sequence name="Music">
          <Audio src={staticFile(audioConfig.music)} volume={() => audioConfig.musicVolume} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * The held frame between BEFORE and AFTER: everything stops, the grade drains
 * toward the charcoal, and a hairline closes in from both edges.
 */
const FrozenBefore: React.FC<{
  readonly src: string;
  readonly shots: ShotList;
  readonly label: string;
  readonly rtl: boolean;
}> = ({ src, shots, label }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill name="Held frame">
      <SmartVideo
        src={src}
        startAt={shots.matchFreeze}
        freeze
        grade="before"
        focalX={shots.before.focalX}
        focalY={shots.before.focalY}
        scale={interpolate(
          frame,
          [0, durationInFrames],
          [(shots.before.scale ?? 1.14) + 0.06, (shots.before.scale ?? 1.14) + 0.09],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          },
        )}
      />
      <FilmTexture grain={0.16} vignette={0.56} />
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.charcoal,
          opacity: interpolate(frame, [0, durationInFrames], [0, 0.3], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      <AbsoluteFill aria-label={label} />
    </AbsoluteFill>
  );
};
