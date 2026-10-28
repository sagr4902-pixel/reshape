import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { FOOTAGE, FootageSlotId } from "../lib/footage";

/**
 * Plays approved club footage for this slot if one is configured in lib/footage.ts,
 * otherwise renders the CGI fallback passed as children.
 */
export const FootageSlot: React.FC<{ slot: FootageSlotId; children: React.ReactNode }> = ({ slot, children }) => {
  const clip = FOOTAGE[slot];
  if (!clip.file) return <>{children}</>;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile(`footage/${clip.file}`)}
        startFrom={clip.startFrom ?? 0}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // brand grade: deep blacks, warm highlights
          filter: "contrast(1.18) saturate(0.85) sepia(0.12) brightness(0.92)",
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(23,24,26,0.35), rgba(23,24,26,0) 35%, rgba(23,24,26,0) 60%, rgba(23,24,26,0.7))" }} />
    </AbsoluteFill>
  );
};
