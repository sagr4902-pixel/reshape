import { continueRender, delayRender, staticFile } from 'remotion';

/** Load the brand faces before the first frame paints, or Arabic renders in a fallback. */
let started = false;
export const loadReshapeFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Loading Tajawal');
  Promise.all(
    [
      { family: 'Tajawal Black', file: 'fonts/Tajawal-Black.ttf' },
      { family: 'Tajawal Bold', file: 'fonts/Tajawal-Bold.ttf' },
    ].map(async ({ family, file }) => {
      const face = new FontFace(family, `url(${staticFile(file)})`);
      await face.load();
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
    }),
  )
    .then(() => document.fonts.ready)
    .then(() => continueRender(handle))
    .catch(() => continueRender(handle));
};
