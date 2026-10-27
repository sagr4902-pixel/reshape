import {Composition, Still} from 'remotion';
import {SleepHealth} from './SleepHealth';
import {Cover} from './Cover';
import {FPS, H, W} from './brand';
import {TOTAL_SECONDS} from './timeline';

export const Root = () => (
  <>
    <Composition
      id="SleepHealth"
      component={SleepHealth}
      durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
      fps={FPS}
      width={W}
      height={H}
    />
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
