/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

/**
 * Delivery settings for Reels / TikTok / Shorts.
 *
 * CRF 21 lands around 6–8 Mbps at 1080×1920, which is well inside what the
 * platforms keep before they re-encode — sending them a 15 Mbps master just
 * means their encoder throws the extra away.
 */
Config.setCodec("h264");
Config.setCrf(21);
Config.setPixelFormat("yuv420p");
Config.setAudioCodec("aac");
