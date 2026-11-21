'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link } from '@/i18n/navigation';
import { track } from '@/lib/analytics';
import { normalizeSaudiMobileShape } from '@/lib/phone';
import { COMMENT_MAX, HELP_ME_CHOOSE, NAME_MAX, NAME_RE } from './constants';

type FieldKey = 'name' | 'phone' | 'program' | 'intent' | 'comment' | 'privacy';
type FormError = FieldKey | 'network' | 'unavailable' | 'rate' | 'conflict' | 'generic';

export interface LeadFormLabels {
  requiredNote: string;
  required: string;
  optional: string;
  name: string;
  nameGuardian: string;
  nameHint: string;
  phone: string;
  phoneHint: string;
  program: string;
  programHelp: string;
  intent: string;
  intents: Record<string, string>;
  trialNote: string;
  comment: string;
  commentHint: string;
  privacy: string;
  privacyLink: string;
  marketing: string;
  honeypot: string;
  submit: string;
  submitting: string;
  errors: Record<FormError | 'summary', string>;
  successTitle: string;
  successBody: string;
  again: string;
  explore: string;
}

interface Props {
  locale: 'ar' | 'en';
  labels: LeadFormLabels;
  programs: { id: string; title: string; guardian: boolean }[];
  intents: readonly string[];
  initial: { programId: string; intent: string; zoneId?: string; source?: string };
  noticeVersion: string;
}

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16));

export function LeadForm({ locale, labels, programs, intents, initial, noticeVersion }: Props) {
  const uid = useId();
  const [values, setValues] = useState({
    name: '',
    phone: '',
    programId: initial.programId,
    intent: initial.intent,
    comment: '',
    privacy: false,
    marketing: false, // unchecked by default, never pre-ticked
    website: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldKey[]>([]);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const started = useRef(false);
  // One key per attempt; reused for retries of the same payload, replaced when the payload changes.
  const attempt = useRef<{ key: string; payload: string } | null>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);
  useEffect(() => {
    if (fieldErrors.length || formError) summaryRef.current?.focus();
  }, [fieldErrors, formError]);

  const set = <K extends keyof typeof values>(k: K, v: (typeof values)[K]) => {
    if (!started.current) {
      started.current = true;
      track('interest_form_start', { locale, programId: values.programId, intent: values.intent });
    }
    setValues((s) => ({ ...s, [k]: v }));
  };

  const guardian = programs.find((p) => p.id === values.programId)?.guardian ?? false;
  const id = (k: string) => `${uid}-${k}`;
  const has = (k: FieldKey) => fieldErrors.includes(k);

  function validate(): FieldKey[] {
    const errs: FieldKey[] = [];
    const name = values.name.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (name.length < 2 || name.length > NAME_MAX || !NAME_RE.test(name)) errs.push('name');
    if (!normalizeSaudiMobileShape(values.phone)) errs.push('phone');
    if (values.programId !== HELP_ME_CHOOSE && !programs.some((p) => p.id === values.programId)) errs.push('program');
    if (!intents.includes(values.intent)) errs.push('intent');
    if (values.comment.length > COMMENT_MAX) errs.push('comment');
    if (!values.privacy) errs.push('privacy');
    return errs;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return; // double-click guard (the server is idempotent as well)
    setFormError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (errs.length) return;

    const body = {
      name: values.name,
      phone: values.phone,
      programId: values.programId,
      intent: values.intent,
      comment: values.comment || undefined,
      locale,
      zoneId: initial.zoneId,
      source: initial.source,
      noticeVersion,
      privacyAcknowledged: true,
      marketingConsent: values.marketing,
      website: values.website || undefined,
    };
    const payload = JSON.stringify(body);
    if (!attempt.current || attempt.current.payload !== payload) attempt.current = { key: newKey(), payload };

    setStatus('submitting');
    let next: FormError | null = null;
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, idempotencyKey: attempt.current.key }),
      });
      if (res.ok) {
        // Success is shown only after the server confirmed the committed record.
        setStatus('success');
        track('interest_form_submit_success', { locale, programId: values.programId, intent: values.intent });
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { fields?: FieldKey[] };
      if (res.status === 400) {
        setFieldErrors(data.fields?.length ? data.fields : []);
        next = data.fields?.length ? null : 'generic';
      } else if (res.status === 409) {
        attempt.current = null; // next press uses a fresh key
        next = 'conflict';
      } else if (res.status === 429) next = 'rate';
      else if (res.status === 503) next = 'unavailable';
      else next = 'generic';
    } catch {
      next = 'network';
    }
    setFormError(next);
    setStatus('idle');
    track('interest_form_submit_error', { locale, programId: values.programId, intent: values.intent });
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border-2 border-ok bg-white p-6 sm:p-8" role="status" data-testid="lead-success">
        <h2 ref={successRef} tabIndex={-1} className="t-3 outline-none">
          {labels.successTitle}
        </h2>
        <p className="mt-3">{labels.successBody}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/explore" className="btn btn-dark">
            {labels.explore}
          </Link>
          <button
            type="button"
            className="btn btn-line"
            onClick={() => {
              attempt.current = null;
              setValues((s) => ({ ...s, comment: '', privacy: false, marketing: false }));
              setStatus('idle');
            }}
          >
            {labels.again}
          </button>
        </div>
      </div>
    );
  }

  const errorList: { key: FormError; href?: string }[] = [
    ...fieldErrors.map((k) => ({ key: k as FormError, href: `#${id(k)}` })),
    ...(formError ? [{ key: formError }] : []),
  ];
  const req = <span className="font-normal text-mute"> ({labels.required})</span>;
  const opt = <span className="font-normal text-mute"> ({labels.optional})</span>;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6" data-testid="lead-form" aria-describedby={id('note')}>
      <p id={id('note')} className="mute text-[0.92rem]">
        {labels.requiredNote}
      </p>

      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-lg border-2 border-danger bg-white p-4 outline-none" data-testid="lead-errors">
          <p className="font-semibold text-danger">{labels.errors.summary}</p>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            {errorList.map((er) => (
              <li key={er.key}>{er.href ? <a href={er.href} className="underline">{labels.errors[er.key]}</a> : labels.errors[er.key]}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="field">
        <label htmlFor={id('name')}>
          {guardian ? labels.nameGuardian : labels.name}
          {req}
        </label>
        <input
          id={id('name')}
          name="name"
          className="input"
          autoComplete="name"
          maxLength={NAME_MAX}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={has('name')}
          aria-describedby={`${id('name-h')}${has('name') ? ` ${id('name-e')}` : ''}`}
        />
        <p id={id('name-h')} className="field-hint">
          {labels.nameHint}
        </p>
        {has('name') && (
          <p id={id('name-e')} className="field-error">
            {labels.errors.name}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={id('phone')}>
          {labels.phone}
          {req}
        </label>
        <input
          id={id('phone')}
          name="phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          className="input text-start"
          style={{ textAlign: locale === 'ar' ? 'right' : 'left' }}
          autoComplete="tel"
          maxLength={32}
          placeholder="05XXXXXXXX"
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
          aria-invalid={has('phone')}
          aria-describedby={`${id('phone-h')}${has('phone') ? ` ${id('phone-e')}` : ''}`}
        />
        <p id={id('phone-h')} className="field-hint">
          {labels.phoneHint}
        </p>
        {has('phone') && (
          <p id={id('phone-e')} className="field-error">
            {labels.errors.phone}
          </p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="field">
          <label htmlFor={id('program')}>
            {labels.program}
            {req}
          </label>
          <select id={id('program')} name="programId" className="input" value={values.programId} onChange={(e) => set('programId', e.target.value)} aria-invalid={has('program')}>
            <option value={HELP_ME_CHOOSE}>{labels.programHelp}</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {has('program') && <p className="field-error">{labels.errors.program}</p>}
        </div>
        <div className="field">
          <label htmlFor={id('intent')}>
            {labels.intent}
            {req}
          </label>
          <select
            id={id('intent')}
            name="intent"
            className="input"
            value={values.intent}
            onChange={(e) => set('intent', e.target.value)}
            aria-invalid={has('intent')}
            aria-describedby={values.intent === 'trial-request' ? id('trial') : undefined}
          >
            {intents.map((i) => (
              <option key={i} value={i}>
                {labels.intents[i]}
              </option>
            ))}
          </select>
          {values.intent === 'trial-request' && (
            <p id={id('trial')} className="field-hint">
              {labels.trialNote}
            </p>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor={id('comment')}>
          {labels.comment}
          {opt}
        </label>
        <textarea
          id={id('comment')}
          name="comment"
          rows={3}
          className="input"
          maxLength={COMMENT_MAX}
          value={values.comment}
          onChange={(e) => set('comment', e.target.value)}
          aria-invalid={has('comment')}
          aria-describedby={id('comment-h')}
        />
        <p id={id('comment-h')} className="field-hint">
          {labels.commentHint}
        </p>
      </div>

      {/* Honeypot: hidden from people and assistive technology; autofill is told to skip it. */}
      <div aria-hidden="true" className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id('website')}>{labels.honeypot}</label>
        <input id={id('website')} name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => setValues((s) => ({ ...s, website: e.target.value }))} />
      </div>

      <div className="space-y-4 border-t border-line pt-6">
        <div>
          <div className="check">
            <input id={id('privacy')} type="checkbox" checked={values.privacy} onChange={(e) => set('privacy', e.target.checked)} aria-invalid={has('privacy')} aria-describedby={has('privacy') ? id('privacy-e') : undefined} />
            <label htmlFor={id('privacy')}>
              {labels.privacy}
              {req}{' '}
              <Link href="/privacy" target="_blank" className="underline">
                {labels.privacyLink}
              </Link>
            </label>
          </div>
          {has('privacy') && (
            <p id={id('privacy-e')} className="field-error ms-9">
              {labels.errors.privacy}
            </p>
          )}
        </div>
        <div className="check">
          <input id={id('marketing')} type="checkbox" checked={values.marketing} onChange={(e) => set('marketing', e.target.checked)} />
          <label htmlFor={id('marketing')}>{labels.marketing}</label>
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full sm:w-auto sm:min-w-[220px]" aria-disabled={status === 'submitting'} data-testid="lead-submit">
        {status === 'submitting' ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
