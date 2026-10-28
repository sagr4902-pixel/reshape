import React from "react";
import { icons } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { color, dur, font, grid, space } from "../brand/tokens";
import { Stage } from "../components/Stage";
import { Icon } from "../components/Icon";
import { Logo } from "../components/Logo";
import { typeStyle, WordLine } from "../components/Type";
import { cue, TemplateProps } from "../lib/timeline";
import { enter, lerp } from "../lib/motion";

/**
 * TEMPLATE 1 — Bold kinetic typography ("Stack").
 * Editorial, right-aligned stack of very large Arabic words that builds in
 * time with the voice. One word carries the accent colour and gets an
 * underline sweep. The lead-in can carry the sand wordmark.
 */
export type KineticLinesProps = {
  lead?: { text: string; cue: string; withWordmark?: boolean };
  lines: { text: string; cue: string; accent?: boolean }[][];
  footer?: { text: string; cue: string; icon?: keyof typeof icons };
  sideLabel?: string;
};

export const KineticLines: React.FC<TemplateProps<KineticLinesProps>> = ({ cues, lead, lines, footer, sideLabel }) => {
  const frame = useCurrentFrame();
  const accentWord = lines.flat().find((w) => w.accent);
  const accentAt = accentWord ? cue(cues, accentWord.cue) : 0;

  return (
    <Stage glow={{ x: 900, y: 700, strength: 0.6 }} showGrid>
      {lead ? <Lead {...lead} at={cue(cues, lead.cue)} /> : null}

      <div style={{ position: "absolute", top: 640, right: grid.safe.right, left: grid.safe.left, display: "flex", flexDirection: "column", gap: 8 }}>
        {lines.map((line, li) => {
          const isAccentLine = line.some((w) => w.accent);
          return (
            <div key={li} style={{ position: "relative" }}>
              <WordLine
                role={isAccentLine ? "hero" : "h1"}
                words={line.map((w) => ({ text: w.text, at: cue(cues, w.cue), tone: w.accent ? color.signalRed : undefined }))}
              />
              {isAccentLine ? (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: -14,
                    height: 10,
                    width: 560,
                    background: color.sand,
                    transformOrigin: "100% 50%",
                    scale: `${enter(frame, accentAt + 6, dur.cheer)} 1`,
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {footer ? <Footer {...footer} at={cue(cues, footer.cue)} /> : null}

      {sideLabel ? (
        <div
          dir="ltr"
          style={{
            position: "absolute",
            left: 40,
            top: 960,
            transformOrigin: "0 0",
            rotate: "-90deg",
            fontFamily: font.data,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: "0.32em",
            color: color.muted,
            whiteSpace: "nowrap",
            opacity: lerp(frame, [0, dur.reveal], [0, 0.8]),
          }}
        >
          {sideLabel}
        </div>
      ) : null}
    </Stage>
  );
};

const Lead: React.FC<{ text: string; at: number; withWordmark?: boolean }> = ({ text, at, withWordmark }) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at - 6, dur.reveal);
  const mark = enter(frame, at, dur.reveal);
  return (
    <div
      dir="rtl"
      style={{
        position: "absolute",
        top: grid.safe.top + 120,
        right: grid.safe.right,
        display: "flex",
        alignItems: "center",
        gap: space[4],
      }}
    >
      <span style={{ ...typeStyle("h3"), color: color.muted, opacity: p, translate: `${(1 - p) * 30}px 0` }}>{text}</span>
      {withWordmark ? (
        <div style={{ overflow: "hidden" }}>
          <div style={{ translate: `${(1 - mark) * 100}% 0`, opacity: mark > 0 ? 1 : 0 }}>
            <Logo kind="wordmark" scale={1} />
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Footer: React.FC<{ text: string; at: number; icon?: keyof typeof icons }> = ({ text, at, icon }) => {
  const frame = useCurrentFrame();
  const rule = enter(frame, at - 4, dur.cheer);
  const p = enter(frame, at, dur.reveal);
  return (
    <div style={{ position: "absolute", right: grid.safe.right, left: grid.safe.left, bottom: grid.safe.bottom + 80 }}>
      <div style={{ height: 2, background: color.line, transformOrigin: "100% 50%", scale: `${rule} 1`, marginBottom: space[5] }} />
      <div dir="rtl" style={{ display: "flex", alignItems: "center", gap: space[3], opacity: p, translate: `0 ${(1 - p) * 24}px` }}>
        {icon ? <Icon icon={icons[icon]} size={64} tone={color.signalRed} /> : null}
        <span style={{ ...typeStyle("body", { fontSize: 52, fontWeight: 600 }) }}>{text}</span>
      </div>
    </div>
  );
};
