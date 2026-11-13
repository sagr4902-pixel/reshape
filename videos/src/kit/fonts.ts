import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

const AR = 'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

const faces: Array<[family: string, file: string, weight: string, style: string, range: string]> = [
  ['Zain', 'zain-arabic-700-normal', '700', 'normal', AR],
  ['Zain', 'zain-arabic-800-normal', '800', 'normal', AR],
  ['Zain', 'zain-arabic-900-normal', '900', 'normal', AR],
  ['Zain', 'zain-latin-700-normal', '700', 'normal', LAT],
  ['Zain', 'zain-latin-800-normal', '800', 'normal', LAT],
  ...(['400', '500', '600', '700'] as const).flatMap((w): Array<[string, string, string, string, string]> => [
    ['Plex Arabic', `ibm-plex-sans-arabic-arabic-${w}-normal`, w, 'normal', AR],
    ['Plex Arabic', `ibm-plex-sans-arabic-latin-${w}-normal`, w, 'normal', LAT],
  ]),
  ['Barlow SC', 'barlow-semi-condensed-latin-500-normal', '500', 'normal', LAT],
  ['Barlow SC', 'barlow-semi-condensed-latin-600-normal', '600', 'normal', LAT],
  ['Barlow SC', 'barlow-semi-condensed-latin-700-normal', '700', 'normal', LAT],
  ['Barlow SC', 'barlow-semi-condensed-latin-600-italic', '600', 'italic', LAT],
  ['Barlow SC', 'barlow-semi-condensed-latin-700-italic', '700', 'italic', LAT],
];

let started = false;
export const ensureFonts = () => {
  if (started) return;
  started = true;
  for (const [family, file, weight, style, unicodeRange] of faces) {
    loadFont({family, url: staticFile(`fonts/${file}.woff2`), weight, style, unicodeRange, format: 'woff2'});
  }
};
