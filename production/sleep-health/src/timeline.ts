/**
 * Master timeline — seconds. Derived from the MEASURED voice-over (take 1,
 * 35.16 s raw) cut into segments and re-spaced so each scene breathes.
 * Total runtime 48.5 s = 1455 frames @ 30 fps. audio/build_mix.py reads the
 * same numbers from audio/timeline.json (generated from this file).
 */
export const TOTAL_SECONDS = 48.5;

export type Seg = {id: string; src: [number, number]; dst: number};

export const VO_SEGMENTS: Seg[] = [
  {id: 'hook', src: [0.0, 4.3], dst: 0.9},
  {id: 'brain', src: [4.55, 10.1], dst: 5.7},
  {id: 'immune', src: [10.35, 15.05], dst: 14.6},
  {id: 'heart', src: [15.1, 19.39], dst: 22.1},
  {id: 'regular', src: [19.39, 21.72], dst: 29.0},
  {id: 'advice', src: [21.74, 30.36], dst: 33.9},
  {id: 'ending', src: [30.38, 35.16], dst: 43.0},
];

export const SCENES = {
  hook: [0, 5.2],
  brain: [5.2, 14.2],
  immune: [14.2, 21.6],
  heart: [21.6, 28.6],
  regular: [28.6, 33.6],
  advice: [33.6, 42.8],
  finale: [42.8, 48.5],
} as const;
