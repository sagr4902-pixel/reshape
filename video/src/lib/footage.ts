// Footage slots.
//
// No authentic RESHAPE club footage was available for this cut, so every slot renders its
// CGI fallback. When real in-club footage is approved, drop the clips into public/footage/
// and set the file name here: the scene then plays the clip (graded to the brand look)
// instead of the CGI shot, with the same timing, typography and audio.
//
// Use only footage RESHAPE owns or has licensed - never third-party social media clips.

export type FootageSlotId =
  | "hook_grip" // 0.0-2.5 s  close-up: chalked hands gripping the bar
  | "hook_lift" // 2.5-6.0 s  powerful lift / slam
  | "brand_group" // 6.0-12.0 s group warming up in the club, wide
  | "group_sync" // 12.0-16.0 s synchronised group movement
  | "group_energy" // 16.0-20.0 s high-energy group interaction / close-ups
  | "transformation_push" // 20.0-24.0 s athlete pushing through a hard set
  | "transformation_finish" // 24.0-26.0 s slow-motion rep completion
  | "cta_montage"; // 26.0-29.5 s fast montage before the end card

export const FOOTAGE: Record<FootageSlotId, { file: string | null; startFrom?: number }> = {
  hook_grip: { file: null },
  hook_lift: { file: null },
  brand_group: { file: null },
  group_sync: { file: null },
  group_energy: { file: null },
  transformation_push: { file: null },
  transformation_finish: { file: null },
  cta_montage: { file: null },
};
