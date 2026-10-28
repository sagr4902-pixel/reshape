import { LOGO_BOX } from "../../components/logoPaths";
import { local, wordAt } from "../../lib/timeline";

// Shared numbers for the "brand" scene: VO sync points and the 3D -> 2D logo match-cut.

/** Scene-relative frame of a VO word (asserts it really belongs to this scene). */
const vo = (text: string, occurrence = 0) => {
  const f = local("brand", wordAt(text, occurrence));
  if (f < 0 || f >= 180) throw new Error(`VO word ${text} is outside the brand scene (${f})`);
  return f;
};

export const VO = {
  kull: vo("كل", 1), // 31
  hissa: vo("حصّة"), // 38
  khutwa: vo("خطوة"), // 55
  jadida: vo("جديدة"), // 66
  quwwa: vo("لقوّتك"), // 86
  liyaqa: vo("ولياقتك"), // 111
  thiqa: vo("وثقتك"), // 138
};

/** Frame of the 3D -> 2D match-cut (on the beat: 120 BPM = 15 frames per beat). */
export const CUT = 45;

// ---- 2D lockup geometry (LogoLockup draws the LOGO_BOX viewBox at `LOCKUP_W` px wide)
export const LOCKUP_W = 760;
export const LOCKUP_CX = 540;
export const LOCKUP_CY = 600;
const PX = LOCKUP_W / LOGO_BOX.w; // px per logo unit
export const LOCKUP_H = LOGO_BOX.h * PX;
/** Visible height of the mark inside the lockup at scale 1 (path y-extent 29.625 .. 118.875). */
export const MARK2D_H = 89.25 * PX;
/** Horizontal offset of the mark centre (x = 52.625 in logo units) from the lockup centre. */
export const MARK_DX = (52.625 - (LOGO_BOX.x + LOGO_BOX.w / 2)) * PX;
/** Vertical offset of the mark centre (y = 74.25) from the lockup centre. */
export const MARK_DY = (74.25 - (LOGO_BOX.y + LOGO_BOX.h / 2)) * PX;

/** Mark height (px) on screen at the cut: the 3D mark lands at exactly this size/position. */
export const MATCH_H = 250;
export const MATCH_X = 540;
export const MATCH_Y = LOCKUP_CY + MARK_DY;

// ---- 3D camera maths for the match (vertical fov, 1920 px frame height)
export const MARK_FOV = 30;
export const PX_PER_M = 1920 / (2 * Math.tan(((MARK_FOV / 2) * Math.PI) / 180));
export const MARK_SCALE = 0.55;
/** World height of the mark at MARK_SCALE (Mark3D normalises by LOGO_BOX.h; bevel adds ~1.2%). */
export const MARK_WORLD_H = (89.25 / LOGO_BOX.h + 0.012) * MARK_SCALE;
/** Distance of the front cap in front of the mark's origin. */
export const MARK_FRONT = (0.09 + 0.025) * MARK_SCALE;
