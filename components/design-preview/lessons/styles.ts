import type { CSSProperties } from 'react';

export const btnPrimary: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--ink)',
  color: 'var(--paper)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

export const btnGhost: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--rule)',
  background: 'var(--card)',
  color: 'var(--ink-2)',
  fontSize: 12,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

export const selectSm: CSSProperties = {
  padding: '5px 8px',
  borderRadius: 6,
  border: '1px solid var(--rule)',
  background: 'var(--card)',
  color: 'var(--ink-2)',
  fontSize: 12,
  fontFamily: 'var(--sans)',
  cursor: 'pointer',
};

// Lesson-specific icon paths (in addition to those in lib/icons).
export const LI = {
  filter: 'M3 5h18l-7 9v6l-4-2v-4z',
  sort: 'M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:
    'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6',
  email: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm18 2L12 13 2 6',
  live: 'M6 4l14 8-14 8z',
  back: 'M19 12H5M12 19l-7-7 7-7',
  close: 'M18 6L6 18M6 6l12 12',
  plusSmall: 'M12 5v14M5 12h14',
  add: 'M12 5v14M5 12h14',
  grip: 'M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01',
  copy: 'M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1',
  mic: 'M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm7-3a7 7 0 0 1-14 0M12 18v3',
  check2: 'M5 12l5 5L20 7',
  chev: 'M9 6l6 6-6 6',
  chevD: 'M6 9l6 6 6-6',
  chevL: 'M15 6l-6 6 6 6',
} as const;
