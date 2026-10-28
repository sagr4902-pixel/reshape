import React from "react";
import { icons } from "lucide-react";
import { useCurrentFrame } from "remotion";
import { color, dur, font, grid, radius, space } from "../brand/tokens";
import { Stage } from "../components/Stage";
import { Icon } from "../components/Icon";
import { Eyebrow, typeStyle, WordLine } from "../components/Type";
import { cue, TemplateProps } from "../lib/timeline";
import { enter, lerp } from "../lib/motion";

/**
 * TEMPLATE 2 — Icon-based service explainer ("Rail").
 * A numbered vertical rail on the reading-start side (right). Each step lands
 * on its spoken cue: the rail extends, the number lights, the icon tile and
 * copy slide in from the right. The newest step is "active" (red icon,
 * red tile edge); earlier steps settle back.
 */
export type ServiceStepsProps = {
  eyebrow?: string;
  title: { text: string; cue: string }[];
  items: { icon: keyof typeof icons; title: string; caption?: string; cue: string }[];
};

const ROW = 370;
const TOP = 600;
const TILE = 168;

export const ServiceSteps: React.FC<TemplateProps<ServiceStepsProps>> = ({ cues, eyebrow, title, items }) => {
  const frame = useCurrentFrame();
  const at = items.map((it) => cue(cues, it.cue));
  const activeIndex = at.reduce((acc, a, i) => (frame >= a ? i : acc), -1);
  const railX = grid.safe.right + 34; // from the right edge

  // the rail grows from the first number to the latest reached step
  const railTarget = activeIndex <= 0 ? 0 : activeIndex * ROW;
  const prevTarget = activeIndex <= 1 ? 0 : (activeIndex - 1) * ROW;
  const grow = activeIndex <= 0 ? 0 : prevTarget + (railTarget - prevTarget) * enter(frame, at[activeIndex], dur.reveal);

  return (
    <Stage glow={{ x: 860, y: 900, strength: 0.5 }}>
      <div style={{ position: "absolute", top: grid.safe.top + 40, right: grid.safe.right, left: grid.safe.left, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: space[3] }}>
        {eyebrow ? <Eyebrow at={0}>{eyebrow}</Eyebrow> : null}
        <WordLine role="h2" words={title.map((w) => ({ text: w.text, at: cue(cues, w.cue) }))} />
      </div>

      {/* rail */}
      <div style={{ position: "absolute", top: TOP + TILE / 2, right: railX, width: 4, height: (items.length - 1) * ROW, background: color.track }} />
      <div style={{ position: "absolute", top: TOP + TILE / 2, right: railX, width: 4, height: grow, background: color.signalRed }} />

      {items.map((it, i) => {
        const p = enter(frame, at[i], dur.reveal);
        const active = i === activeIndex;
        const settled = activeIndex > i;
        const dim = settled ? lerp(frame, [at[i + 1] ?? 0, (at[i + 1] ?? 0) + dur.ui], [1, 0.62]) : 1;
        return (
          <div
            key={i}
            dir="rtl"
            style={{
              position: "absolute",
              top: TOP + i * ROW,
              right: grid.safe.right,
              left: grid.safe.left,
              height: TILE,
              display: "flex",
              alignItems: "center",
              gap: space[4],
              opacity: p * dim,
              translate: `${(1 - p) * 90}px 0`,
            }}
          >
            {/* step number on the rail */}
            <div style={{ width: 72, display: "flex", justifyContent: "center", alignSelf: "center" }}>
              <div
                dir="ltr"
                style={{
                  fontFamily: font.data,
                  fontStyle: "italic",
                  fontWeight: 800,
                  fontSize: 40,
                  color: active || settled ? color.ink : color.muted,
                  background: active || settled ? color.signalRed : color.ink,
                  border: `3px solid ${active || settled ? color.signalRed : color.line}`,
                  width: 72,
                  height: 72,
                  borderRadius: radius.pill,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>
            <div
              style={{
                width: TILE,
                height: TILE,
                flex: "none",
                borderRadius: radius.card,
                background: color.panel,
                border: `3px solid ${active ? color.signalRed : color.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon icon={icons[it.icon]} size={92} tone={active ? color.signalRed : color.sand} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              <div style={typeStyle("h3", { fontSize: 64, whiteSpace: "nowrap" })}>{it.title}</div>
              {it.caption ? <div style={typeStyle("label", { color: color.bone, opacity: 0.72, fontWeight: 500, fontSize: 36, lineHeight: 1.35 })}>{it.caption}</div> : null}
            </div>
          </div>
        );
      })}
    </Stage>
  );
};
