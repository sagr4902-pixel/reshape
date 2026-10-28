import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Dust } from "../../cgi/Atmosphere";
import { Studio } from "../../cgi/Studio";
import { shakeAt } from "./motion";
import { GymSet, KettlebellGrid, Rig, RopeLine, SlamLine } from "./Setups";
import { cameraAt, shotAt } from "./shots";

/**
 * One WebGL canvas for a footage slot. `offset` converts the Sequence-relative frame back to
 * the scene frame so every motion stays phase-locked to the music across the slot boundary.
 */
export const GroupCgi: React.FC<{ offset: number; hits: Hit[] }> = ({ offset, hits }) => {
  const f = useCurrentFrame() + offset;
  const t = f / 30;
  const shot = shotAt(f);
  const camera = cameraAt(shot, f);

  // camera shake: big on the drop / crash, small on each slam impact
  let sx = 0;
  let sy = 0;
  let sr = 0;
  for (const h of hits) {
    const s = shakeAt(f, h.at, h.amount, h.decay);
    sx += s.x;
    sy += s.y;
    sr += s.r;
  }

  // drop at f0: the whole formation bursts a dust cloud off the floor
  const burst = f < 30 ? Math.exp(-f / 9) * 1.0 : 0;

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg) scale(1.04)`,
      }}
    >
      <Studio camera={camera} fog={shot.fog ?? [7, 24]} envIntensity={shot.setup === "kb" ? 0.55 : 0.35}>
        {shot.setup === "kb" ? (
          <>
            <Rig rimPos={[-2.0, 3.0, -6.0]} keyPos={[4.6, 2.4, 4.0]} target={[0, 0.7, -0.6]} rim={120} key_={45} top={20} angle={0.36} kicker={{ pos: [2.8, 0.6, -3.2], intensity: 6 }} />
            <GymSet time={t} lineY={0.32} wash={0.5} />
            <KettlebellGrid f={f} />
            {burst > 0.02 ? (
              <Dust time={t} count={120} size={0.06} opacity={0.5 * burst} center={[0, 0.25, -0.6]} box={[3.0, 0.4, 4.4]} burst={burst * 1.4} origin={[0, 0, -0.6]} seed={5} />
            ) : null}
          </>
        ) : null}
        {shot.setup === "rope" ? (
          <>
            <Rig rimPos={[0.2, 3.0, -6.8]} keyPos={[3.5, 1.6, 4.5]} keyColor="#ffe4d2" target={[-0.2, 0.5, -1.0]} rim={95} key_={30} top={12} angle={0.36} shadowFrom="rim" kicker={{ pos: [3.2, 0.5, -1.0], intensity: 8 }} />
            <GymSet time={t} dustCenter={[0, 1.2, -1]} lineY={2.9} />
            <RopeLine time={t} />
          </>
        ) : null}
        {shot.setup === "slam" ? (
          <>
            <Rig rimPos={[-3.8, 3.0, -2.6]} keyPos={[4.4, 2.4, 3.2]} target={[-0.4, 0.4, 0]} rim={95} key_={45} top={30} angle={0.38} />
            <GymSet time={t} lineY={0.32} />
            <SlamLine f={f} />
          </>
        ) : null}
      </Studio>
    </AbsoluteFill>
  );
};

export type Hit = { at: number; amount: number; decay: number };
