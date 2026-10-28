import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../../lib/brand";

type Item = { kind: "word"; text: string; at: number } | { kind: "sep"; at: number };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * "قوّة | لياقة | ثقة" on one line. Each word lands exactly on its VO word; separators grow in
 * just before the word they introduce. Per-WORD animation only (Arabic shaping stays intact).
 * Layout is fixed from the start (all slots reserved) so nothing shifts as words arrive.
 */
export const Triad: React.FC<{ quwwa: number; liyaqa: number; thiqa: number; allOn: number; fontSize?: number }> = ({
  quwwa,
  liyaqa,
  thiqa,
  allOn,
  fontSize = 112,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items: Item[] = [
    { kind: "word", text: "قوّة", at: quwwa },
    { kind: "sep", at: liyaqa - 3 },
    { kind: "word", text: "لياقة", at: liyaqa },
    { kind: "sep", at: thiqa - 3 },
    { kind: "word", text: "ثقة", at: thiqa },
  ];
  const wordStarts = [quwwa, liyaqa, thiqa];

  return (
    <div
      style={{
        direction: "rtl",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        columnGap: fontSize * 0.3,
        fontFamily: FONTS.display,
        fontWeight: 900,
        fontSize,
        lineHeight: 1.2,
        color: COLORS.white,
      }}
    >
      {items.map((it, i) => {
        if (it.kind === "sep") {
          const s = spring({ frame: frame - it.at, fps, config: { damping: 200, stiffness: 180 }, durationInFrames: 10 });
          return (
            <div
              key={i}
              style={{
                width: 8,
                height: fontSize * 0.72,
                borderRadius: 4,
                background: COLORS.orange,
                transform: `translateY(${fontSize * 0.02}px) scaleY(${s}) skewX(-8deg)`,
                opacity: frame >= it.at ? 1 : 0,
                boxShadow: "0 0 18px rgba(255,84,32,0.35)",
              }}
            />
          );
        }
        const idx = wordStarts.indexOf(it.at);
        // starts one frame early so the word is already partly visible on its exact VO frame
        const p = spring({ frame: frame - it.at + 1, fps, config: { damping: 26, stiffness: 210, mass: 0.7 }, durationInFrames: 13 });
        const visible = frame >= it.at;
        const scale = interpolate(p, [0, 1], [1.22, 1]);
        const blur = interpolate(p, [0, 1], [14, 0]);
        // underline: wipes in right->left after the word lands; dims when the next word takes focus,
        // then all three light up together once the line is complete.
        const u = interpolate(frame, [it.at + 3, it.at + 13], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
        const next = wordStarts[idx + 1];
        const dim = next === undefined ? 0 : interpolate(frame, [next, next + 6], [0, 1], clamp);
        const relight = interpolate(frame, [allOn, allOn + 6], [0, 1], clamp);
        const uOpacity = 1 - 0.65 * dim * (1 - relight);
        return (
          <div key={i} style={{ position: "relative", padding: `${fontSize * 0.1}px 0.04em ${fontSize * 0.2}px` }}>
            <span
              style={{
                display: "inline-block",
                opacity: visible ? Math.min(1, p * 1.8) : 0,
                transform: `scale(${scale})`,
                filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                textShadow: "0 6px 36px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              {it.text}
            </span>
            <div
              style={{
                position: "absolute",
                left: "8%",
                right: "8%",
                bottom: fontSize * 0.1,
                height: 7,
                borderRadius: 4,
                background: COLORS.orange,
                transformOrigin: "right center",
                transform: `scaleX(${u})`,
                opacity: uOpacity,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
