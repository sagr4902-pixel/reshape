import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { KineticWords } from "../../components/KineticWords";
import { Athlete, Pose, jumpSquat, kbSwing, lerpPose, solve, squat } from "../Athlete";
import { MCOLORS } from "../design";
import { Chevrons, DrawPath, Glow, LayeredWord, Particles, PerspectiveFloor, Ring, SlantBar, easeInOut, prog } from "../kit";
import { mword } from "../timeline";

// SCENE 3 — IN-CLUB GROUP TRAINING (12.9–19.7 s)
// "حصص جماعية، أجواء حماسية، وتحدّي يخلّيك تطلع أفضل من كل تمرين."
// A class formation on a 2.5D floor: synchronised squats linked by a constellation of lines
// (the group), then jump squats with landing shockwaves (the energy), then one athlete steps
// forward into a kettlebell swing with its motion path drawn on (the challenge).

const w = (t: string, n = 0) => mword("group", t, n);
const T = {
  hisas: w("حصص"),
  jamaiya: w("جماعية"),
  ajwaa: w("أجواء"),
  hamasiya: w("حماسية"),
  tahaddi: w("وتحدّي"),
  yikhallik: w("يخلّيك"),
  titla: w("تطلع"),
  afdal: w("أفضل"),
  min: w("من"),
  kul: w("كل", 2),
  tamreen: w("تمرين", 2),
};
const COPY1_OUT = T.ajwaa - 8;
const COPY2_OUT = T.tahaddi - 8;
const JUMP_FROM = T.ajwaa - 4; // formation switches from squats to jump squats
const HERO_AT = T.tahaddi - 4; // hero athlete steps forward
const SQUAT_LEN = 30; // frames per rep
const JUMP_LEN = 22;

type Member = { x: number; floor: number; scale: number; row: 0 | 1 | 2; delay: number };
const ROWS = [
  { color: "#5C5D62", far: "#36373B", blur: 2.2 },
  { color: "#A9AAAE", far: "#4B4C51", blur: 0.8 },
  { color: MCOLORS.white, far: "#5E6066", blur: 0 },
];
// back row → front row; x staggered so every athlete stays readable
const MEMBERS: Member[] = [
  { x: 190, floor: 1150, scale: 0.86, row: 0, delay: 6 },
  { x: 420, floor: 1150, scale: 0.86, row: 0, delay: 9 },
  { x: 650, floor: 1150, scale: 0.86, row: 0, delay: 12 },
  { x: 880, floor: 1150, scale: 0.86, row: 0, delay: 15 },
  { x: 290, floor: 1330, scale: 1.12, row: 1, delay: 3 },
  { x: 560, floor: 1330, scale: 1.12, row: 1, delay: 6 },
  { x: 830, floor: 1330, scale: 1.12, row: 1, delay: 9 },
  { x: 160, floor: 1545, scale: 1.42, row: 2, delay: 0 },
  { x: 470, floor: 1545, scale: 1.42, row: 2, delay: 2 },
  { x: 780, floor: 1545, scale: 1.42, row: 2, delay: 4 },
];

/** Shared pose of the whole class at a frame: squats, blending into jump squats. */
const classPose = (frame: number): { pose: Pose; jumpPhase: number } => {
  const sq = squat((frame - T.hisas + 6) / SQUAT_LEN);
  const jumpPhase = (frame - JUMP_FROM) / JUMP_LEN;
  const js = jumpSquat(jumpPhase);
  const blend = prog(frame, JUMP_FROM - 6, JUMP_FROM + 4, easeInOut);
  return { pose: lerpPose(sq, js, blend), jumpPhase };
};

const headOf = (m: Member, pose: Pose): [number, number] => {
  const s = solve(pose);
  return [m.x + s.head[0] * m.scale, m.floor + s.head[1] * m.scale];
};

export const M3Group: React.FC = () => {
  const frame = useCurrentFrame();
  const { pose } = classPose(frame);

  // the formation recedes when the hero steps forward
  const recede = prog(frame, HERO_AT, HERO_AT + 18, easeInOut);
  const stageScale = 1 - recede * 0.14;
  const stageDim = 1 - recede * 0.62;

  // landing beats of the jump squats (phase 0.7 of each rep)
  const landings: number[] = [];
  for (let k = 0; k < 6; k++) {
    const f = JUMP_FROM + (k + 0.7) * JUMP_LEN;
    if (f < HERO_AT + 6) landings.push(Math.round(f));
  }

  // hero: kettlebell swing, path of the bell drawn on
  const heroIn = prog(frame, HERO_AT, HERO_AT + 16);
  const heroPhase = (frame - HERO_AT) / 34;
  const heroX = interpolate(heroIn, [0, 1], [1180, 470]);
  const HERO_FLOOR = 1610;
  const HERO_SCALE = 2.0;
  const bellPath = (() => {
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const s = solve(kbSwing(i / 48));
      const h = s.armN[2];
      pts.push(`${(470 + h[0] * HERO_SCALE).toFixed(1)},${(HERO_FLOOR + (h[1] + 26) * HERO_SCALE).toFixed(1)}`);
    }
    return `M${pts.join(" L")}`;
  })();

  return (
    <AbsoluteFill>
      {/* 2.5D studio floor */}
      <svg width={1080} height={1920} style={{ position: "absolute", opacity: prog(frame, 0, 14) }}>
        <PerspectiveFloor horizon={1000} opacity={0.9 * stageDim + 0.1} scroll={frame / 70} />
      </svg>
      <Glow x={540} y={1250} r={520} opacity={0.18 + 0.16 * prog(frame, JUMP_FROM, JUMP_FROM + 10) * (1 - recede)} />

      {/* the class */}
      <AbsoluteFill style={{ transform: `scale(${stageScale}) translateY(${-recede * 90}px)`, transformOrigin: "540px 1000px", opacity: stageDim }}>
        {[0, 1, 2].map((row) => (
          <svg key={row} width={1080} height={1920} style={{ position: "absolute", filter: ROWS[row].blur ? `blur(${ROWS[row].blur}px)` : undefined }}>
            {row === 2 ? <line x1={60} x2={1020} y1={1545} y2={1545} stroke={MCOLORS.orange} strokeWidth={4} opacity={0.5 * prog(frame, 4, 20)} /> : null}
            {MEMBERS.filter((m) => m.row === row).map((m, i) => {
              const a = prog(frame, m.delay, m.delay + 14);
              if (a <= 0) return null;
              return (
                <g key={i} style={{ clipPath: `inset(${(1 - a) * 100}% 0 0 0)` }}>
                  <Athlete pose={pose} x={m.x} y={m.floor} scale={m.scale} color={ROWS[row].color} farColor={ROWS[row].far} />
                </g>
              );
            })}
          </svg>
        ))}

        {/* constellation: the group is one unit */}
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {(() => {
            const heads = MEMBERS.map((m) => headOf(m, pose));
            const links: [number, number][] = [
              [0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [7, 8], [8, 9],
              [0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [4, 7], [4, 8], [5, 8], [5, 9], [6, 9],
            ];
            const lp = prog(frame, T.jamaiya - 2, T.jamaiya + 18, easeInOut) * (1 - prog(frame, HERO_AT - 6, HERO_AT + 6));
            if (lp <= 0) return null;
            return (
              <g>
                {links.map(([a, b], i) => {
                  const k = Math.max(0, Math.min(1, lp * links.length * 0.18 - i * 0.12));
                  const [x1, y1] = heads[a];
                  const [x2, y2] = heads[b];
                  return <line key={i} x1={x1} y1={y1 - 26} x2={x1 + (x2 - x1) * k} y2={y1 - 26 + (y2 - y1) * k} stroke={MCOLORS.orange} strokeWidth={2} opacity={0.55 * lp} />;
                })}
                {heads.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y - 26} r={5 + 2 * Math.sin(frame / 6 + i)} fill={MCOLORS.orange} opacity={lp} />
                ))}
              </g>
            );
          })()}
          {/* landing shockwaves under the front row */}
          {landings.map((f, i) =>
            MEMBERS.filter((m) => m.row === 2).map((m, j) => <Ring key={`${i}-${j}`} x={m.x + 20} y={1545} at={f} r0={30} r1={190} dur={16} width={6} squash={0.22} />),
          )}
          {frame >= JUMP_FROM ? <Particles count={34} seed="grp" opacity={0.6 * prog(frame, JUMP_FROM, JUMP_FROM + 12) * (1 - recede)} area={[0, 900, 1080, 800]} /> : null}
        </svg>
      </AbsoluteFill>

      {/* COPY 1 — حصص جماعية */}
      <SlantBar x={330} y={548} w={420} h={12} inAt={T.jamaiya} outAt={COPY1_OUT} dur={10} />
      <div style={{ position: "absolute", left: 90, width: 900, top: 330 }}>
        <KineticWords
          fontSize={150}
          out={COPY1_OUT}
          words={[
            { text: "حصص", at: T.hisas },
            { text: "جماعية", at: T.jamaiya, color: MCOLORS.orange },
          ]}
        />
      </div>

      {/* COPY 2 — أجواء حماسية */}
      <div style={{ position: "absolute", left: 90, width: 900, top: 330 }}>
        <KineticWords
          fontSize={150}
          style="slam"
          out={COPY2_OUT}
          words={[
            { text: "أجواء", at: T.ajwaa },
            { text: "حماسية", at: T.hamasiya, color: MCOLORS.orange },
          ]}
        />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <DrawPath d="M990,560 L90,560" at={T.hamasiya} dur={10} width={5} out={COPY2_OUT} />
      </svg>

      {/* hero athlete: the challenge */}
      {heroIn > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <DrawPath d={bellPath} at={HERO_AT + 14} dur={22} width={4} stroke={MCOLORS.orange} opacity={0.85} />
          <line x1={120} x2={960} y1={HERO_FLOOR} y2={HERO_FLOOR} stroke={MCOLORS.white} strokeWidth={4} opacity={0.4 * heroIn} />
          <g opacity={heroIn}>
            <Athlete
              pose={kbSwing(heroPhase)}
              x={heroX}
              y={HERO_FLOOR}
              scale={HERO_SCALE}
              prop="kettlebell"
              rim={6}
              trail={[kbSwing(heroPhase - 0.05), kbSwing(heroPhase - 0.1)]}
            />
          </g>
          <Chevrons x={930} y={1350} count={4} gap={58} size={30} opacity={0.75 * prog(frame, T.afdal - 4, T.afdal + 8)} />
        </svg>
      ) : null}

      {/* COPY 3 — وتحدّي يخلّيك تطلع أفضل من كل تمرين */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 270 }}>
        <LayeredWord text="وتحدّي" at={T.tahaddi} size={210} color={MCOLORS.orange} echo={MCOLORS.white} />
      </div>
      <div style={{ position: "absolute", left: 90, width: 900, top: 548 }}>
        <KineticWords
          fontSize={82}
          weight={800}
          words={[
            { text: "يخلّيك", at: T.yikhallik },
            { text: "تطلع", at: T.titla },
            { text: "أفضل", at: T.afdal, color: MCOLORS.orange },
          ]}
        />
      </div>
      <div style={{ position: "absolute", left: 90, width: 900, top: 648 }}>
        <KineticWords
          fontSize={82}
          weight={800}
          words={[
            { text: "من", at: T.min },
            { text: "كلّ", at: T.kul },
            { text: "تمرين", at: T.tamreen },
          ]}
        />
      </div>
      <SlantBar x={400} y={790} w={280} h={10} inAt={T.tamreen} dur={10} />
    </AbsoluteFill>
  );
};
