import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Dust } from "../../cgi/Atmosphere";
import { GroupStage, NoReflect } from "./GroupStage";
import { shakeAt, SWING_PERIOD } from "./motion";
import { GymSet, impactGlow, KbShadows, KettlebellGrid, Rig, RopeLine, SLAM_AISLE_Z, SlamLine } from "./Setups";
import { cameraAt, shotAt, type Setup } from "./shots";

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
  // slam: orange floor flare on every impact, extra on the crash (f120)
  const glow = impactGlow(f);
  const crash = f >= 120 && f < 150 ? Math.exp(-(f - 120) / 4) : 0;
  // kettlebells: the rim swells a little as the bells float at the top of each swing
  const swingTop = 0.5 - 0.5 * Math.cos((2 * Math.PI * (((f % SWING_PERIOD) + SWING_PERIOD) % SWING_PERIOD)) / SWING_PERIOD);

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg) scale(1.04)`,
      }}
    >
      <GroupStage camera={camera} {...LOOKS[shot.setup]}>
      {shot.setup === "kb" ? (
        <>
          <Rig
            rim={{ pos: [-0.6, 3.4, -6.2], target: [0.3, 0.8, 0.2], color: "#FF5420", intensity: 300 + 80 * swingTop, angle: 0.42 }}
            key_={{ pos: [-3.0, 2.6, 3.2], target: [0, 0.7, -0.6], color: "#ffe9da", intensity: 26, angle: 0.5, penumbra: 1 }}
            top={{ pos: [0.6, 5.6, -0.6], target: [0, 0, -1.1], color: "#fff1e4", intensity: 58, angle: 0.5, penumbra: 0.85, shadow: true }}
          />
          <GymSet time={t} lineY={0.3} wash={0.14} slats={0.06} strips={0.7} dust={0.22} dustCenter={[0, 1.2, -1]} />
          <KettlebellGrid f={f} />
          <KbShadows f={f} />
          {burst > 0.02 ? (
            <NoReflect>
              <Dust time={t} count={120} size={0.05} opacity={0.4 * burst} center={[0, 0.25, -1.2]} box={[3.0, 0.4, 4.4]} burst={burst * 1.4} origin={[0, 0, -1.2]} seed={5} color="#ffb48a" />
            </NoReflect>
          ) : null}
        </>
      ) : null}
      {shot.setup === "rope" ? (
        <>
          <Rig
            rim={{ pos: [0.2, 3.0, -6.8], target: [-0.2, 0.5, -1.0], color: "#FF5420", intensity: 150, angle: 0.4, shadow: true }}
            key_={{ pos: [3.5, 1.6, 4.5], target: [-0.2, 0.5, -1.0], color: "#ffe4d2", intensity: 26, angle: 0.46, penumbra: 1 }}
            top={{ pos: [0.4, 5.2, 1.2], target: [-0.2, 0.5, -1.0], color: "#fff1e4", intensity: 10, angle: 0.62, penumbra: 1 }}
            kicker={{ pos: [3.2, 0.5, -1.0], intensity: 8 }}
          />
          <GymSet time={t} dustCenter={[0, 1.2, -1]} lineY={2.9} wash={0.18} slats={0.06} strips={0.45} />
          <RopeLine time={t} />
        </>
      ) : null}
      {shot.setup === "slam" ? (
        <>
          {/* rim from the far end of the aisle (behind the balls), low: orange edges + floor sheen */}
          <Rig
            rim={{ pos: [-5.5, 3.0, SLAM_AISLE_Z], target: [1.0, 0.35, SLAM_AISLE_Z], color: "#FF5420", intensity: 150 + 60 * glow + 70 * crash, angle: 0.3, penumbra: 0.8 }}
            key_={{ pos: [4.6, 3.2, 1.9], target: [0, 0.5, SLAM_AISLE_Z], color: "#ffe9da", intensity: 15, angle: 0.32, penumbra: 1 }}
            top={{ pos: [0.6, 5.4, SLAM_AISLE_Z], target: [0.6, 0, SLAM_AISLE_Z], color: "#fff1e4", intensity: 30, angle: 0.5, penumbra: 0.75, shadow: true }}
            kicker={{ pos: [-3.4, 0.3, SLAM_AISLE_Z], intensity: 3 + 6 * glow + 8 * crash }}
          />
          <GymSet time={t} lineY={shot.id === "C2" ? -1 : 0.12} wallZ={-7.5} wallYaw={Math.PI / 2} wash={0.1} slats={0.05} strips={0.6} dust={0.2} dustCenter={[0, 1.0, SLAM_AISLE_Z]} />
          <SlamLine f={f} ringScale={1 + 0.8 * crash} />
        </>
      ) : null}
      </GroupStage>
    </AbsoluteFill>
  );
};

/** Per-setup stage look: one canvas for the whole slot, only these values change at a cut. */
const LOOKS: Record<
  Setup,
  { fog: [number, number]; envIntensity: number; exposure: number; reflection: number; reflectionFade: [number, number]; floorRoughness?: number }
> = {
  kb: { fog: [4.5, 13], envIntensity: 0.85, exposure: 1.05, reflection: 0.22, reflectionFade: [2.5, 9], floorRoughness: 0.8 },
  rope: { fog: [4.5, 14], envIntensity: 0.7, exposure: 1.05, reflection: 0, reflectionFade: [2.5, 9], floorRoughness: 0.85 },
  slam: { fog: [4, 12], envIntensity: 0.8, exposure: 1.05, reflection: 0.3, reflectionFade: [2, 8], floorRoughness: 1.0 },
};

export type Hit = { at: number; amount: number; decay: number };
