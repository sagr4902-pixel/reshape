import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Grain, Vignette } from "../components/Finish";
import { LogoLockup } from "../components/Logo";
import { COLORS, FONTS } from "../lib/brand";
import { loadBrandFonts } from "../lib/fonts";
import { CARD, CLIPS, ClipShot, EDGE_LEN, END, SUPERS, URL_TYPE, WEB } from "./timeline";
import { SCREEN_QUADS } from "./screenQuads";

loadBrandFonts();

export type OneDayProps = { portrait: boolean };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeInOut = Easing.inOut(Easing.cubic);
const SCREEN_AR = 1170 / 2532; // the captures' screen aspect

/* --------------------------------------------------------------- footage */
const Clip: React.FC<{ shot: ClipShot; portrait: boolean }> = ({ shot, portrait }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  const W = EDGE_LEN.whip;
  let tx = 0;
  let blur = 0;
  if (shot.out === "whip" && f >= shot.dur - W) {
    const p = easeInOut((f - (shot.dur - W) + 1) / W);
    tx = -p * 0.24 * width;
    blur = 80 * p;
  }
  if (shot.in === "whip" && f < W) {
    const p = 1 - easeInOut((f + 1) / (W + 1));
    tx = p * 0.24 * width;
    blur = 80 * p;
  }
  let opacity = 1;
  if (shot.out === "black") opacity *= interpolate(f, [shot.dur - EDGE_LEN.black, shot.dur], [1, 0], clamp);
  if (shot.in === "black") opacity *= interpolate(f, [0, EDGE_LEN.black], [0, 1], clamp);
  if (shot.in === "dissolve") opacity *= interpolate(f, [0, EDGE_LEN.dissolve], [0, 1], { ...clamp, easing: easeInOut });
  const fid = `hb-${shot.id}`;
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={fid} x="-20%" y="0" width="140%" height="100%">
          <feGaussianBlur stdDeviation={`${blur.toFixed(1)} 0`} />
        </filter>
      </svg>
      <OffthreadVideo
        src={staticFile(`ad/v2/${portrait ? "v" : "h"}/${shot.id}.mp4`)}
        startFrom={Math.round(shot.src * 30)}
        playbackRate={shot.rate}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translateX(${tx}px) scale(${1 + blur / 2000})`,
          filter: `${blur > 0.5 ? `url(#${fid}) ` : ""}contrast(1.05) saturate(1.04) brightness(0.98)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** the phone's light blooms into the sunrise: bedroom -> rooftop */
const Bloom: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at - 10, at, at + 14], [0, 0.95, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(70% 70% at 58% 45%, rgba(255,246,232,1) 0%, rgba(255,214,170,.92) 45%, rgba(255,170,110,.75) 100%)",
        opacity: o,
        mixBlendMode: "screen",
      }}
    />
  );
};

/* ----------------------------------------------------------------- text */
const TimeCard: React.FC = () => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const o = interpolate(f, [0, 6, CARD.dur - 6, CARD.dur], [0, 1, 1, 0], clamp);
  const ls = interpolate(f, [0, CARD.dur], [0.5, 0.62]);
  return (
    <AbsoluteFill style={{ background: "#000", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: o, textAlign: "center", transform: `scale(${interpolate(f, [0, CARD.dur], [1.03, 1])})` }}>
        <div style={{ direction: "rtl", fontFamily: FONTS.display, fontWeight: 900, fontSize: height * 0.085, color: "#fff" }}>{CARD.text}</div>
        <div style={{ fontFamily: FONTS.latin, fontWeight: 600, fontSize: height * 0.022, letterSpacing: `${ls}em`, color: COLORS.orange, marginTop: height * 0.012 }}>
          {CARD.latin}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Super: React.FC<{ text: string; dur: number; portrait: boolean }> = ({ text, dur, portrait }) => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const inP = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(f, [dur - 10, dur], [0, 1], clamp);
  const size = portrait ? 100 : 84;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: portrait ? height * 0.7 : undefined, bottom: portrait ? undefined : height * 0.12, textAlign: "center", direction: "rtl", opacity: 1 - outP }}>
      <span
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.15,
          color: "#fff",
          textShadow: "0 6px 40px rgba(0,0,0,.6)",
          clipPath: `inset(0 0 0 ${(1 - inP) * 100}%)`,
          transform: `translateY(${(1 - inP) * 18}px)`,
        }}
      >
        {text}
      </span>
      <div style={{ height: 6, width: interpolate(inP, [0, 1], [0, portrait ? 120 : 96]), background: COLORS.orange, borderRadius: 4, margin: "16px auto 0" }} />
    </div>
  );
};

/** reshape-online.com typed on screen in sync with his thumb on the phone (the site "speaks") */
const UrlType: React.FC<{ portrait: boolean }> = ({ portrait }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = Math.min(URL_TYPE.text.length, Math.max(0, Math.floor((f / URL_TYPE.typeFrames) * URL_TYPE.text.length)));
  const typed = URL_TYPE.text.slice(0, n);
  const done = f >= URL_TYPE.typeFrames;
  const o = interpolate(f, [0, 4, URL_TYPE.hold - 14, URL_TYPE.hold], [0, 1, 1, 0], clamp);
  const caretOn = !done || Math.floor(f / 8) % 2 === 0;
  const under = interpolate(f, [URL_TYPE.typeFrames, URL_TYPE.typeFrames + 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const size = portrait ? 78 : 92;
  return (
    <div
      style={{
        position: "absolute",
        left: portrait ? 0 : width * 0.06,
        right: portrait ? 0 : undefined,
        top: portrait ? height * 0.12 : height * 0.11,
        textAlign: portrait ? "center" : "left",
        direction: "ltr",
        opacity: o,
      }}
    >
      <span style={{ fontFamily: FONTS.latin, fontWeight: 700, fontSize: size, color: "#fff", letterSpacing: "0.01em", textShadow: "0 4px 30px rgba(0,0,0,.55)" }}>
        {typed}
        <span style={{ display: "inline-block", width: size * 0.06, height: size * 0.92, marginLeft: size * 0.05, background: COLORS.orange, verticalAlign: "-0.12em", opacity: caretOn ? 1 : 0 }} />
      </span>
      <div style={{ height: 6, width: under * (portrait ? 220 : 260), background: COLORS.orange, borderRadius: 4, margin: portrait ? "14px auto 0" : "14px 0 0 0" }} />
    </div>
  );
};

/* ----------------------------------------------------- the website, full screen */
type Geo = { cx: number; cy: number; w: number; h: number; rot: number };

const quadGeo = (q: number[][], srcW: number, srcH: number, W: number, H: number): Geo => {
  const s = Math.max(W / srcW, H / srcH);
  const ox = (W - srcW * s) / 2;
  const oy = (H - srcH * s) / 2;
  const p = q.map(([x, y]) => [x * s + ox, y * s + oy]);
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const w = (dist(p[0], p[1]) + dist(p[3], p[2])) / 2;
  const h = (dist(p[0], p[3]) + dist(p[1], p[2])) / 2;
  const cx = p.reduce((a, b) => a + b[0], 0) / 4;
  const cy = p.reduce((a, b) => a + b[1], 0) / 4;
  const rot = (Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]) * 180) / Math.PI;
  return { cx, cy, w, h, rot };
};

const WebStage: React.FC<{ portrait: boolean }> = ({ portrait }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const q = SCREEN_QUADS[portrait ? "v" : "h"];
  const start = quadGeo(q.quad, q.w, q.h, width, height);
  const th = portrait ? height * 0.66 : height * 0.8;
  const target: Geo = portrait
    ? { cx: width / 2, cy: height * 0.6, w: th * SCREEN_AR, h: th, rot: 0 }
    : { cx: width * 0.68, cy: height * 0.5, w: th * SCREEN_AR, h: th, rot: 0 };
  const k = spring({ frame: f, fps, config: { damping: 20, stiffness: 70, mass: 1 } });
  const g: Geo = {
    cx: interpolate(k, [0, 1], [start.cx, target.cx]),
    cy: interpolate(k, [0, 1], [start.cy, target.cy]),
    w: interpolate(k, [0, 1], [start.w, target.w]),
    h: interpolate(k, [0, 1], [start.h, target.h]),
    rot: interpolate(k, [0, 1], [start.rot, target.rot]),
  };
  const bezel = g.h * 0.018;
  const radius = g.h * 0.064;
  const idx = Math.min(WEB.n - 1, WEB.trackStart + f);
  // the dusk frame we fly out of: it pushes toward the phone and melts within ~9 frames,
  // so the hand-held phone never reads as a second phone behind the stage phone
  const bgFade = interpolate(f, [0, 9], [1, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  const tiltY = portrait ? 0 : interpolate(k, [0, 1], [0, -7]);
  const exit = interpolate(f, [WEB.dur - 8, WEB.dur], [0, 1], clamp);
  const chips = ["برنامجك", "فيديو لكل تمرين", "تغذيتك", "تقدّمك"];
  return (
    <AbsoluteFill style={{ background: "#07080A", opacity: 1 - exit * 0.0 }}>
      {/* stage: deep dusk blue into the brand's dark, with a warm glow behind the phone */}
      <AbsoluteFill style={{ background: "radial-gradient(90% 80% at 50% 0%, #142039 0%, #0A0D16 55%, #07080A 100%)" }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "70% 40%" : "34% 62%"} at ${portrait ? "50% 60%" : "68% 50%"}, rgba(255,84,32,${0.28 * k}), rgba(0,0,0,0) 70%)`,
        }}
      />
      {/* the dusk footage we flew out of, fading under the stage */}
      {bgFade > 0 ? (
        <AbsoluteFill style={{ opacity: bgFade }}>
          <OffthreadVideo
            src={staticFile(`ad/v2/${portrait ? "v" : "h"}/c12.mp4`)}
            startFrom={Math.round(5.95 * 30)}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transformOrigin: `${(start.cx / width) * 100}% ${(start.cy / height) * 100}%`,
              transform: `scale(${1 + (1 - bgFade) * 0.35})`,
              filter: `blur(${(1 - bgFade) * 34}px) brightness(${0.5 + 0.4 * bgFade})`,
            }}
          />
        </AbsoluteFill>
      ) : null}
      {!portrait ? (
        <div style={{ position: "absolute", left: width * 0.07, top: height * 0.3, width: width * 0.42, opacity: interpolate(f, [8, 22], [0, 1], clamp) }}>
          <div style={{ direction: "ltr", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 88, color: "#fff", transform: `translateY(${interpolate(f, [8, 26], [20, 0], clamp)}px)` }}>
            reshape-online.com
          </div>
          <div style={{ height: 6, width: 260, background: COLORS.orange, borderRadius: 4, marginTop: 14 }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 40, direction: "rtl", justifyContent: "flex-end", width: width * 0.42 }}>
            {chips.map((c, i) => {
              const o = interpolate(f, [24 + i * 9, 36 + i * 9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
              return (
                <span
                  key={c}
                  style={{
                    fontFamily: FONTS.body,
                    fontWeight: 600,
                    fontSize: 34,
                    color: "#fff",
                    padding: "10px 24px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.07)",
                    border: "1.5px solid rgba(255,255,255,.16)",
                    opacity: o,
                    transform: `translateY(${(1 - o) * 14}px)`,
                  }}
                >
                  {c}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ position: "absolute", left: 0, right: 0, top: height * 0.115, textAlign: "center", opacity: interpolate(f, [8, 22], [0, 1], clamp) }}>
          <div style={{ direction: "ltr", fontFamily: FONTS.latin, fontWeight: 700, fontSize: 84, color: "#fff" }}>reshape-online.com</div>
          <div style={{ height: 6, width: 220, background: COLORS.orange, borderRadius: 4, margin: "14px auto 0" }} />
        </div>
      )}
      {/* phone */}
      <div
        style={{
          position: "absolute",
          left: g.cx - g.w / 2 - bezel,
          top: g.cy - g.h / 2 - bezel,
          width: g.w + bezel * 2,
          height: g.h + bezel * 2,
          borderRadius: radius + bezel,
          padding: bezel,
          background: "linear-gradient(145deg,#3a3c40,#121315 40%,#26282c)",
          boxShadow: `0 ${g.h * 0.06}px ${g.h * 0.12}px rgba(0,0,0,.6), 0 0 0 1.2px rgba(255,255,255,.08) inset, 0 0 ${g.h * 0.1}px rgba(255,84,32,${0.22 * k})`,
          transform: `perspective(${g.h * 3}px) rotateY(${tiltY}deg) rotate(${g.rot}deg)`,
        }}
      >
        <div style={{ width: g.w, height: g.h, borderRadius: radius, overflow: "hidden", position: "relative", background: "#0E0F11" }}>
          <Img src={staticFile(`${WEB.dir}/${String(idx).padStart(4, "0")}.jpg`)} style={{ width: "100%", height: "100%", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 70%, rgba(255,255,255,.04) 100%)" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- end card */
const EndCard: React.FC<{ portrait: boolean }> = ({ portrait }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - 2, fps, config: { damping: 14, stiffness: 120 } });
  const word = interpolate(f, [8, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cta = interpolate(f, [18, 34], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const url = interpolate(f, [30, 46], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const logoW = portrait ? 820 : 760;
  return (
    <AbsoluteFill style={{ background: "#08090A", alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill style={{ background: `radial-gradient(${portrait ? "80% 40%" : "50% 60%"} at 50% 48%, rgba(255,84,32,${0.22 * pop}), rgba(0,0,0,0) 70%)` }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: portrait ? 56 : 38, transform: `translateY(${portrait ? -60 : -10}px)` }}>
        <div style={{ transform: `scale(${interpolate(pop, [0, 1], [0.86, 1])})`, opacity: Math.min(1, pop * 1.5) }}>
          <LogoLockup width={logoW} wordReveal={word} wordColor="#FFFFFF" />
        </div>
        <div style={{ direction: "rtl", fontFamily: FONTS.display, fontWeight: 900, fontSize: portrait ? 92 : 78, color: "#fff", opacity: cta, transform: `translateY(${(1 - cta) * 22}px)`, textAlign: "center" }}>
          اشترك اليوم… <span style={{ color: COLORS.orange }}>ولا تتردد.</span>
        </div>
        <div
          style={{
            direction: "ltr",
            unicodeBidi: "isolate",
            display: "flex",
            alignItems: "center",
            gap: portrait ? 18 : 14,
            fontFamily: FONTS.latin,
            fontWeight: 700,
            fontSize: portrait ? 58 : 48,
            letterSpacing: "0.03em",
            color: "#fff",
            opacity: url,
            transform: `translateY(${(1 - url) * 16}px)`,
            padding: portrait ? "18px 46px" : "14px 38px",
            borderRadius: 999,
            border: `2px solid ${COLORS.orange}`,
            background: "rgba(255,84,32,.10)",
            boxShadow: `0 0 ${40 * url}px rgba(255,84,32,.25)`,
          }}
        >
          <svg width={portrait ? 46 : 38} height={portrait ? 46 : 38} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8}>
            <circle cx="12" cy="12" r="9.2" />
            <path d="M2.8 12h18.4M12 2.8c2.6 2.6 3.9 5.6 3.9 9.2s-1.3 6.6-3.9 9.2M12 2.8C9.4 5.4 8.1 8.4 8.1 12s1.3 6.6 3.9 9.2" />
          </svg>
          reshape-online.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- the edit */
export const OneDay: React.FC<OneDayProps> = ({ portrait }) => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {CLIPS.map((sh) => (
        <Sequence key={sh.id} from={sh.from} durationInFrames={sh.dur} premountFor={30}>
          <Clip shot={sh} portrait={portrait} />
        </Sequence>
      ))}
      <Bloom at={CLIPS[1].from} />
      <Sequence from={CARD.from} durationInFrames={CARD.dur}>
        <TimeCard />
      </Sequence>
      {SUPERS.map((sp, i) => (
        <Sequence key={`s${i}`} from={sp.from} durationInFrames={sp.dur}>
          <Super text={sp.text} dur={sp.dur} portrait={portrait} />
        </Sequence>
      ))}
      <Sequence from={URL_TYPE.from} durationInFrames={URL_TYPE.hold}>
        <UrlType portrait={portrait} />
      </Sequence>
      <Sequence from={WEB.from} durationInFrames={WEB.dur} premountFor={30}>
        <WebStage portrait={portrait} />
      </Sequence>
      <Sequence from={END.from} durationInFrames={END.dur}>
        <EndCard portrait={portrait} />
      </Sequence>
      <Vignette strength={0.45} />
      <Grain opacity={0.055} />
      <Audio src={staticFile("ad/oneday_mix.wav")} />
    </AbsoluteFill>
  );
};
