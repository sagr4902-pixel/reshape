import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
// No GPU in the render container: SwiftShader via ANGLE ("swangle") is the WebGL path that works.
Config.setChromiumOpenGlRenderer("swangle");
Config.setConcurrency(3);
// Use the container's pre-installed headless shell (remotion.media is not reachable from here).
Config.setBrowserExecutable("/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell");
