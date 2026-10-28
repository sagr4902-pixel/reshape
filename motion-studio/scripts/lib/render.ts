import { existsSync } from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { ROOT } from "./job";

/**
 * Thin wrapper over the Remotion Node APIs. The CLI config file does not apply
 * here, so the browser and codec settings are passed explicitly.
 */
const LOCAL_BROWSER =
  process.env.REMOTION_BROWSER_EXECUTABLE ??
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";

export const browserExecutable = existsSync(LOCAL_BROWSER) ? LOCAL_BROWSER : null;

let bundled: Promise<string> | null = null;
export const getBundle = () => {
  if (!bundled) {
    bundled = bundle({
      entryPoint: path.join(ROOT, "src", "index.ts"),
      publicDir: path.join(ROOT, "public"),
      rspack: true,
      onProgress: () => undefined,
    });
  }
  return bundled;
};

const chromiumOptions = { gl: "angle" as const };

export const stills = async (opts: {
  compositionId: string;
  inputProps: Record<string, unknown>;
  frames: { frame: number; output: string }[];
  scale?: number;
}) => {
  const serveUrl = await getBundle();
  const composition = await selectComposition({ serveUrl, id: opts.compositionId, inputProps: opts.inputProps, browserExecutable, chromiumOptions });
  for (const f of opts.frames) {
    await renderStill({
      serveUrl,
      composition,
      frame: f.frame,
      output: f.output,
      inputProps: opts.inputProps,
      scale: opts.scale ?? 1,
      imageFormat: "png",
      browserExecutable,
      chromiumOptions,
      overwrite: true,
    });
  }
  return composition;
};

export const video = async (opts: {
  compositionId: string;
  inputProps: Record<string, unknown>;
  output: string;
  scale?: number;
  crf?: number;
  onProgress?: (p: number) => void;
}) => {
  const serveUrl = await getBundle();
  const composition = await selectComposition({ serveUrl, id: opts.compositionId, inputProps: opts.inputProps, browserExecutable, chromiumOptions });
  await renderMedia({
    serveUrl,
    composition,
    inputProps: opts.inputProps,
    codec: "h264",
    crf: opts.crf ?? 18,
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    audioCodec: "aac",
    audioBitrate: "256k",
    scale: opts.scale ?? 1,
    outputLocation: opts.output,
    browserExecutable,
    chromiumOptions,
    imageFormat: "jpeg",
    jpegQuality: 92,
    overwrite: true,
    onProgress: ({ progress }) => opts.onProgress?.(progress),
  });
  return composition;
};
