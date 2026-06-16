/**
 * "Unclaimed" badge for shadow Profiles (is_shadow = true) — surfaced in the
 * editorial users list and detail per spec 04.
 */
export const ShadowBadge = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 4,
      background: 'var(--gold-tint)',
      color: 'var(--ink-2)',
      fontFamily: 'var(--mono)',
      fontSize: 9,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
    }}
  >
    Unclaimed
  </span>
);
