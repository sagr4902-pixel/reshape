import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Athlete, P, climb, deadlift, jumpSquat, kbSwing, run, squat } from "./Athlete";
import { MCOLORS } from "./design";

// Look-dev sheet for the pictogram rig.
export const MotionLab: React.FC = () => {
  const f = useCurrentFrame();
  const ph = (f % 30) / 30;
  const cells = [
    { name: "stand", pose: P.stand },
    { name: "squat", pose: squat(ph) },
    { name: "kbSwing", pose: kbSwing(ph), prop: "kettlebell" as const },
    { name: "deadlift", pose: deadlift(ph), prop: "plate" as const },
    { name: "run", pose: run(ph) },
    { name: "jumpSquat", pose: jumpSquat(ph) },
    { name: "climb", pose: climb(ph) },
    { name: "victory", pose: P.victory },
    { name: "ready", pose: P.ready },
  ];
  return (
    <AbsoluteFill style={{ background: MCOLORS.black }}>
      <svg width={1080} height={1920}>
        {cells.map((c, i) => {
          const cx = 180 + (i % 3) * 360;
          const cy = 520 + Math.floor(i / 3) * 600;
          return (
            <g key={c.name}>
              <line x1={cx - 150} x2={cx + 150} y1={cy} y2={cy} stroke="#333" strokeWidth={3} />
              <Athlete pose={c.pose} x={cx - 20} y={cy} scale={1.25} prop={c.prop} />
              <text x={cx} y={cy + 60} fill="#777" fontSize={28} textAnchor="middle" fontFamily="sans-serif">{c.name}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
