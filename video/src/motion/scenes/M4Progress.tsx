import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { KineticWords } from "../../components/KineticWords";
import { Athlete, P, climb, lerpPose } from "../Athlete";
import { MCOLORS } from "../design";
import { Chevrons, DrawPath, Glow, LayeredWord, ProgressBar, Ring, clamp, easeInOut, easeOut, prog } from "../kit";
import { mword } from "../timeline";

// SCENE 4 — MOTIVATION / PROGRESS (19.7–24.7 s)
// "مهما كان مستواك… هنا تبدا خطوتك للأفضل."
// Five slanted levels rise right→left (reading direction). "هنا" marks the first one; on
// "تبدا" the athlete climbs, each level filling orange as it is reached. No numbers, no claims.

const w = (t: string, n = 0) => mword("transformation", t, n);
const T = {
  mahma: w("مهما"),
  kan: w("كان"),
  mustawak: w("مستواك"),
  hina: w("هنا"),
  tabda: w("تبدا"),
  khutwatak: w("خطوتك"),
  afdal: w("للأفضل"),
};
const LINE1_OUT = T.hina - 8;
const CLIMB_FROM = T.tabda;
const CLIMB_TO = T.afdal + 22;

const BASE = 1560;
const SKEW = Math.tan((14 * Math.PI) / 180);
const BW = 132;
// level i: index 0 is the rightmost (start), rising to the left
const LEVELS = Array.from({ length: 5 }, (_, i) => ({ x0: 790 - i * 165, h: 120 + i * 92 }));
const topCenter = (i: number): [number, number] => {
  const l = LEVELS[i];
  return [l.x0 + BW / 2 + SKEW * l.h, BASE - l.h];
};
const levelPath = (x0: number, h: number) => `M${x0},${BASE} L${x0 + BW},${BASE} L${x0 + BW + SKEW * h},${BASE - h} L${x0 + SKEW * h},${BASE - h} Z`;

export const M4Progress: React.FC = () => {
  const frame = useCurrentFrame();

  // climb progress in level units (0 → 4)
  const u = interpolate(frame, [CLIMB_FROM, CLIMB_TO], [0, 4], { ...clamp, easing: easeInOut });
  const i0 = Math.min(3, Math.floor(u));
  const f = u - i0;
  const [ax, ay] = topCenter(i0);
  const [bx, by] = topCenter(i0 + 1);
  const ef = 0.5 - 0.5 * Math.cos(Math.PI * f);
  const hop = Math.sin(Math.PI * f) * 46;
  const athX = ax + (bx - ax) * ef;
  const athY = ay + (by - ay) * ef - hop;
  const moving = frame > CLIMB_FROM && frame < CLIMB_TO;
  const toVictory = prog(frame, CLIMB_TO - 4, CLIMB_TO + 10);
  const pose = lerpPose(lerpPose(P.ready, climb(u * 1.0), prog(frame, CLIMB_FROM - 4, CLIMB_FROM + 4)), P.victory, toVictory);
  const athIn = prog(frame, T.hina - 6, T.hina + 8);
  const [sx, sy] = topCenter(0);

  return (
    <AbsoluteFill>
      <Glow x={athX} y={athY - 150} r={360} opacity={0.22 * athIn} />

      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {/* faint scaffold of the path upward */}
        <DrawPath d={`M${sx},${sy - 8} ${LEVELS.map((_, i) => `L${topCenter(i)[0]},${topCenter(i)[1] - 8}`).join(" ")}`} at={T.mustawak} dur={24} width={2} stroke={MCOLORS.white} opacity={0.25} cap="butt" />
        <line x1={80} x2={1000} y1={BASE} y2={BASE} stroke={MCOLORS.white} strokeWidth={3} opacity={0.3 * prog(frame, 0, 12)} />

        {LEVELS.map((l, i) => {
          const rise = prog(frame, T.mustawak - 6 + i * 4, T.mustawak + 12 + i * 4, easeOut);
          if (rise <= 0) return null;
          const h = l.h * rise;
          // level 0 lights up on "هنا", the others as the athlete reaches them
          const lit = i === 0 ? prog(frame, T.hina, T.hina + 6) : prog(u, i - 0.35, i, easeOut);
          return (
            <g key={i}>
              <path d={levelPath(l.x0, h)} fill={MCOLORS.panel} stroke="rgba(255,255,255,0.22)" strokeWidth={2} />
              <path d={levelPath(l.x0, h)} fill={MCOLORS.orange} opacity={lit} />
              <path d={`M${l.x0 + SKEW * h},${BASE - h} L${l.x0 + BW + SKEW * h},${BASE - h}`} stroke={lit > 0.5 ? MCOLORS.orangeHi : MCOLORS.white} strokeWidth={6} opacity={0.9} />
            </g>
          );
        })}

        {/* "هنا": the starting point is marked */}
        <Ring x={sx} y={sy} at={T.hina} r0={20} r1={170} dur={18} width={6} squash={0.3} />
        <Ring x={sx} y={sy} at={T.hina + 8} r0={20} r1={130} dur={18} width={4} squash={0.3} />
        <DrawPath d={`M${sx},${sy - 420} L${sx},${sy - 330}`} at={T.hina - 2} dur={8} width={6} out={CLIMB_FROM + 4} />
        <path
          d={`M${sx - 18},${sy - 352} L${sx},${sy - 328} L${sx + 18},${sy - 352}`}
          fill="none"
          stroke={MCOLORS.orange}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={prog(frame, T.hina + 4, T.hina + 8) * (1 - prog(frame, CLIMB_FROM + 4, CLIMB_FROM + 12))}
        />

        {/* athlete (faces left: the direction of progress) */}
        {athIn > 0 ? (
          <g opacity={athIn} style={{ clipPath: `inset(${(1 - athIn) * 100}% 0 0 0)` }}>
            <Athlete pose={pose} x={athX - 12} y={athY} scale={1.12} flip rim={moving || toVictory > 0 ? 5 : 0} bg={MCOLORS.black} />
          </g>
        ) : null}

        <Chevrons x={topCenter(4)[0] + 10} y={topCenter(4)[1] - 400} count={4} gap={52} size={30} opacity={prog(frame, T.afdal, T.afdal + 10)} />

        {/* RTL progress bar */}
        <g opacity={prog(frame, T.mustawak, T.mustawak + 12)}>
          <ProgressBar x={140} y={1612} w={800} value={0.06 + 0.94 * (u / 4)} ticks={4} h={12} />
        </g>
      </svg>

      {/* LINE 1 — مهما كان مستواك… */}
      <div style={{ position: "absolute", left: 90, width: 900, top: 330 }}>
        <KineticWords
          fontSize={118}
          out={LINE1_OUT}
          words={[
            { text: "مهما", at: T.mahma },
            { text: "كان", at: T.kan },
            { text: "مستواك…", at: T.mustawak, color: MCOLORS.orange },
          ]}
        />
      </div>

      {/* LINE 2 — هنا تبدا خطوتك للأفضل */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 250 }}>
        <LayeredWord text="هنا" at={T.hina} size={230} color={MCOLORS.orange} echo={MCOLORS.white} />
      </div>
      <div style={{ position: "absolute", left: 90, width: 900, top: 548 }}>
        <KineticWords
          fontSize={92}
          weight={800}
          words={[
            { text: "تبدا", at: T.tabda },
            { text: "خطوتك", at: T.khutwatak },
            { text: "للأفضل", at: T.afdal, color: MCOLORS.orange },
          ]}
        />
      </div>
    </AbsoluteFill>
  );
};
