import { cancelRender, continueRender, delayRender } from "remotion";
import "./fonts/fonts.css";

/**
 * Blocks rendering until every brand face is decoded, so the first frame of a
 * render never falls back to a system font. Called once from the root.
 */
const FACES = [
  "900 100px Zain",
  "800 100px Zain",
  "700 100px Zain",
  "400 100px 'IBM Plex Sans Arabic'",
  "500 100px 'IBM Plex Sans Arabic'",
  "600 100px 'IBM Plex Sans Arabic'",
  "700 100px 'IBM Plex Sans Arabic'",
  "600 100px 'Barlow Semi Condensed'",
  "700 100px 'Barlow Semi Condensed'",
  "800 100px 'Barlow Semi Condensed'",
  "italic 800 100px 'Barlow Semi Condensed'",
];

let started = false;

export const ensureBrandFonts = () => {
  if (started || typeof document === "undefined") return;
  started = true;
  const handle = delayRender("Loading RESHAPE brand fonts");
  Promise.all(FACES.flatMap((f) => [document.fonts.load(f, "رِي شَيْب"), document.fonts.load(f, "RESHAPE 0123456789%+")]))
    .then(() => continueRender(handle))
    .catch((err) => cancelRender(err));
};
