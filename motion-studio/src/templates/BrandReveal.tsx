import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { color, dur, ease, font, grid, radius, space } from "../brand/tokens";
import { Backdrop } from "../components/Backdrop";
import { Stage } from "../components/Stage";
import { LOGO, MAX_LOGO_SCALE } from "../components/Logo";
import { Eyebrow, typeStyle } from "../components/Type";
import { cue, TemplateProps } from "../lib/timeline";
import { enter, lerp, SLANT_TAN } from "../lib/motion";

/**
 * TEMPLATE 6 — Brand reveal and call-to-action ("Lockup").
 * Uses the official primary lockup only. Phase 1 shows it clipped to its
 * mark, centred, uncovered by a slanted mask. Phase 2 slides the mark to its
 * place in the lockup while the clip opens to reveal the wordmark. The logo
 * file itself is never altered, recoloured or re-assembled.
 */
export type BrandRevealProps = {
  tagline?: string;
  logoCue: string;
  cta: { label: string; cue: string };
  sub?: { text: string; cue: string };
  url?: string;
};

export const BrandReveal: React.FC<TemplateProps<BrandRevealProps>> = ({ cues, tagline, logoCue, cta, sub, url }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const at = cue(cues, logoCue);
  const ctaAt = cue(cues, cta.cue);

  const s = MAX_LOGO_SCALE;
  const L = LOGO.primary;
  const w = L.w * s;
  const h = L.h * s;
  const markRight = (L.mark.x1 + 4) * s; // px from the image's left edge where the mark ends
  const markCentre = ((L.mark.x0 + L.mark.x1) / 2) * s;

  // phase 1: slanted mask uncovers the mark (left→right is the lockup's own direction)
  const uncover = enter(frame, at - 4, dur.reveal);
  // phase 2: mark slides into lockup position, wordmark clip opens
  const open = enter(frame, at + 14, dur.cheer, ease.inOut);

  const shift = (w / 2 - markCentre) * (1 - open); // keeps the mark centred until phase 2
  const lean = h * SLANT_TAN;
  // phase 1 edge sweeps across the mark only; phase 2 then pushes the edge to the full width
  const sweep = lerp(uncover, [0, 1], [-lean, markRight + lean]);
  const extra = (w + lean - markRight) * open;
  const edgeTop = Math.min(sweep + lean / 2, markRight) + extra;
  const edgeBottom = Math.min(sweep - lean / 2, markRight) + extra;
  const hairline = enter(frame, at + 30, dur.cheer);

  const top = 700;
  const left = (width - w) / 2;

  return (
    <Stage glow={{ x: width / 2, y: top + h / 2, strength: 1.1 }} tone="deep" push={0}>
      <Backdrop word="RE-SHAPE" opacity={0.04} />
      {tagline ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: top - 150 }}>
          <Eyebrow at={at + 20} tone={color.muted}>
            {tagline}
          </Eyebrow>
        </AbsoluteFill>
      ) : null}

      <div
        style={{
          position: "absolute",
          top,
          left,
          width: w,
          height: h,
          translate: `${shift}px 0`,
          clipPath: `polygon(0 0, ${edgeTop}px 0, ${edgeBottom}px ${h}px, 0 ${h}px)`,
        }}
      >
        <Img src={staticFile(L.src)} style={{ width: w, height: h, display: "block" }} />
      </div>

      {/* clear-space hairline under the lockup */}
      <div style={{ position: "absolute", top: top + h + 90, left: width / 2 - 90, width: 180, height: 3, background: color.sand, opacity: 0.5, scale: `${hairline} 1` }} />

      <CTA label={cta.label} at={ctaAt} top={top + h + 250} />
      {sub ? <Sub text={sub.text} at={cue(cues, sub.cue)} top={top + h + 440} /> : null}
      {url ? <Url text={url} at={ctaAt + 10} /> : null}
    </Stage>
  );
};

const CTA: React.FC<{ label: string; at: number; top: number }> = ({ label, at, top }) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at, dur.reveal, ease.spring);
  const t = enter(frame, at + 4, dur.reveal);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <div
        dir="rtl"
        style={{
          background: color.signalRed,
          borderRadius: radius.pill,
          padding: `${space[3]}px ${space[8]}px`,
          scale: `${0.85 + 0.15 * p}`,
          opacity: Math.min(1, p * 1.4),
        }}
      >
        <span style={{ ...typeStyle("h3", { fontSize: 72, color: color.white }), opacity: t, display: "inline-block" }}>{label}</span>
      </div>
    </AbsoluteFill>
  );
};

const Sub: React.FC<{ text: string; at: number; top: number }> = ({ text, at, top }) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at, dur.reveal);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top }}>
      <div dir="rtl" style={{ ...typeStyle("body", { fontSize: 48, color: color.bone, fontWeight: 600 }), opacity: p, translate: `0 ${(1 - p) * 20}px` }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

const Url: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at, dur.reveal);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: grid.safe.bottom }}>
      <div dir="ltr" style={{ fontFamily: font.data, fontWeight: 700, fontSize: 40, letterSpacing: "0.18em", color: color.sand, opacity: p }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};
