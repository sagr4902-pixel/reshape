import React from 'react';
import { AbsoluteFill } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/**
 * Instagram Reels safe area. `debug` paints the forbidden regions so a render
 * can be checked for intrusions; it is off in the final composition.
 */
export const SafeArea: React.FC<{ children?: React.ReactNode; debug?: boolean }> = ({
  children,
  debug = false,
}) => (
  <AbsoluteFill>
    {children}
    {debug ? (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        {([
          { top: 0, height: T.safe.top, left: 0, right: 0 },
          { bottom: 0, height: T.safe.bottom, left: 0, right: 0 },
          { top: T.safe.rightFrom, bottom: 0, right: 0, width: T.safe.right },
          { top: 0, bottom: 0, left: 0, width: T.safe.left },
        ] as React.CSSProperties[]).map((s, i) => (
          <div key={i} style={{ position: 'absolute', background: T.tint.debug, ...s }} />
        ))}
      </AbsoluteFill>
    ) : null}
  </AbsoluteFill>
);
