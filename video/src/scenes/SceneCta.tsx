import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { Flash, LightLeak } from "../components/Finish";
import { COLORS } from "../lib/brand";
import { EndCard } from "./cta/EndCard";
import { CenterScrim, MarkPunch, MontageCgi, MontageCopy } from "./cta/Montage";
import { DROP, END_CARD } from "./cta/timing";

// CTA (26.0-35.0 s, 270 frames).
// f0-104   "cta_montage": the drop - a hard cut on every beat through seven CGI setups (barbell
//          slam, kettlebell row, battle ropes, slam ball, lift-off, plate loading, the floor),
//          the mark punches in on "ريشيب…", then "غيّر أداءك" / "وارفع مستواك" on the VO.
// f105-269 END CARD: lockup, in-club group classes line, "سجّل الآن" on the VO, URL + handle;
//          a glint across the logo on the final hit (f180), then everything holds still to be read.

/** Mounts children from `from` on, keeping scene-relative frame numbers (the end card uses them). */
const From: React.FC<{ from: number; children: React.ReactNode }> = ({ from, children }) => {
  const frame = useCurrentFrame();
  return frame < from ? null : <AbsoluteFill>{children}</AbsoluteFill>;
};

export const SceneCta: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.black }}>
    <Sequence durationInFrames={END_CARD} name="cta_montage">
      <MontageCgi />
      <CenterScrim />
      <LightLeak from={48} to={84} intensity={0.5} y={30} />
      <LightLeak from={88} to={112} intensity={0.45} y={64} />
      <MarkPunch />
      <MontageCopy />
      {/* the drop */}
      <Flash at={DROP} color={COLORS.white} peak={0.9} length={4} />
      <Flash at={DROP} color={COLORS.orange} peak={0.3} length={7} />
    </Sequence>

    <From from={END_CARD}>
      <EndCard />
    </From>
    {/* no white-out on the end card: it must read cleanly as the VO says "سجّل" */}
    <Flash at={END_CARD} color={COLORS.orange} peak={0.12} length={5} />
  </AbsoluteFill>
);
