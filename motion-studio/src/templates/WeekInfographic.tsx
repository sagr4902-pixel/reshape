import React from "react";
import { icons } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { color, dur, ease, font, grid, space } from "../brand/tokens";
import { Stage } from "../components/Stage";
import { Icon } from "../components/Icon";
import { typeStyle, WordLine } from "../components/Type";
import { cue, TemplateProps } from "../lib/timeline";
import { enter } from "../lib/motion";

/**
 * TEMPLATE 4 — Educational infographic ("Week Grid").
 * A 7-day matrix. Each row is one option; its training days fill in reading
 * order (right → left) when the option is spoken. Solid cells are training
 * days, outlined cells are optional days, empty cells are rest. A legend
 * keeps the chart honest: the day pattern is illustrative, the counts are the
 * message.
 */
export type WeekInfographicProps = {
  title: { text: string; cue: string; accent?: boolean }[];
  /** one entry per day; only the count is shown, names are kept for screen readers / edits */
  days: string[];
  weekLabel?: string;
  rows: { value: string; caption: string; on: number[]; optional?: number[]; cue: string }[];
  legend: { training: string; optional: string; note: string };
  footer?: { text: string; cue: string; icons?: (keyof typeof icons)[] };
};

const CELL = 78;
const GAP = 14;

export const WeekInfographic: React.FC<TemplateProps<WeekInfographicProps>> = ({ cues, title, days, weekLabel = "أسبوعك · ٧ أيام", rows, legend, footer }) => {
  const frame = useCurrentFrame();
  const firstRow = cue(cues, rows[0]?.cue ?? "", 0);
  const gridIn = enter(frame, firstRow - 14, dur.reveal);

  return (
    <Stage glow={{ x: 300, y: 1100, strength: 0.5 }}>
      <div style={{ position: "absolute", top: grid.safe.top + 60, right: grid.safe.right, left: grid.safe.left }}>
        <WordLine role="h2" words={title.map((w) => ({ text: w.text, at: cue(cues, w.cue), tone: w.accent ? color.signalRed : undefined }))} />
      </div>

      <div style={{ position: "absolute", top: 520, right: grid.safe.right, left: grid.safe.left }}>
        {/* week bracket: one legible label instead of seven tiny day names */}
        <div dir="rtl" style={{ display: "flex", alignItems: "flex-end", opacity: gridIn, marginBottom: space[4] }}>
          <div style={{ width: 232 }} />
          <div style={{ width: days.length * CELL + (days.length - 1) * GAP, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <span style={typeStyle("label", { fontSize: 36, color: color.sand, fontWeight: 600 })}>{weekLabel}</span>
            <div style={{ alignSelf: "stretch", height: 18, borderTop: `3px solid ${color.line}`, borderLeft: `3px solid ${color.line}`, borderRight: `3px solid ${color.line}` }} />
          </div>
        </div>

        {rows.map((r, ri) => {
          const at = cue(cues, r.cue);
          const p = enter(frame, at - 4, dur.reveal);
          return (
            <div key={ri} dir="rtl" style={{ display: "flex", alignItems: "center", height: 240, borderTop: `2px solid ${color.line}`, opacity: Math.max(gridIn * 0.35, p) }}>
              <div style={{ width: 232, display: "flex", flexDirection: "column", gap: 4 }}>
                <div dir="ltr" style={{ textAlign: "right", fontFamily: font.data, fontStyle: "italic", fontWeight: 800, fontSize: 96, lineHeight: 0.9, color: p > 0.5 ? color.bone : color.muted }}>
                  {r.value}
                </div>
                <div style={typeStyle("label", { fontSize: 34, color: color.sand, fontWeight: 600 })}>{r.caption}</div>
              </div>
              <div style={{ display: "flex", gap: GAP }}>
                {days.map((_, di) => {
                  const isOn = r.on.includes(di);
                  const isOpt = r.optional?.includes(di);
                  const c = enter(frame, at + di * 2, dur.ui, ease.out);
                  return (
                    <div
                      key={di}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 18,
                        background: isOn ? color.signalRed : color.track,
                        border: isOpt ? `4px solid ${color.signalRed}` : `4px solid transparent`,
                        boxSizing: "border-box",
                        scale: isOn || isOpt ? `${0.6 + 0.4 * c}` : "1",
                        opacity: isOn || isOpt ? Math.max(0.15, c) : 1,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* legend */}
        <div dir="rtl" style={{ display: "flex", gap: space[5], alignItems: "center", borderTop: `2px solid ${color.line}`, paddingTop: space[4], opacity: gridIn }}>
          <LegendSwatch fill label={legend.training} />
          <LegendSwatch label={legend.optional} />
          <span style={typeStyle("label", { fontSize: 32, color: color.muted, fontWeight: 500 })}>{legend.note}</span>
        </div>
      </div>

      {footer ? <Footer {...footer} at={cue(cues, footer.cue)} /> : null}
    </Stage>
  );
};

const LegendSwatch: React.FC<{ fill?: boolean; label: string }> = ({ fill, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 28, height: 28, borderRadius: 8, boxSizing: "border-box", background: fill ? color.signalRed : "transparent", border: `4px solid ${color.signalRed}` }} />
    <span style={typeStyle("label", { fontSize: 32, color: color.bone, fontWeight: 500 })}>{label}</span>
  </div>
);

const Footer: React.FC<{ text: string; at: number; icons?: (keyof typeof icons)[] }> = ({ text, at, icons: names = [] }) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at, dur.reveal);
  return (
    <div
      dir="rtl"
      style={{
        position: "absolute",
        right: grid.safe.right,
        left: grid.safe.left,
        bottom: grid.safe.bottom + 40,
        display: "flex",
        alignItems: "center",
        gap: space[3],
        opacity: p,
        translate: `0 ${(1 - p) * 30}px`,
      }}
    >
      {names.map((n) => (
        <Icon key={n} icon={icons[n]} size={64} tone={color.signalRed} />
      ))}
      <span style={typeStyle("h3", { fontSize: 68 })}>{text}</span>
    </div>
  );
};
