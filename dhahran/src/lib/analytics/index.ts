/**
 * Provider-agnostic analytics wrapper with an explicit disabled state.
 * No provider is bundled. When enabled, events are handed to a registered
 * sink; otherwise they are dropped. Failures never affect the UI.
 *
 * Only allow-listed event names and non-personal properties pass.
 */
export const EVENT_NAMES = [
  'program_view',
  'interest_form_start',
  'interest_form_submit_success',
  'interest_form_submit_error',
  'membership_outbound_click',
  'contact_click',
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

const PROP_KEYS = ['locale', 'programId', 'zoneId', 'intent', 'ctaLocation', 'campaignId'] as const;
export type EventProps = Partial<Record<(typeof PROP_KEYS)[number], string>>;
type Sink = (name: EventName, props: EventProps) => void;

let sink: Sink | null = null;
let enabled = false;

export function configureAnalytics(opts: { enabled: boolean; sink?: Sink }) {
  enabled = opts.enabled;
  sink = opts.sink ?? null;
}

const SAFE_VALUE = /^[a-z0-9][a-z0-9_-]{0,47}$/i;

/** Strip anything that is not an allow-listed key with a short identifier-like value. */
export function sanitizeProps(props: Record<string, unknown>): EventProps {
  const out: EventProps = {};
  for (const key of PROP_KEYS) {
    const v = props[key];
    if (typeof v === 'string' && SAFE_VALUE.test(v)) out[key] = v;
  }
  return out;
}

export function track(name: EventName, props: Record<string, unknown> = {}) {
  if (!enabled || !sink) return;
  if (!(EVENT_NAMES as readonly string[]).includes(name)) return;
  try {
    sink(name, sanitizeProps(props));
  } catch {
    /* analytics must never break navigation or registration */
  }
}
