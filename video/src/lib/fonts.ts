import { continueRender, delayRender, staticFile } from "remotion";
import manifest from "../../public/fonts/manifest.json";

type FontEntry = {
  family: string;
  weight: string;
  style: string;
  file: string;
  unicodeRange: string;
};

let loaded = false;

// Load the locally bundled Google Fonts (OFL) so renders never depend on the network.
export const loadBrandFonts = () => {
  if (loaded || typeof document === "undefined") return;
  loaded = true;
  const handle = delayRender("Loading brand fonts");
  Promise.all(
    (manifest as FontEntry[]).map((f) => {
      const face = new FontFace(f.family, `url(${staticFile(`fonts/${f.file}`)}) format("woff2")`, {
        weight: f.weight,
        style: f.style,
        unicodeRange: f.unicodeRange,
        display: "block",
      });
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
};
