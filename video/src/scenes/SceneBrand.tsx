import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Flash, LightLeak, useShake } from "../components/Finish";
import { FootageSlot } from "../components/FootageSlot";
import { KineticWords } from "../components/KineticWords";
import { LogoLockup } from "../components/Logo";
import { COLORS, FONTS } from "../lib/brand";
import { FloorShot } from "./brand/FloorShot";
import { CUT, LOCKUP_CX, LOCKUP_CY, LOCKUP_H, LOCKUP_W, MARK2D_H, MARK_DX, MATCH_H, VO } from "./brand/layout";
import { MarkReveal } from "./brand/MarkReveal";
import { Triad } from "./brand/Triad";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Frame at which the three triad underlines relight together (on the beat after ثقة). */
const ALL_ON = 150;
/** Last frames: push forward into the group-training drop at 12.0 s. */
const PUSH_FROM = 171;
/** Look-dev switch: render the background floor without blur/darkening. */
const SHARP = false;

/**
 * Scene "brand" (6.0-12.0 s, 180 frames).
 * f0-45   3D reveal of the extruded authentic mark (logo hit at f0: flash, shake, dust burst)
 * f45     match-cut to the flat 2D lockup; the mark glides left as the wordmark wipes in
 * f45-180 blurred CGI training floor behind (brand_group slot), triad synced to the VO
 * f171-180 push forward into the next scene.
 */
export const SceneBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shake = useShake(0, 24, 8);

  // ---- end push
  const push = interpolate(frame, [PUSH_FROM, 180], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });

  // ---- background pulse on each triad word
  const pulse = [VO.quwwa, VO.liyaqa, VO.thiqa, ALL_ON].reduce(
    (acc, at) => acc + (frame >= at ? Math.exp(-(frame - at) / 7) : 0),
    0,
  );

  // ---- 2D lockup: starts exactly where the 3D mark landed, then settles
  const settle = spring({ frame: frame - CUT, fps, config: { damping: 200, stiffness: 80 }, durationInFrames: 32 });
  const s0 = MATCH_H / MARK2D_H;
  const drift = interpolate(frame, [CUT + 30, 180], [0, 0.03], clamp);
  const lockScale = interpolate(settle, [0, 1], [s0, 1]) + drift;
  const lockCx = LOCKUP_CX - MARK_DX * lockScale * (1 - settle);
  const wordReveal = interpolate(frame, [CUT + 5, CUT + 24], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: "#0b0b0d", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${1 + push * 0.42})`,
          filter: push > 0.02 ? `blur(${push * 16}px) brightness(${1 + push * 0.35})` : undefined,
        }}
      >
        {/* ---------- shot 1: 3D brand reveal */}
        <Sequence durationInFrames={CUT} name="3D mark reveal">
          <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px) rotate(${shake.r}deg) scale(${shake.x === 0 ? 1 : 1.03})` }}>
            <MarkReveal />
          </AbsoluteFill>
        </Sequence>

        {/* ---------- shot 2: training floor behind the lockup */}
        <Sequence from={CUT} name="floor + lockup">
          <FootageSlot slot="brand_group">
            <AbsoluteFill style={{ filter: SHARP ? undefined : "blur(4.5px) brightness(0.7) saturate(0.95)", transform: "scale(1.04)" }}>
              <FloorShot frame={frame} pulse={Math.min(1, pulse)} push={push} />
            </AbsoluteFill>
          </FootageSlot>
          {/* scrims: keep the logo and the triad zone clean */}
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse 62% 16% at 50% ${(LOCKUP_CY / 1920) * 100}%, rgba(8,8,10,0.62), rgba(8,8,10,0) 100%),
                linear-gradient(180deg, rgba(11,11,13,0.55) 0%, rgba(11,11,13,0.1) 22%, rgba(11,11,13,0.05) 52%, rgba(11,11,13,0.55) 72%, rgba(11,11,13,0.75) 100%)`,
            }}
          />
          <AbsoluteFill style={{ pointerEvents: "none" }}>
            <div
              style={{
                position: "absolute",
                left: lockCx - (LOCKUP_W * lockScale) / 2,
                top: LOCKUP_CY - (LOCKUP_H * lockScale) / 2,
              }}
            >
              {/* sized as a vector (no CSS scale) so the mark stays razor sharp at every size */}
              <LogoLockup width={LOCKUP_W * lockScale} wordReveal={wordReveal} />
            </div>
          </AbsoluteFill>
        </Sequence>

        <LightLeak from={CUT - 4} to={CUT + 46} intensity={0.3} y={30} />
        <LightLeak from={ALL_ON - 6} to={180} intensity={0.35} y={66} />

        {/* ---------- secondary line: synced to "كل حصّة … خطوة جديدة", gone before the triad */}
        <div style={{ position: "absolute", left: 90, right: 90, top: 840 }}>
          <KineticWords
            font={FONTS.body}
            weight={600}
            fontSize={54}
            color={COLORS.warm}
            style="blur"
            out={VO.quwwa - 10}
            words={[
              { text: "كل", at: VO.kull },
              { text: "حصّة…", at: VO.hissa },
              { text: "خطوة", at: VO.khutwa },
              { text: "جديدة", at: VO.jadida, color: COLORS.white },
            ]}
          />
        </div>

        {/* ---------- triad */}
        <div style={{ position: "absolute", left: 90, right: 140, top: 1170 }}>
          <Triad quwwa={VO.quwwa} liyaqa={VO.liyaqa} thiqa={VO.thiqa} allOn={ALL_ON} fontSize={104} />
        </div>
      </AbsoluteFill>

      <Flash at={0} peak={0.85} length={8} color="#fff1e8" />
    </AbsoluteFill>
  );
};
