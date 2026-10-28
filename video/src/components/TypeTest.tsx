import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS, FONTS } from "../lib/brand";
import { loadBrandFonts } from "../lib/fonts";
import { KineticWords } from "./KineticWords";
import { LogoLockup } from "./Logo";

loadBrandFonts();

// Typography check sheet: Arabic shaping, marks, mixed Latin, logo.
export const TypeTest: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.black, padding: 90, gap: 40, display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <KineticWords fontSize={150} words={[{ text: "مو", at: -30 }, { text: "كلّ", at: -30 }, { text: "تمرين…", at: -30 }]} />
    <KineticWords fontSize={190} words={[{ text: "يغيّرك", at: -30, color: COLORS.orange }]} />
    <KineticWords fontSize={120} words={[{ text: "تحدٍّ", at: -30 }, { text: "جديد", at: -30, color: COLORS.orange }]} />
    <KineticWords fontSize={64} weight={600} font={FONTS.body} words={[{ text: "قوّة", at: -30 }, { text: "|", at: -30, color: COLORS.orange }, { text: "لياقة", at: -30 }, { text: "|", at: -30, color: COLORS.orange }, { text: "ثقة", at: -30 }]} />
    <KineticWords fontSize={80} words={[{ text: "الحصص", at: -30 }, { text: "الجماعية", at: -30 }, { text: "بالنادي", at: -30 }]} />
    <div style={{ fontFamily: FONTS.latin, fontWeight: 700, fontSize: 64, color: COLORS.white, textAlign: "center" }}>reshape-sa.com · @reshape.sa</div>
    <div style={{ display: "flex", justifyContent: "center" }}>
      <LogoLockup width={700} />
    </div>
  </AbsoluteFill>
);
