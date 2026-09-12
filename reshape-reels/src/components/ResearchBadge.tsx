import React from 'react';
import { RESHAPE_THEME as T } from '../theme';

export const ResearchBadge: React.FC<{ text: string; colour?: string }> = ({ text, colour = T.color.accent }) => (
  <div style={{
    fontFamily: T.font.body, fontSize: T.size.cardLabel, letterSpacing: 3,
    color: colour, textTransform: 'uppercase',
  }}>
    {text}
  </div>
);
