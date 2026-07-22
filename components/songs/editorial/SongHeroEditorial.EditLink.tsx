import Link from 'next/link';

type Props = { songId: string };

export const SongHeroEditorialEditLink = ({ songId }: Props) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
    <Link
      href={`/dashboard/songs/${songId}/edit`}
      className="ed-chip"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        color: 'var(--ink-3)',
        textDecoration: 'none',
        textTransform: 'uppercase',
        letterSpacing: '.1em',
        padding: '6px 12px',
        border: '1px solid var(--rule)',
        borderRadius: 99,
      }}
    >
      Edit song
    </Link>
  </div>
);
