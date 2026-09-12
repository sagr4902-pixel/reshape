import React from 'react';
import { Composition, staticFile } from 'remotion';
import { RESHAPE_THEME as T } from './theme';
import { DURATION_S } from './timeline';
import { ReshapeReel } from './ReshapeReel';
import type { CaptionGroup } from './components/WordCaption';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ReshapeReel"
    component={ReshapeReel as never}
    durationInFrames={Math.round(DURATION_S * T.fps)}
    fps={T.fps}
    width={T.width}
    height={T.height}
    defaultProps={{ captions: [] as CaptionGroup[], debugSafe: false }}
    calculateMetadata={async ({ props }) => {
      const captions = (await (await fetch(staticFile('captions.json'))).json()) as CaptionGroup[];
      return { props: { ...props, captions } };
    }}
  />
);
