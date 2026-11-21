'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

/** Fires program_view once per mount. Renders nothing. */
export function ProgramView({ programId, locale }: { programId: string; locale: string }) {
  useEffect(() => {
    track('program_view', { programId, locale });
  }, [programId, locale]);
  return null;
}
