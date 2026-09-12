import "./fonts";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const MyComposition = () => {
  return (
    <Composition
      id="ReshapeIntro"
      component={ReshapeIntro}
      durationInFrames={180}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

export const ReshapeIntro: React.FC = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      name="Scene"
      style={{
        direction: "rtl",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 144,
        backgroundColor: "#17181A",
      }}
    >
      <Interactive.Div
        name="Glow"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 50% 42%, rgba(255,84,32,0.20), rgba(23,24,26,0) 60%)",
          opacity: interpolate(frame, [0, 1.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <Interactive.Div
        name="Wordmark"
        style={{
          fontFamily: "Zain",
          fontWeight: 900,
          fontSize: 56,
          letterSpacing: 18,
          color: "#FF5420",
          marginBottom: 44,
          opacity: interpolate(frame, [0.3 * fps, 1.1 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(
            frame,
            [0.3 * fps, 1.3 * fps],
            ["0px 28px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        RESHAPE
      </Interactive.Div>
      <Interactive.Div
        name="Headline"
        style={{
          fontFamily: "Zain",
          fontWeight: 900,
          fontSize: 156,
          lineHeight: 1.15,
          textAlign: "center",
          color: "#FFFFFF",
          opacity: interpolate(frame, [0.9 * fps, 1.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          scale: interpolate(frame, [0.9 * fps, 2.2 * fps], [0.94, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 200 }),
            output: "perceptual-scale",
          }),
        }}
      >
        منصة التدريب الشخصي عن بُعد
      </Interactive.Div>
      <Interactive.Div
        name="Rule"
        style={{
          height: 5,
          borderRadius: 3,
          marginBlock: 52,
          backgroundColor: "#FF5420",
          width: interpolate(frame, [1.7 * fps, 2.7 * fps], [0, 320], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <Interactive.Div
        name="Tagline"
        style={{
          fontFamily: "IBM Plex Sans Arabic",
          fontWeight: 400,
          fontSize: 62,
          textAlign: "center",
          color: "#D9CCC4",
          opacity: interpolate(frame, [2.1 * fps, 3 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(
            frame,
            [2.1 * fps, 3.2 * fps],
            ["0px 22px", "0px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            },
          ),
        }}
      >
        برامج مخصّصة · فيديو لكل تمرين · تقدّم مباشر مع مدرّبك
      </Interactive.Div>
    </AbsoluteFill>
  );
};
