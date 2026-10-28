import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AccentLine, CeilingStrips, Dust, LightShaft, Mark3D } from "./Atmosphere";
import { Barbell, BattleRope, Kettlebell, Rack, SlamBall } from "./Equipment";
import { SportsLights, Studio } from "./Studio";

// Look-development composition: renders individual CGI setups for review.
export const Lab: React.FC<{ shot: number }> = ({ shot }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  return (
    <AbsoluteFill style={{ background: "#0b0b0d" }}>
      {shot === 0 && (
        <Studio camera={{ position: [0.32, 0.93, 0.42], target: [0.05, 0.9, 0], fov: 30 }} fog={[1, 8]}>
          <SportsLights rimPos={[-1.2, 1.6, -1.0]} keyPos={[1.2, 1.4, 1.5]} target={[0, 0.9, 0]} rim={40} key_={4} />
          <Barbell position={[0, 0.9, 0]} rotation={[0, 0.35, 0]} />
          <Dust time={t} center={[0, 0.95, 0]} box={[1.2, 0.8, 1.2]} count={400} size={0.006} />
        </Studio>
      )}
      {shot === 1 && (
        <Studio camera={{ position: [1.6, 0.35, 2.4], target: [0, 0.25, 0], fov: 34 }}>
          <SportsLights />
          <CeilingStrips />
          <Rack position={[-2.2, 0, -3.5]} rotation={[0, 0.3, 0]} />
          <AccentLine position={[0, 1.5, -6]} width={12} />
          <Barbell position={[0, 0.225, 0]} rotation={[0, -0.5, 0]} plates={[0.065, 0.065, 0.045]} />
          <LightShaft position={[-1.2, 2.6, -1]} rotation={[0, 0, -0.35]} length={5.5} radius={1.4} />
          <Dust time={t} />
        </Studio>
      )}
      {shot === 2 && (
        <Studio camera={{ position: [2.2, 0.55, 2.2], target: [0, 0.2, -0.6], fov: 32 }}>
          <SportsLights />
          <CeilingStrips />
          <AccentLine position={[0, 1.2, -7]} width={14} />
          {Array.from({ length: 7 }, (_, i) => (
            <Kettlebell key={i} position={[-0.0 + i * -0.45 + 1.2, 0.1, -i * 0.35]} rotation={[0, 0.4, 0]} accent={i === 0} />
          ))}
          <Dust time={t} />
        </Studio>
      )}
      {shot === 3 && (
        <Studio camera={{ position: [0, 1.6, 3.4], target: [0, 0.3, -1], fov: 36 }}>
          <SportsLights rimPos={[0, 2.5, -4]} />
          <CeilingStrips />
          <BattleRope anchor={[-0.35, 0.15, -6]} handle={[-0.3, 0.9, 1]} time={t} />
          <BattleRope anchor={[0.35, 0.15, -6]} handle={[0.3, 0.9, 1]} time={t} phase={0.4} />
          <SlamBall position={[1.3, 0.15, -1.5]} />
          <AccentLine position={[0, 1.4, -8]} width={14} />
          <Dust time={t} />
        </Studio>
      )}
      {shot === 4 && (
        <Studio camera={{ position: [0, 0.2, 2.6], target: [0, 0.2, 0], fov: 30 }} floor={false} fog={[2, 9]}>
          <SportsLights rimPos={[-2, 1.5, -1.5]} keyPos={[1.5, 1, 2.5]} target={[0, 0.2, 0]} rim={60} key_={30} />
          <Mark3D position={[0, 0.2, 0]} rotation={[0.1, -0.35, 0]} scale={1.2} />
          <LightShaft position={[0, 2.5, -1]} length={5} radius={1.6} opacity={0.08} />
        </Studio>
      )}
    </AbsoluteFill>
  );
};
