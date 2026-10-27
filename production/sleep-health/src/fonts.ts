import {continueRender, delayRender, staticFile} from 'remotion';

const faces: Array<[string, string, number]> = [
  ['Zain', 'fonts/Zain-700.ttf', 700],
  ['Zain', 'fonts/Zain-800.ttf', 800],
  ['Zain', 'fonts/Zain-900.ttf', 900],
  ['IBM Plex Sans Arabic', 'fonts/IBM-Plex-Sans-Arabic-400.ttf', 400],
  ['IBM Plex Sans Arabic', 'fonts/IBM-Plex-Sans-Arabic-500.ttf', 500],
  ['IBM Plex Sans Arabic', 'fonts/IBM-Plex-Sans-Arabic-600.ttf', 600],
  ['IBM Plex Sans Arabic', 'fonts/IBM-Plex-Sans-Arabic-700.ttf', 700],
  ['Barlow Semi Condensed', 'fonts/Barlow-Semi-Condensed-500.ttf', 500],
  ['Barlow Semi Condensed', 'fonts/Barlow-Semi-Condensed-600.ttf', 600],
  ['Barlow Semi Condensed', 'fonts/Barlow-Semi-Condensed-700.ttf', 700],
];

let loaded: Promise<void> | null = null;

export const loadBrandFonts = () => {
  if (loaded) return loaded;
  const handle = delayRender('Loading RESHAPE fonts');
  loaded = Promise.all(
    faces.map(async ([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, {
        weight: String(weight),
        style: 'normal',
      });
      const f = await face.load();
      (document.fonts as unknown as {add: (f: FontFace) => void}).add(f);
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
  return loaded;
};
