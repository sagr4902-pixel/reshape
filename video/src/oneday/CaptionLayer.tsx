import React from "react";
import { AbsoluteFill } from "remotion";
import { Anchor, Checklist, Hero, Line, LowerThird, PhoneChip, PhonePulse, Place, TimeChip, UrlTyper, WeekDots, WeeksCard } from "./Captions";
import { CARD, URL_TYPE } from "./timeline";
import { WORDS as W } from "./words";

/* Where and how each caption appears. 16:9 positions keep text off his head and the phone;
   9:16 positions stay inside the Reels/TikTok safe area (top ~13 %, bottom ~20 %). Entrances
   rotate (rise, wipe, slide, pop, drop) so no two neighbouring scenes move the same way. */

const P = (h: Anchor, v: Anchor): Place => ({ h, v });
const LOW_LEFT = P({ x: 0.47, y: 0.8, align: "right", size: 60, maxW: 0.42 }, { x: 0.5, y: 0.74, align: "center", size: 72, maxW: 0.86 });
const SKY_CENTER = P({ x: 0.5, y: 0.2, align: "center", size: 58, maxW: 0.62 }, { x: 0.5, y: 0.2, align: "center", size: 66, maxW: 0.86 });
const CHIP_TL = P({ x: 0.045, y: 0.075, align: "left", size: 28 }, { x: 0.07, y: 0.135, align: "left", size: 32 });

export const CaptionLayer: React.FC<{ portrait: boolean }> = ({ portrait }) => {
  const pr = { portrait };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* time of day: the thread of "one day" */}
      <TimeChip from={172} to={262} text="5:40 ص" place={CHIP_TL} {...pr} />
      <TimeChip from={668} to={748} text="7:10 ص" place={CHIP_TL} {...pr} />
      <TimeChip from={786} to={832} text="1:30 م" place={CHIP_TL} {...pr} />
      <TimeChip from={838} to={882} text="5:15 م" place={CHIP_TL} {...pr} />
      <TimeChip from={892} to={960} text="8:05 م" place={CHIP_TL} {...pr} />
      <TimeChip from={1056} to={1120} text="6:05 م" place={CHIP_TL} {...pr} />

      {/* 1 · bedroom: the reminder, then the Account page */}
      <PhoneChip clip="c01" from={14} to={72} icon="bell" text="تذكير: تمرين اليوم" side={{ h: "right", v: "above" }} dy={0.3} size={{ h: 26, v: 30 }} {...pr} />
      <Line words={W.od1} variant="rise" em={{ 4: "strike" }} place={LOW_LEFT} until={99} {...pr} />
      <Line words={W.od2} variant="wipe" em={{ 2: "accent", 3: "marker", 4: "marker" }} place={LOW_LEFT} until={192} {...pr} />

      {/* 2 · rooftop at dawn: today's workout, the technique video */}
      <PhoneChip clip="c02" from={266} to={300} icon="calendarCheck" text="تمرين اليوم جاهز" side={{ h: "right", v: "right" }} dy={0.3} size={{ h: 26, v: 30 }} {...pr} />
      <Line
        words={W.od4}
        variant="slide"
        em={{ 1: "accent", 5: "marker", 6: "marker" }}
        place={P({ x: 0.5, y: 0.84, align: "right", size: 50, maxW: 0.48 }, { x: 0.5, y: 0.78, align: "center", size: 70, maxW: 0.86 })}
        until={308}
        {...pr}
      />
      <Line words={W.od5} variant="pop" icon={{ at: 3, name: "play" }} em={{ 6: "marker" }} place={SKY_CENTER} hold={20} {...pr} />

      {/* the pull-up: the promise, said plainly */}
      <Hero text="بدون نادي." from={548} to={622} place={P({ x: 0.27, y: 0.11, align: "center", size: 96, maxW: 0.5 }, { x: 0.5, y: 0.16, align: "center", size: 104, maxW: 0.9 })} {...pr} />

      {/* 3-5 · home, travel, anywhere: one list that builds across the three places */}
      <Checklist
        items={[
          { icon: "home", text: "في البيت", at: W.od6a[1].s },
          { icon: "briefcase", text: "في السفر", at: W.od6b[1].s },
          { icon: "globe", text: "وين ما كنت", at: W.od6c[0].s },
        ]}
        to={885}
        place={P({ x: 0.95, y: 0.2, align: "right", size: 44, maxW: 0.34 }, { x: 0.92, y: 0.25, align: "right", size: 50, maxW: 0.62 })}
        {...pr}
      />

      {/* 6 · kitchen: his food, then the two things the app gives him */}
      <Line
        words={W.od7.slice(0, 2)}
        variant="rise"
        em={{ 1: "accent" }}
        place={P({ x: 0.95, y: 0.86, align: "right", size: 56, maxW: 0.4 }, { x: 0.5, y: 0.83, align: "center", size: 68, maxW: 0.86 })}
        until={1003}
        {...pr}
      />
      <PhoneChip clip="c09" from={W.od7[2].s - 2} to={1004} icon="food" text="وجباتك" side={{ h: "right", v: "right" }} dy={0.32} size={{ h: 28, v: 32 }} {...pr} />
      <PhoneChip clip="c09" from={W.od7[3].s - 2} to={1004} icon="repeat" text="وبدايلها" side={{ h: "right", v: "right" }} dy={0.58} size={{ h: 28, v: 32 }} {...pr} />

      {/* weeks later */}
      <WeeksCard from={CARD.from} dur={CARD.dur} {...pr} />

      {/* 7 · progress, week after week; the medal lands */}
      <Line
        words={W.od8}
        variant="drop"
        em={{ 1: "accent" }}
        place={P({ x: 0.95, y: 0.14, align: "right", size: 56, maxW: 0.58 }, { x: 0.5, y: 0.21, align: "center", size: 64, maxW: 0.88 })}
        until={1168}
        {...pr}
      />
      <WeekDots startAt={W.od8[3].s} step={6} to={1168} place={P({ x: 0.94, y: 0.26, align: "right", size: 30 }, { x: 0.5, y: 0.3, align: "center", size: 34 })} {...pr} />
      <PhonePulse clip="c10" at={1168} {...pr} />

      {/* 8 · the coach */}
      <Line
        words={W.od9}
        variant="wipe"
        em={{ 2: "marker", 3: "marker" }}
        place={P({ x: 0.42, y: 0.14, align: "right", size: 58, maxW: 0.4 }, { x: 0.5, y: 0.17, align: "center", size: 68, maxW: 0.86 })}
        until={1316}
        {...pr}
      />
      <LowerThird
        from={1216}
        to={1312}
        name="الكابتن محمد الصقر"
        role="مدربك في ريشيب"
        place={P({ x: 0.94, y: 0.82, align: "right", size: 42 }, { x: 0.9, y: 0.84, align: "right", size: 48 })}
        {...pr}
      />

      {/* 9 · dusk: he types the address while the voice says it */}
      <UrlTyper
        from={URL_TYPE.from}
        typeFrames={URL_TYPE.typeFrames}
        to={1452}
        text={URL_TYPE.text}
        place={P({ x: 0.62, y: 0.13, align: "center", size: 76, maxW: 0.6 }, { x: 0.5, y: 0.15, align: "center", size: 70, maxW: 0.92 })}
        {...pr}
      />
    </AbsoluteFill>
  );
};
