import React from "react";
import { icons } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { color, dur, ease, font, grid, space } from "../brand/tokens";
import { Stage } from "../components/Stage";
import { Icon } from "../components/Icon";
import { Eyebrow, typeStyle, WordLine } from "../components/Type";
import { cue, TemplateProps } from "../lib/timeline";
import { enter, lerp } from "../lib/motion";

/**
 * TEMPLATE 5 — Animated statistics ("Counters").
 * Giant data numerals in Barlow Semi Condensed. Each counter is timed so the
 * final value lands as the number is spoken, with a gauge arc that fills
 * alongside. Only numbers the brand itself publishes may be used — every stat
 * in a job must carry a `source`.
 */
export type StatCountersProps = {
  eyebrow?: string;
  heading: { text: string; cue: string }[];
  stats: { value: number; prefix?: string; suffix?: string; label: string; cue: string; accent?: boolean; source: string }[];
  footnote?: { text: string; cue: string; icon?: keyof typeof icons };
};

const COUNT_LEAD = 8; // frames before the spoken number
const COUNT_LEN = 22;

export const StatCounters: React.FC<TemplateProps<StatCountersProps>> = ({ cues, eyebrow, heading, stats, footnote }) => {
  const frame = useCurrentFrame();
  return (
    <Stage glow={{ x: 300, y: 820, strength: 0.7 }}>
      <div style={{ position: "absolute", top: grid.safe.top + 40, right: grid.safe.right, left: grid.safe.left, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: space[3] }}>
        {eyebrow ? <Eyebrow at={0}>{eyebrow}</Eyebrow> : null}
        <WordLine role="h2" style={{ flexWrap: "nowrap", fontSize: 88 }} words={heading.map((w) => ({ text: w.text, at: cue(cues, w.cue) }))} />
      </div>

      {stats.map((s, i) => {
        const at = cue(cues, s.cue);
        const p = enter(frame, at - COUNT_LEAD - 6, dur.reveal);
        const n = lerp(frame, [at - COUNT_LEAD, at - COUNT_LEAD + COUNT_LEN], [0, s.value], ease.out);
        const tone = s.accent ? color.signalRed : color.bone;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 560 + i * 520,
              right: grid.safe.right,
              left: grid.safe.left,
              height: 440,
              opacity: p,
              translate: `0 ${(1 - p) * 50}px`,
            }}
          >
            <Gauge progress={n / s.value} tone={tone} />
            <div dir="ltr" style={{ position: "absolute", left: 36, top: 40, fontFamily: font.data, fontStyle: "italic", fontWeight: 800, fontSize: String(s.value).length + (s.prefix ?? "").length > 3 ? 232 : 280, lineHeight: 1, color: tone, fontVariantNumeric: "tabular-nums" }}>
              {s.prefix ?? ""}
              {Math.round(n)}
              {s.suffix ?? ""}
            </div>
            <div dir="rtl" style={{ position: "absolute", right: 0, bottom: 0, width: 420, borderTop: `2px solid ${color.line}`, paddingTop: space[3] }}>
              <div style={typeStyle("h3", { fontSize: 60, whiteSpace: "nowrap" })}>{s.label}</div>
            </div>
          </div>
        );
      })}

      {footnote ? <Footnote {...footnote} at={cue(cues, footnote.cue)} /> : null}
    </Stage>
  );
};

/** Three-quarter gauge behind the numeral. */
const Gauge: React.FC<{ progress: number; tone: string }> = ({ progress, tone }) => {
  const r = 190;
  const c = 2 * Math.PI * r;
  const arc = 0.75 * c;
  return (
    <svg width={440} height={440} style={{ position: "absolute", left: 0, top: 0, opacity: 0.9 }} viewBox="0 0 440 440">
      <g transform="rotate(135 220 220)">
        <circle cx={220} cy={220} r={r} fill="none" stroke={color.track} strokeWidth={10} strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
        <circle cx={220} cy={220} r={r} fill="none" stroke={tone} strokeWidth={10} strokeDasharray={`${arc * Math.max(0, Math.min(1, progress))} ${c}`} strokeLinecap="round" />
      </g>
    </svg>
  );
};

const Footnote: React.FC<{ text: string; at: number; icon?: keyof typeof icons }> = ({ text, at, icon }) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at, dur.reveal);
  return (
    <div dir="rtl" style={{ position: "absolute", right: grid.safe.right, left: grid.safe.left, bottom: grid.safe.bottom, display: "flex", alignItems: "center", gap: space[2], opacity: p }}>
      {icon ? <Icon icon={icons[icon]} size={48} tone={color.sand} /> : null}
      <span style={typeStyle("label", { fontSize: 34, color: color.sand, fontWeight: 500 })}>{text}</span>
    </div>
  );
};
