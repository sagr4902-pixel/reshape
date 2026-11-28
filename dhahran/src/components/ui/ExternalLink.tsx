'use client';

import type { ReactNode } from 'react';
import { track, type EventName } from '@/lib/analytics';

/** Outbound link. An outbound click is never counted as a sale. */
export function ExternalLink({
  href,
  children,
  className,
  event,
  location,
  programId,
  testId,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  event?: EventName;
  location?: string;
  programId?: string;
  testId?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      data-testid={testId}
      onClick={() => event && track(event, { ctaLocation: location, programId })}
    >
      {children}
    </a>
  );
}
