import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { color, dur, ease, font, grid } from "../brand/tokens";
import { Backdrop } from "../components/Backdrop";
import { Stage } from "../components/Stage";
import { Eyebrow, typeStyle, WordLine } from "../components/Type";
import { cue, TemplateProps } from "../lib/timeline";
import { enter, lerp, SLANT_DEG } from "../lib/motion";

/**
 * TEMPLATE 3 — Premium sports promo ("Impact").
 * A poster layout: giant outlined Latin tagline drifting behind, a word-synced
 * Arabic headline, a key word that repeats itself (echo), and a slanted
 * signal-red bar that slams in under the punchline. One hit per scene.
 */
export type SportsImpactProps = {
  eyebrow: string;
  backdrop: string;
  lead: { text: string; cue: string }[];
  echo: { text: string; cue: string; count?: number };
  slam: { text: string; cue: string };
  reps?: boolean;
};

export const SportsImpact: React.FC<TemplateProps<SportsImpactProps>> = ({
  cues,
  eyebrow,
  backdrop,
  lead,
  echo,
  slam,
  reps = true,
}) => {
  const frame = useCurrentFrame();
  const echoAt = cue(cues, echo.cue);
  const slamAt = cue(cues, slam.cue);
  const copies = echo.count ?? 3;
  const right = grid.safe.right;

  return (
    <Stage glow={{ x: 760, y: 1300, strength: 0.9 }}>
      <Backdrop word={backdrop} />

      <AbsoluteFill style={{ padding: `${grid.safe.top}px ${right}px 0 ${grid.safe.left}px` }}>
        <Eyebrow at={0} style={{ alignSelf: "flex-end" }}>
          {eyebrow}
        </Eyebrow>
      </AbsoluteFill>

      {/* Lead line */}
      <div style={{ position: "absolute", top: 360, right, left: grid.safe.left }}>
        <WordLine role="h1" words={lead.map((w) => ({ text: w.text, at: cue(cues, w.cue) }))} />
      </div>

      {/* Echo word: solid, then outlined repeats stepping down */}
      <div style={{ position: "absolute", top: 540, right, left: grid.safe.left }}>
        {Array.from({ length: copies }).map((_, i) => {
          const p = enter(frame, echoAt + i * 4, dur.reveal);
          const solid = i === 0;
          return (
            <div
              key={i}
              dir="rtl"
              style={{
                ...typeStyle("hero"),
                position: i === 0 ? "relative" : "absolute",
                top: i === 0 ? 0 : i * 196,
                right: 0,
                color: solid ? color.bone : "transparent",
                WebkitTextStroke: solid ? undefined : `2px ${color.sand}`,
                opacity: p * (solid ? 1 : 0.42 - (i - 1) * 0.22),
                translate: `0 ${(1 - p) * 60}px`,
              }}
            >
              {echo.text}
            </div>
          );
        })}
      </div>

      {/* Slam bar */}
      <SlamBar text={slam.text} at={slamAt} />

      {reps ? <RepTicks at={echoAt} count={copies} /> : null}
    </Stage>
  );
};

const SlamBar: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const frame = useCurrentFrame();
  const bar = enter(frame, at, dur.reveal, ease.spring);
  const txt = enter(frame, at + 4, dur.reveal);
  return (
    <div style={{ position: "absolute", top: 1230, left: -60, right: -60, height: 290 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: color.signalRed,
          transform: `skewX(-${SLANT_DEG}deg) scaleX(${bar})`,
          transformOrigin: "100% 50%",
        }}
      />
      <div
        dir="rtl"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          paddingRight: grid.safe.right + 60,
          ...typeStyle("h1"),
          color: color.ink,
          opacity: txt,
          translate: `${(1 - txt) * -40}px 0`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const RepTicks: React.FC<{ at: number; count: number }> = ({ at, count }) => {
  const frame = useCurrentFrame();
  return (
    <div
      dir="ltr"
      style={{
        position: "absolute",
        left: grid.safe.left,
        bottom: grid.safe.bottom + 20,
        display: "flex",
        alignItems: "baseline",
        gap: 28,
        fontFamily: font.data,
        fontWeight: 700,
        fontStyle: "italic",
      }}
    >
      <span style={{ fontSize: 30, letterSpacing: "0.24em", color: color.muted, opacity: enter(frame, at - 6, dur.ui) }}>REPS</span>
      {Array.from({ length: count }).map((_, i) => {
        const on = lerp(frame, [at + i * 4, at + i * 4 + dur.micro], [0, 1]);
        return (
          <span
            key={i}
            style={{
              fontSize: 56,
              color: on > 0.5 ? color.signalRed : color.line,
              opacity: 0.4 + on * 0.6,
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
        );
      })}
    </div>
  );
};
