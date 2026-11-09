import React from "react";
import { Easing, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../lib/brand";
import { CLIPS } from "./timeline";
import { Icon, IconName } from "./icons";
import { PHONE_TRACKS } from "./phoneTracks";
import { WORDS, Word } from "./words";

/* Kinetic captions + small content-linked graphics for "One Day".
   Every spoken line is captioned word by word on its real timing (src/oneday/words.ts); the
   entrance style changes per scene; key words carry an emphasis that matches their meaning.
   Nothing is masked with clip-path on the text box (that clipped the dots of final «ي»). */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeOut = Easing.out(Easing.cubic);
const ORANGE = COLORS.orange;
const SHADOW = "0 3px 18px rgba(0,0,0,.55), 0 1px 3px rgba(0,0,0,.45)";

export type Anchor = { x: number; y: number; align: "right" | "center" | "left"; size: number; maxW?: number };
export type Place = { h: Anchor; v: Anchor };
type Variant = "rise" | "pop" | "slide" | "drop" | "wipe";
type Emph = "accent" | "marker" | "strike";

const Block: React.FC<{ a: Anchor; children: React.ReactNode; style?: React.CSSProperties }> = ({ a, children, style }) => {
  const { width, height } = useVideoConfig();
  const maxW = (a.maxW ?? 0.5) * width;
  const pos: React.CSSProperties =
    a.align === "right"
      ? { right: (1 - a.x) * width, width: maxW, alignItems: "flex-end" }
      : a.align === "left"
        ? { left: a.x * width, width: maxW, alignItems: "flex-start" }
        : { left: a.x * width - maxW / 2, width: maxW, alignItems: "center" };
  return (
    <div style={{ position: "absolute", top: a.y * height, transform: "translateY(-50%)", display: "flex", flexDirection: "column", ...pos, ...style }}>
      {children}
    </div>
  );
};

/* ------------------------------------------------------------- one line */
export const Line: React.FC<{
  words: Word[];
  variant: Variant;
  place: Place;
  portrait: boolean;
  em?: Record<number, Emph>;
  hold?: number;
  icon?: { at: number; name: IconName };
  until?: number;
}> = ({ words, variant, place, portrait, em = {}, hold = 22, icon, until }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = portrait ? place.v : place.h;
  const from = words[0].s - 5;
  const to = until ?? words[words.length - 1].e + hold;
  if (f < from || f > to) return null;
  const exit = interpolate(f, [to - 8, to], [0, 1], clamp);
  return (
    <Block a={a} style={{ opacity: 1 - exit, transform: `translateY(calc(-50% - ${exit * 0.25}em))`, fontSize: a.size }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          direction: "rtl",
          justifyContent: a.align === "center" ? "center" : "flex-start",
          columnGap: "0.27em",
          rowGap: "0.05em",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: a.size,
          lineHeight: 1.22,
          color: "#fff",
          textShadow: SHADOW,
        }}
      >
        {words.map((w, i) => {
          const local = f - (w.s - 3);
          const p = interpolate(local, [0, 9], [0, 1], clamp);
          const e = easeOut(p);
          let st: React.CSSProperties = { opacity: p };
          if (variant === "rise") st = { opacity: p, transform: `translateY(${(1 - e) * 0.45}em)`, filter: `blur(${(1 - p) * 5}px)` };
          if (variant === "drop") st = { opacity: p, transform: `translateY(${-(1 - e) * 0.5}em)` };
          if (variant === "slide") st = { opacity: p, transform: `translateX(${(1 - e) * 0.9}em)` };
          if (variant === "pop") {
            const k = spring({ frame: local, fps, config: { damping: 11, stiffness: 190, mass: 0.7 } });
            st = { opacity: Math.min(1, p * 2), transform: `scale(${0.55 + 0.45 * k})` };
          }
          if (variant === "wipe") {
            const m = interpolate(local, [0, 10], [-30, 110], clamp);
            const g = `linear-gradient(to left, #000 ${m}%, transparent ${m + 30}%)`;
            st = { WebkitMaskImage: g, maskImage: g, opacity: 1 };
          }
          const emph = em[i];
          const q = interpolate(f, [w.s + 3, w.s + 13], [0, 1], { ...clamp, easing: easeOut });
          const color = emph === "accent" ? interpolateColors(q, [0, 1], ["#ffffff", ORANGE]) : "#fff";
          const iconHere = icon && icon.at === i;
          const ik = iconHere ? spring({ frame: f - (w.s - 6), fps, config: { damping: 12, stiffness: 170 } }) : 0;
          return (
            <React.Fragment key={i}>
              {iconHere ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "0.9em",
                    height: "0.9em",
                    alignSelf: "center",
                    borderRadius: "50%",
                    background: ORANGE,
                    boxShadow: "0 6px 22px rgba(255,84,32,.45)",
                    transform: `scale(${ik})`,
                    opacity: Math.min(1, ik * 1.5),
                  }}
                >
                  <Icon name={icon.name} size={a.size * 0.42} color="#fff" />
                </span>
              ) : null}
              {/* padding keeps descenders (the dots of «ي») inside the box for masks */}
              <span style={{ display: "inline-block", padding: "0.12em 0.06em 0.4em", margin: "-0.12em -0.06em -0.4em", ...st }}>
                <span style={{ position: "relative", display: "inline-block", color }}>
                  {w.w}
                  {emph === "marker" ? (
                    <span style={{ position: "absolute", right: 0, bottom: "-0.02em", height: "0.12em", width: `${q * 100}%`, background: ORANGE, borderRadius: "0.06em" }} />
                  ) : null}
                  {emph === "strike" ? (
                    <span
                      style={{
                        position: "absolute",
                        right: "-4%",
                        top: "50%",
                        height: "0.1em",
                        width: `${q * 108}%`,
                        background: ORANGE,
                        borderRadius: "0.05em",
                        transform: "rotate(-4deg)",
                        boxShadow: "0 2px 10px rgba(0,0,0,.35)",
                      }}
                    />
                  ) : null}
                </span>
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </Block>
  );
};

/* ----------------------------------------------------- hero super (pop) */
export const Hero: React.FC<{ text: string; from: number; to: number; place: Place; portrait: boolean }> = ({ text, from, to, place, portrait }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < from || f > to) return null;
  const a = portrait ? place.v : place.h;
  const k = spring({ frame: f - from, fps, config: { damping: 13, stiffness: 150 } });
  const exit = interpolate(f, [to - 9, to], [0, 1], clamp);
  const bar = interpolate(f, [from + 6, from + 20], [0, 1], { ...clamp, easing: easeOut });
  return (
    <Block a={a} style={{ opacity: Math.min(1, k * 1.6) * (1 - exit) }}>
      <div
        style={{
          direction: "rtl",
          whiteSpace: "nowrap",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: a.size,
          lineHeight: 1.25,
          color: "#fff",
          textShadow: SHADOW,
          transform: `scale(${0.7 + 0.3 * k}) translateY(${exit * -0.2}em)`,
          padding: "0.1em 0.1em 0.35em",
        }}
      >
        {text}
      </div>
      <div style={{ height: a.size * 0.09, width: a.size * 1.6 * bar, background: ORANGE, borderRadius: 6, marginTop: -a.size * 0.25 }} />
    </Block>
  );
};

/* --------------------------------------------------- travel checklist */
export const Checklist: React.FC<{ items: { icon: IconName; text: string; at: number }[]; to: number; place: Place; portrait: boolean }> = ({
  items,
  to,
  place,
  portrait,
}) => {
  const f = useCurrentFrame();
  if (f < items[0].at - 6 || f > to) return null;
  const a = portrait ? place.v : place.h;
  const exit = interpolate(f, [to - 8, to], [0, 1], clamp);
  return (
    <Block a={{ ...a, maxW: a.maxW ?? 0.36 }} style={{ opacity: 1 - exit, transform: `translateY(-50%) translateX(${exit * 40}px)` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: a.size * 0.32, direction: "rtl" }}>
        {items.map((it, i) => {
          const p = interpolate(f, [it.at - 6, it.at + 8], [0, 1], { ...clamp, easing: easeOut });
          const tick = interpolate(f, [it.at + 10, it.at + 22], [0, 1], clamp);
          const latest = i === items.filter((x) => f >= x.at - 6).length - 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: a.size * 0.32,
                opacity: p * (latest ? 1 : 0.78),
                transform: `translateX(${(1 - p) * 60}px)`,
                fontFamily: FONTS.display,
                fontWeight: 900,
                fontSize: a.size,
                lineHeight: 1.2,
                color: "#fff",
                textShadow: SHADOW,
              }}
            >
              <span
                style={{
                  width: a.size * 1.05,
                  height: a.size * 1.05,
                  borderRadius: "50%",
                  background: latest ? ORANGE : "rgba(255,255,255,.14)",
                  border: latest ? "none" : "1.5px solid rgba(255,255,255,.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                  boxShadow: latest ? "0 6px 22px rgba(255,84,32,.4)" : "none",
                }}
              >
                <Icon name={it.icon} size={a.size * 0.55} draw={p} />
              </span>
              <span style={{ whiteSpace: "nowrap", padding: "0 0 0.25em", marginBottom: "-0.25em" }}>{it.text}</span>
              <span style={{ opacity: tick }}>
                <Icon name="check" size={a.size * 0.62} color={ORANGE} draw={tick} strokeWidth={2.6} />
              </span>
            </div>
          );
        })}
      </div>
    </Block>
  );
};

/* ---------------------------------------- "8 weeks later" with a live counter */
export const WeeksCard: React.FC<{ from: number; dur: number; portrait: boolean }> = ({ from, dur, portrait }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (f < from || f > from + dur) return null;
  const l = f - from;
  const bg = interpolate(l, [0, 6, dur - 7, dur], [0, 1, 1, 0], clamp);
  const n = Math.max(1, Math.min(8, 1 + Math.floor(interpolate(l, [6, 24], [0, 7.99], clamp))));
  const txt = interpolate(l, [3, 10, dur - 8, dur - 2], [0, 1, 1, 0], clamp);
  const s = portrait ? width * 0.11 : height * 0.1;
  return (
    <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${bg})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: txt, display: "flex", flexDirection: "column", alignItems: "center", gap: s * 0.25 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: s * 0.25, direction: "rtl", color: "#fff", fontFamily: FONTS.display, fontWeight: 900, fontSize: s }}>
          <span>بعد</span>
          <span style={{ fontFamily: FONTS.latin, fontWeight: 700, fontSize: s * 1.35, color: ORANGE, minWidth: s * 0.8, textAlign: "center" }}>{n}</span>
          <span>أسابيع</span>
        </div>
        <div style={{ display: "flex", gap: s * 0.09, direction: "rtl" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ width: s * 0.42, height: s * 0.08, borderRadius: 4, background: i < n ? ORANGE : "rgba(255,255,255,.18)" }} />
          ))}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------- week dots under a caption */
export const WeekDots: React.FC<{ startAt: number; step: number; to: number; place: Place; portrait: boolean }> = ({ startAt, step, to, place, portrait }) => {
  const f = useCurrentFrame();
  if (f < startAt - 8 || f > to) return null;
  const a = portrait ? place.v : place.h;
  const exit = interpolate(f, [to - 8, to], [0, 1], clamp);
  const s = a.size;
  return (
    <Block a={a} style={{ opacity: interpolate(f, [startAt - 8, startAt], [0, 1], clamp) * (1 - exit) }}>
      <div style={{ display: "flex", gap: s * 0.28, direction: "rtl" }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const on = interpolate(f, [startAt + i * step, startAt + i * step + 5], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{
                width: s * 0.36,
                height: s * 0.36,
                borderRadius: "50%",
                background: interpolateColors(on, [0, 1], ["rgba(255,255,255,0.22)", ORANGE]),
                transform: `scale(${1 + 0.3 * Math.sin(Math.PI * on)})`,
                boxShadow: on > 0.5 ? "0 0 14px rgba(255,84,32,.55)" : "none",
              }}
            />
          );
        })}
      </div>
    </Block>
  );
};

/* ------------------------------------------------------- coach lower third */
export const LowerThird: React.FC<{ from: number; to: number; name: string; role: string; place: Place; portrait: boolean }> = ({ from, to, name, role, place, portrait }) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = portrait ? place.v : place.h;
  const p = interpolate(f, [from, from + 14], [0, 1], { ...clamp, easing: easeOut });
  const exit = interpolate(f, [to - 10, to], [0, 1], clamp);
  return (
    <Block a={a} style={{ opacity: 1 - exit }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: a.size * 0.4, direction: "rtl" }}>
        <div style={{ width: a.size * 0.12, borderRadius: 4, background: ORANGE, transform: `scaleY(${p})`, transformOrigin: "top" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: a.size * 0.05, transform: `translateX(${(1 - p) * 40}px)`, opacity: p }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: a.size, color: "#fff", textShadow: SHADOW, lineHeight: 1.2, paddingBottom: "0.2em", marginBottom: "-0.2em" }}>{name}</div>
          <div style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: a.size * 0.55, color: "rgba(255,255,255,.85)", textShadow: SHADOW }}>{role}</div>
        </div>
      </div>
    </Block>
  );
};

/* -------------------------------------------------- time-of-day stamps */
export const TimeChip: React.FC<{ from: number; to: number; text: string; place: Place; portrait: boolean }> = ({ from, to, text, place, portrait }) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = portrait ? place.v : place.h;
  const p = interpolate(f, [from, from + 10], [0, 1], { ...clamp, easing: easeOut });
  const exit = interpolate(f, [to - 8, to], [0, 1], clamp);
  return (
    <Block a={{ ...a, maxW: 0.4 }} style={{ opacity: p * (1 - exit) }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: a.size * 0.4,
          direction: "rtl",
          padding: `${a.size * 0.3}px ${a.size * 0.65}px`,
          borderRadius: 999,
          background: "rgba(10,10,12,.32)",
          border: "1px solid rgba(255,255,255,.18)",
          backdropFilter: "blur(6px)",
          transform: `translateY(${(1 - p) * -10}px)`,
        }}
      >
        <Icon name="clock" size={a.size * 1.05} color="rgba(255,255,255,.9)" draw={p} />
        <span style={{ fontFamily: FONTS.latin, fontWeight: 600, fontSize: a.size, color: "#fff", letterSpacing: "0.02em", direction: "ltr" }}>{text}</span>
      </div>
    </Block>
  );
};

/* ---------------------------------------------- chips anchored to the phone */
const clipById = (id: string) => CLIPS.find((c) => c.id === id)!;

/** the tracked screen quad of a clip at composition frame f, in composition pixels */
export const usePhoneQuad = (clipId: string, portrait: boolean): number[][] | null => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const tr = PHONE_TRACKS[portrait ? "v" : "h"][clipId];
  if (!tr) return null;
  const c = clipById(clipId);
  const t = c.src + ((f - c.from) / 30) * c.rate;
  const i = Math.round(t * tr.fps);
  const q = tr.q[Math.max(0, Math.min(tr.q.length - 1, i))];
  if (!q) return null;
  const s = Math.max(width / tr.w, height / tr.h);
  const ox = (width - tr.w * s) / 2;
  const oy = (height - tr.h * s) / 2;
  return [0, 1, 2, 3].map((k) => [q[k * 2] * s + ox, q[k * 2 + 1] * s + oy]);
};

export const PhoneChip: React.FC<{
  clip: string;
  from: number;
  to: number;
  icon: IconName;
  text: string;
  side: { h: "left" | "right" | "above"; v: "left" | "right" | "below" | "above" };
  dy?: number; // 0 = top of screen, 1 = bottom
  portrait: boolean;
  size: { h: number; v: number };
}> = ({ clip, from, to, icon, text, side, dy = 0.3, portrait, size }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const q = usePhoneQuad(clip, portrait);
  if (f < from || f > to || !q) return null;
  const sd = portrait ? side.v : side.h;
  const s = portrait ? size.v : size.h;
  const k = spring({ frame: f - from, fps, config: { damping: 13, stiffness: 160 } });
  const exit = interpolate(f, [to - 8, to], [0, 1], clamp);
  const xs = q.map((p) => p[0]);
  const ys = q.map((p) => p[1]);
  const y = Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * dy;
  const gap = s * 0.9;
  const pos: React.CSSProperties =
    sd === "left"
      ? { right: `calc(100% - ${Math.min(...xs) - gap}px)`, top: y, transform: "translateY(-50%)" }
      : sd === "right"
        ? { left: Math.max(...xs) + gap, top: y, transform: "translateY(-50%)" }
        : sd === "above"
          ? { left: (Math.min(...xs) + Math.max(...xs)) / 2, top: Math.min(...ys) - gap * 0.6, transform: "translate(-50%, -100%)" }
          : { left: (Math.min(...xs) + Math.max(...xs)) / 2, top: Math.max(...ys) + gap * 0.8, transform: "translateX(-50%)" };
  return (
    <div style={{ position: "absolute", ...pos, opacity: Math.min(1, k * 1.5) * (1 - exit) }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: s * 0.35,
          direction: "rtl",
          padding: `${s * 0.32}px ${s * 0.6}px ${s * 0.32}px ${s * 0.75}px`,
          borderRadius: 999,
          background: "rgba(14,15,17,.62)",
          border: "1px solid rgba(255,255,255,.16)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(0,0,0,.35)",
          transform: `scale(${0.7 + 0.3 * k})`,
          transformOrigin: sd === "left" ? "right center" : sd === "right" ? "left center" : sd === "above" ? "center bottom" : "center top",
        }}
      >
        <span style={{ width: s * 1.15, height: s * 1.15, borderRadius: "50%", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <Icon name={icon} size={s * 0.68} draw={interpolate(f, [from + 2, from + 14], [0, 1], clamp)} />
        </span>
        <span style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: s, color: "#fff", whiteSpace: "nowrap", padding: "0 0 0.15em" }}>{text}</span>
      </div>
    </div>
  );
};

/** a soft double ring around the phone when the medal lands */
export const PhonePulse: React.FC<{ clip: string; at: number; portrait: boolean }> = ({ clip, at, portrait }) => {
  const f = useCurrentFrame();
  const q = usePhoneQuad(clip, portrait);
  if (f < at || f > at + 26 || !q) return null;
  const cx = q.reduce((a, p) => a + p[0], 0) / 4;
  const cy = q.reduce((a, p) => a + p[1], 0) / 4;
  const h = Math.max(...q.map((p) => p[1])) - Math.min(...q.map((p) => p[1]));
  return (
    <>
      {[0, 7].map((d) => {
        const p = interpolate(f - at - d, [0, 18], [0, 1], { ...clamp, easing: easeOut });
        if (p <= 0) return null;
        const r = h * (0.55 + 0.5 * p);
        return (
          <div
            key={d}
            style={{
              position: "absolute",
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `${3 - 2 * p}px solid rgba(255,84,32,${0.8 * (1 - p)})`,
              boxShadow: `0 0 ${30 * (1 - p)}px rgba(255,84,32,${0.5 * (1 - p)})`,
            }}
          />
        );
      })}
    </>
  );
};

/* ------------------------------------------- the URL, typed with his thumb */
export const UrlTyper: React.FC<{ from: number; typeFrames: number; to: number; text: string; place: Place; portrait: boolean }> = ({
  from,
  typeFrames,
  to,
  text,
  place,
  portrait,
}) => {
  const f = useCurrentFrame();
  if (f < from - 4 || f > to) return null;
  const a = portrait ? place.v : place.h;
  const n = Math.min(text.length, Math.max(0, Math.floor(((f - from) / typeFrames) * text.length)));
  const done = f >= from + typeFrames;
  const o = interpolate(f, [from - 4, from, to - 12, to], [0, 1, 1, 0], clamp);
  const caretOn = !done || Math.floor(f / 8) % 2 === 0;
  const under = interpolate(f, [from + typeFrames, from + typeFrames + 14], [0, 1], { ...clamp, easing: easeOut });
  const s = a.size;
  return (
    <Block a={a} style={{ opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: s * 0.3, direction: "ltr" }}>
        <span style={{ opacity: interpolate(f, [from + typeFrames, from + typeFrames + 8], [0, 1], clamp) }}>
          <Icon name="globe" size={s * 0.8} color={ORANGE} draw={under} />
        </span>
        <span style={{ fontFamily: FONTS.latin, fontWeight: 700, fontSize: s, color: "#fff", letterSpacing: "0.01em", textShadow: SHADOW, whiteSpace: "nowrap" }}>
          {text.slice(0, n)}
          <span style={{ display: "inline-block", width: s * 0.06, height: s * 0.9, marginLeft: s * 0.05, background: ORANGE, verticalAlign: "-0.12em", opacity: caretOn ? 1 : 0 }} />
        </span>
      </div>
      <div style={{ height: 6, width: under * s * 2.8, background: ORANGE, borderRadius: 4, marginTop: s * 0.15, alignSelf: a.align === "center" ? "center" : a.align === "left" ? "flex-start" : "flex-end" }} />
    </Block>
  );
};

export { WORDS };
