export const initialsFor = (name: string | null, email: string | null): string => {
  const src = (name && name.trim()) || (email && email.trim()) || '?';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0] ?? '?')[0].toUpperCase();
};

type Props = {
  name: string | null;
  email?: string | null;
  size?: number;
};

/** Small initials-circle avatar for chip/preview contexts (matches the
 * gradient-circle pattern already used on StudentDetailEditorial). */
export const FormAvatar = ({ name, email = null, size = 28 }: Props) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      flexShrink: 0,
      background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-dim))',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--ink-2)',
      fontFamily: 'var(--serif)',
      fontSize: Math.max(11, Math.round(size * 0.4)),
      fontWeight: 500,
    }}
  >
    {initialsFor(name, email)}
  </div>
);
