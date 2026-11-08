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
import { COVER_RECT, ClipShot, EndShot, PhoneShot, SEQS, SHOTS, SUPERS } from "./timeline";

loadBrandFonts();

export type CineProps = { portrait: boolean };

const clipSrc = (id: string, portrait: boolean) =>
  staticFile(portrait ? `ad/final916/v${id}.mp4` : `ad/final169/h${id}.mp4`);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------------ footage */
const Footage: React.FC<{ shot: ClipShot; portrait: boolean }> = ({ shot, portrait }) => {
  const f = useCurrentFrame();
  const [z0, z1] = shot.zoom ?? [1.04, 1.1];
  const z = interpolate(f, [0, shot.dur], [z0, z1], clamp);
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <OffthreadVideo
        src={clipSrc(shot.clip, portrait)}
        startFrom={Math.round((shot.start ?? 0) * 30)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${z})`,
          transformOrigin: "50% 38%",
          // grade: rich blacks, warm highlights, a touch of filmic contrast
          filter: "contrast(1.08) saturate(1.05) brightness(0.96)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,10,0.35) 0%, rgba(8,8,10,0) 28%, rgba(8,8,10,0) 62%, rgba(8,8,10,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** 2.2:1 letterbox for the film shots in the 16:9 cut. */
const Letterbox: React.FC = () => {
  const { height, width } = useVideoConfig();
  const bar = Math.round((height - width / 2.2) / 2);
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: bar, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bar, background: "#000" }} />
    </>
  );
};

/* -------------------------------------------------------------------- phone */
const STATUS_H = 47; // css px of the status strip added above the 390 x 844 capture
const seqFrame = (n: number, local: number, hold?: boolean) =>
  Math.max(0, Math.min(n - 1, hold ? Math.min(local, n - 1) : local));

const StatusBar: React.FC<{ s: number }> = ({ s }) => (
  <div
    style={{
      height: STATUS_H * s,
      background: "#0E0F11",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: `0 ${26 * s}px`,
      direction: "ltr",
      color: "#fff",
      fontFamily: FONTS.latin,
      fontWeight: 600,
      fontSize: 16 * s,
    }}
  >
    <span>9:41</span>
    <span style={{ display: "flex", gap: 6 * s, alignItems: "center" }}>
      <svg width={18 * s} height={11 * s} viewBox="0 0 18 11">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 4.6} y={8 - i * 2.6} width={3.2} height={3 + i * 2.6} rx={0.8} fill="#fff" />
        ))}
      </svg>
      <svg width={26 * s} height={12 * s} viewBox="0 0 26 12">
        <rect x={0.6} y={0.6} width={22} height={10.8} rx={3} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={1.2} />
        <rect x={2.2} y={2.2} width={17} height={7.6} rx={1.8} fill="#fff" />
        <rect x={23.6} y={4} width={1.8} height={4} rx={0.8} fill="rgba(255,255,255,.5)" />
      </svg>
    </span>
  </div>
);

const Phone: React.FC<{ shot: PhoneShot; portrait: boolean }> = ({ shot, portrait }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const screenH = portrait ? 1500 : 900;
  const s = screenH / (844 + STATUS_H);
  const screenW = 390 * s;
  const bezel = 14 * s * 0.8;
  const radius = 54 * s;

  const enter = spring({ frame: f, fps, config: { damping: 18, stiffness: 90, mass: 0.9 } });
  const exit = interpolate(f, [shot.dur - 8, shot.dur], [0, 1], clamp);
  const y = interpolate(enter, [0, 1], [screenH * 0.18, 0]) + exit * -20;
  const tiltY = portrait ? 0 : interpolate(f, [0, shot.dur], [-11, -5], clamp);
  const tiltX = portrait ? interpolate(f, [0, shot.dur], [6, 2], clamp) : 3;
  const opacity = Math.min(enter * 1.4, 1) * (1 - exit);

  // which capture is on screen
  let seg = shot.segs[0];
  for (const sg of shot.segs) if (f >= sg.at) seg = sg;
  const meta = SEQS[seg.seq];
  const idx = seqFrame(meta.n, f - seg.at, seg.hold);
  const src = staticFile(`${meta.dir}/${String(idx).padStart(4, "0")}.jpg`);

  const phoneX = portrait ? width / 2 : width * 0.66;
  const phoneY = height / 2 + (portrait ? 118 : 0);

  return (
    <AbsoluteFill style={{ background: "#07080A" }}>
      {/* section backdrop: the app's own section photo, blurred and dark */}
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(shot.bg)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(34px) brightness(0.42) saturate(1.2)",
            transform: `scale(${interpolate(f, [0, shot.dur], [1.25, 1.18])})`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "70% 45%" : "38% 70%"} at ${portrait ? "50% 55%" : "66% 50%"}, ${shot.accent}40, rgba(0,0,0,0) 70%)`,
          opacity: 0.9 * opacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: phoneX - screenW / 2 - bezel,
          top: phoneY - screenH / 2 - bezel,
          width: screenW + bezel * 2,
          height: screenH + bezel * 2,
          borderRadius: radius + bezel,
          background: "linear-gradient(145deg,#3a3c40,#121315 40%,#26282c)",
          boxShadow: `0 ${60 * s}px ${120 * s}px rgba(0,0,0,.65), 0 0 0 ${1.2 * s}px rgba(255,255,255,.08) inset, 0 0 ${90 * s}px ${shot.accent}33`,
          transform: `translateY(${y}px) perspective(${2400 * s}px) rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
          opacity,
          padding: bezel,
        }}
      >
        <div style={{ width: screenW, height: screenH, borderRadius: radius, overflow: "hidden", position: "relative", background: "#0E0F11" }}>
          <StatusBar s={s} />
          <Img src={src} style={{ width: screenW, height: 844 * s, display: "block" }} />
          {shot.cover ? (
            <CoverVideo s={s} cover={shot.cover} portrait={portrait} />
          ) : null}
          {/* glass reflection */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(115deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 70%, rgba(255,255,255,.04) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Real footage playing inside the session's video cover (the "watch the technique" moment). */
const CoverVideo: React.FC<{ s: number; cover: NonNullable<PhoneShot["cover"]>; portrait: boolean }> = ({ s, cover }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [cover.at, cover.at + 8], [0, 1], clamp);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: COVER_RECT.x * s,
        top: (STATUS_H + COVER_RECT.y) * s,
        width: COVER_RECT.w * s,
        height: COVER_RECT.h * s,
        borderRadius: 16 * s,
        overflow: "hidden",
        opacity: o,
        boxShadow: `0 0 0 ${1 * s}px rgba(255,255,255,.12)`,
      }}
    >
      <Sequence from={cover.at} layout="none">
        <OffthreadVideo
          src={staticFile(`ad/final169/h${cover.clip}.mp4`)}
          startFrom={Math.round(cover.start * 30)}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.06) saturate(1.05)" }}
        />
      </Sequence>
    </div>
  );
};

/* ------------------------------------------------------------------- supers */
const Super: React.FC<{ text: string; dur: number; place: "footage" | "phone"; portrait: boolean }> = ({ text, dur, place, portrait }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const inP = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const outP = interpolate(f, [dur - 10, dur], [0, 1], clamp);
  const size = portrait ? 104 : place === "phone" ? 92 : 84;
  const box: React.CSSProperties = portrait
    ? { left: 0, right: 0, top: place === "phone" ? 70 : height * 0.68, textAlign: "center" }
    : place === "phone"
      ? { left: width * 0.04, width: width * 0.44, top: height * 0.5 - size, textAlign: "right" }
      : { left: 0, right: 0, bottom: height * 0.16, textAlign: "center" };
  return (
    <div style={{ position: "absolute", ...box, direction: "rtl", opacity: 1 - outP }}>
      <span
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1.15,
          color: "#fff",
          letterSpacing: 0,
          textShadow: "0 6px 40px rgba(0,0,0,.55)",
          clipPath: `inset(0 0 0 ${(1 - inP) * 100}%)`,
          transform: `translateY(${(1 - inP) * 18}px)`,
        }}
      >
        {text}
      </span>
      <div
        style={{
          height: portrait ? 8 : 6,
          width: interpolate(inP, [0, 1], [0, portrait ? 120 : 96]),
          background: COLORS.orange,
          borderRadius: 4,
          margin: portrait ? "22px auto 0" : place === "phone" ? "18px 0 0 auto" : "18px auto 0",
        }}
      />
    </div>
  );
};

/* ----------------------------------------------------------------- end card */
const EndCard: React.FC<{ shot: EndShot; portrait: boolean }> = ({ portrait }) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pop = spring({ frame: f - 2, fps, config: { damping: 14, stiffness: 120 } });
  const word = interpolate(f, [8, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cta = interpolate(f, [24, 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const url = interpolate(f, [34, 50], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const logoW = portrait ? 820 : 760;
  return (
    <AbsoluteFill style={{ background: "#08090A", alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "80% 40%" : "50% 60%"} at 50% 48%, rgba(255,84,32,${0.22 * pop}), rgba(0,0,0,0) 70%)`,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: portrait ? 56 : 38, transform: `translateY(${portrait ? -60 : -10}px)` }}>
        <div style={{ transform: `scale(${interpolate(pop, [0, 1], [0.86, 1])})`, opacity: Math.min(1, pop * 1.5) }}>
          <LogoLockup width={logoW} wordReveal={word} wordColor="#FFFFFF" />
        </div>
        <div
          style={{
            direction: "rtl",
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: portrait ? 92 : 78,
            color: "#fff",
            opacity: cta,
            transform: `translateY(${(1 - cta) * 22}px)`,
            textAlign: "center",
          }}
        >
          اشترك اليوم… <span style={{ color: COLORS.orange }}>ولا تتردد.</span>
        </div>
        <div
          style={{
            direction: "ltr",
            unicodeBidi: "isolate",
            fontFamily: FONTS.latin,
            fontWeight: 700,
            fontSize: portrait ? 56 : 46,
            letterSpacing: "0.04em",
            color: "rgba(255,255,255,.9)",
            opacity: url,
            transform: `translateY(${(1 - url) * 16}px)`,
            padding: portrait ? "18px 44px" : "14px 36px",
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,.18)",
            background: "rgba(255,255,255,.04)",
          }}
        >
          reshape-online.com
        </div>
      </div>
      <div style={{ position: "absolute", width, height, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- the edit */
export const Cinematic: React.FC<CineProps> = ({ portrait }) => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((sh, i) => (
        <Sequence key={i} from={sh.from} durationInFrames={sh.dur} premountFor={30}>
          {sh.kind === "clip" ? (
            <>
              <Footage shot={sh} portrait={portrait} />
              {!portrait ? <Letterbox /> : null}
            </>
          ) : sh.kind === "phone" ? (
            <Phone shot={sh} portrait={portrait} />
          ) : (
            <EndCard shot={sh} portrait={portrait} />
          )}
        </Sequence>
      ))}
      {SUPERS.map((sp, i) => (
        <Sequence key={`s${i}`} from={sp.from} durationInFrames={sp.dur}>
          <Super text={sp.text} dur={sp.dur} place={sp.place} portrait={portrait} />
        </Sequence>
      ))}
      <Vignette strength={0.5} />
      <Grain opacity={0.06} />
      <Audio src={staticFile("ad/cine_mix.wav")} />
    </AbsoluteFill>
  );
};
