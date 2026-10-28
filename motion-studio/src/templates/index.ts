import React from "react";
import { TemplateProps } from "../lib/timeline";
import { BrandReveal } from "./BrandReveal";
import { KineticLines } from "./KineticLines";
import { ServiceSteps } from "./ServiceSteps";
import { SportsImpact } from "./SportsImpact";
import { StatCounters } from "./StatCounters";
import { WeekInfographic } from "./WeekInfographic";

/**
 * The template library. A job's scene names one of these ids.
 * `use` tells the planner (and Claude, when writing a job) what each one is for.
 */
export const TEMPLATES = {
  "kinetic-lines": {
    component: KineticLines,
    title: "Bold kinetic typography",
    use: "A single strong statement, 3–8 words, building word by word. Lead-in can carry the wordmark.",
  },
  "service-steps": {
    component: ServiceSteps,
    title: "Icon-based service explainer",
    use: "2–4 features or steps, each with a Lucide icon and a one-line caption.",
  },
  "sports-impact": {
    component: SportsImpact,
    title: "Premium sports promo",
    use: "The hook. A short punchy line with one repeated word and a punchline that slams in.",
  },
  "week-infographic": {
    component: WeekInfographic,
    title: "Educational infographic",
    use: "Explaining a schedule, frequency or comparison across options on a 7-day grid.",
  },
  "stat-counters": {
    component: StatCounters,
    title: "Animated statistics",
    use: "1–2 published brand numbers, counted up to land on the spoken number. Every stat needs a source.",
  },
  "brand-reveal": {
    component: BrandReveal,
    title: "Brand reveal and call-to-action",
    use: "The ending: official logo reveal, CTA pill, supporting line and URL.",
  },
} as const;

export type TemplateId = keyof typeof TEMPLATES;

/* eslint-disable @typescript-eslint/no-explicit-any -- each template types its own props; job.json supplies them */
export const getTemplate = (id: string): React.FC<TemplateProps<any>> => {
  const t = (TEMPLATES as Record<string, { component: React.FC<TemplateProps<any>> }>)[id];
  if (!t) throw new Error(`Unknown template "${id}". Known: ${Object.keys(TEMPLATES).join(", ")}`);
  return t.component;
};
/* eslint-enable @typescript-eslint/no-explicit-any */
