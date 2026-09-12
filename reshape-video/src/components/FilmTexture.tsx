import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";

export type FilmTextureProps = {
  readonly grain?: number;
  readonly vignette?: number;
};

/**
 * Atmosphere layer: a little grain so the footage sits on a surface rather
 * than floating, and a vignette that pulls the eye to the middle of the frame.
 *
 * The grain is one 256px tile repeated across the frame and jittered a random
 * tile-step every frame. That is far cheaper at 1080×1920 than a per-frame
 * `feTurbulence`, and it reads as real grain because the offset never repeats.
 */
export const FilmTexture: React.FC<FilmTextureProps> = ({ grain = 0.1, vignette = 0.42 }) => {
  const frame = useCurrentFrame();
  const tile = staticFile("brand/grain.png");

  return (
    <AbsoluteFill name="Film texture" style={{ pointerEvents: "none" }}>
      {/*
        `<Img>` makes Remotion block the frame until the tile has decoded.
        Without it the CSS-repeated copy below can render on an empty first
        frame, which shows up as a grain flash in the final file.
      */}
      <Img src={tile} style={{ display: "none" }} />
      <AbsoluteFill
        style={{
          // Tiling needs CSS repeat, and the <Img> above is what gates the
          // render on load — which is the only thing this rule protects against.
          // eslint-disable-next-line @remotion/no-background-image
          backgroundImage: `url(${tile})`,
          backgroundRepeat: "repeat",
          backgroundPosition: `${Math.round(random(`gx${frame}`) * 256)}px ${Math.round(
            random(`gy${frame}`) * 256,
          )}px`,
          opacity: grain,
          mixBlendMode: "overlay",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(ellipse 72% 58% at 50% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,1) 100%)",
          opacity: vignette,
        }}
      />
    </AbsoluteFill>
  );
};
