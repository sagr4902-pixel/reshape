import React from "react";

// Line icons copied from the platform's own set (reshape-online site/index.html, ICONS) so the
// film's graphics speak the same visual language as the app on his phone. 24x24, stroke icons;
// paths marked "f" are filled.
const P: Record<string, { d: string[]; f?: boolean[] }> = {
  home: { d: ["M4 10.4 12 4l8 6.4v8.1a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9V20H5.5A1.5 1.5 0 0 1 4 18.5z"] },
  briefcase: { d: ["M5.6 7h12.8a2.2 2.2 0 0 1 2.2 2.2v8.2a2.2 2.2 0 0 1-2.2 2.2H5.6a2.2 2.2 0 0 1-2.2-2.2V9.2A2.2 2.2 0 0 1 5.6 7z", "M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.4 12.6h17.2"] },
  globe: { d: ["M12 3.4a8.6 8.6 0 1 1 0 17.2 8.6 8.6 0 0 1 0-17.2z", "M3.4 12h17.2M12 3.4c2.3 2.4 3.4 5.3 3.4 8.6s-1.1 6.2-3.4 8.6c-2.3-2.4-3.4-5.3-3.4-8.6S9.7 5.8 12 3.4"] },
  play: { d: ["M8 5.9v12.2a.9.9 0 0 0 1.4.8l9.6-6.1a.9.9 0 0 0 0-1.6L9.4 5.1A.9.9 0 0 0 8 5.9z"], f: [true] },
  bell: { d: ["M6 10a6 6 0 0 1 12 0c0 6 2.4 7.6 2.4 7.6H3.6S6 16 6 10z", "M10.2 20.6a2 2 0 0 0 3.6 0"] },
  clock: { d: ["M12 3.4a8.6 8.6 0 1 1 0 17.2 8.6 8.6 0 0 1 0-17.2z", "M12 7.4V12l3.1 2"] },
  check: { d: ["M5 12.6l4.4 4.4L19 7.6"] },
  calendarCheck: { d: ["M5.8 5h12.4a2.2 2.2 0 0 1 2.2 2.2v11a2.2 2.2 0 0 1-2.2 2.2H5.8a2.2 2.2 0 0 1-2.2-2.2v-11A2.2 2.2 0 0 1 5.8 5z", "M3.6 9.8h16.8M8 3v4M16 3v4", "M9.2 14.8l1.9 1.9 3.7-3.8"] },
  food: { d: ["M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10", "M17 3c-2 1.5-3 4-3 7h3v11"] },
  repeat: { d: ["M17 3.6l3 3-3 3", "M4 11.4V10a3.4 3.4 0 0 1 3.4-3.4H20", "M7 20.4l-3-3 3-3", "M20 12.6V14a3.4 3.4 0 0 1-3.4 3.4H4"] },
  progress: { d: ["M3.5 20h17", "M5 16l4.4-4.6 3.6 3.1 6.2-6.7", "M14.8 7.8h4.4v4.4"] },
  user: { d: ["M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z", "M4.6 20.2a7.4 7.4 0 0 1 14.8 0"] },
  target: { d: ["M12 3.4a8.6 8.6 0 1 1 0 17.2 8.6 8.6 0 0 1 0-17.2z", "M12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6z"] },
  zap: { d: ["M13.2 2.8 4.8 13.4h6.4l-1 7.8 8.4-10.6h-6.4z"] },
};

export type IconName = keyof typeof P;

/** draw: 0..1 reveals the strokes (pathLength trick), so icons can draw themselves in */
export const Icon: React.FC<{ name: IconName; size: number; color?: string; draw?: number; strokeWidth?: number }> = ({
  name,
  size,
  color = "#fff",
  draw = 1,
  strokeWidth = 1.9,
}) => {
  const ic = P[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", overflow: "visible" }}>
      {ic.d.map((d, i) =>
        ic.f?.[i] ? (
          <path key={i} d={d} fill={color} opacity={draw} />
        ) : (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - Math.max(0, Math.min(1, draw))}
          />
        ),
      )}
    </svg>
  );
};
