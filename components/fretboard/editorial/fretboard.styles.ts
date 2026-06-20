import type { CSSProperties } from 'react';

export const sectionLabel: CSSProperties = {
  color: 'var(--ink-4)',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '.14em',
  fontWeight: 500,
  fontFamily: 'var(--mono)',
};

export const card: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--rule)',
  borderRadius: 14,
};

export const selectStyle: CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid var(--rule)',
  borderRadius: 8,
  background: 'var(--card)',
  color: 'var(--ink-2)',
  fontSize: 12,
  fontFamily: 'var(--sans)',
  cursor: 'pointer',
};

/** Pill button used by the key grid, scale/chord quick buttons, and toggles. */
export function chipButton(active: boolean): CSSProperties {
  return {
    border: active ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
    background: active ? 'var(--gold-tint)' : 'var(--card)',
    color: active ? 'var(--gold-2)' : 'var(--ink-2)',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '8px 0',
    fontFamily: 'var(--sans)',
  };
}
