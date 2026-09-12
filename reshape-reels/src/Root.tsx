import React from 'react';
import { Composition, staticFile } from 'remotion';
import { RESHAPE_THEME as T } from './theme';
import { DURATION_S } from './timeline';
import { ReshapeReel } from './ReshapeReel';
import type { CaptionGroup } from './components/WordCaption';
import type { TrackRec } from './plate';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ReshapeReel"
    component={ReshapeReel as never}
    durationInFrames={Math.round(DURATION_S * T.fps)}
    fps={T.fps}
    width={T.width}
    height={T.height}
    defaultProps={{ captions: [] as CaptionGroup[], track: [] as TrackRec[], debugSafe: false }}
    calculateMetadata={async ({ props }) => {
      const [captions, track] = await Promise.all([
        (await fetch(staticFile('captions.json'))).json(),
        (await fetch(staticFile('track_v3.json'))).json(),
      ]);
      return { props: { ...props, captions, track } };
    }}
  />
);
