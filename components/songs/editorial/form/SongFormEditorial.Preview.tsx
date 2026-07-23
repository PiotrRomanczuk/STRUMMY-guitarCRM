type Props = {
  title: string;
  author: string;
  level: string;
  keyName: string;
  capoFret: number | null;
  tempo: number | null;
  chords: string[];
  category: string;
  coverImageUrl?: string | null;
  hasYoutube: boolean;
  hasSpotify: boolean;
};

const dotStyle = (on: boolean, color: string): React.CSSProperties => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: on ? color : 'var(--rule)',
  display: 'inline-block',
});

const initialsFor = (title: string): string =>
  title
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '—';

/** Live-preview sidebar content for the "Add a song" form. */
export const SongFormEditorialPreview = ({
  title,
  author,
  level,
  keyName,
  capoFret,
  tempo,
  chords,
  category,
  coverImageUrl,
  hasYoutube,
  hasSpotify,
}: Props) => (
  <>
    {coverImageUrl ? (
      // eslint-disable-next-line @next/next/no-img-element -- 3rd-party Spotify cover art preview
      <img
        src={coverImageUrl}
        alt=""
        style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: 8,
          objectFit: 'cover',
          marginBottom: 14,
        }}
      />
    ) : (
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: 8,
          marginBottom: 14,
          background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-dim))',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--serif)',
          fontSize: 28,
          color: 'var(--ink-2)',
        }}
      >
        {initialsFor(title || 'New song')}
      </div>
    )}
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontStyle: 'italic',
        fontSize: 20,
        fontWeight: 500,
        marginBottom: 6,
      }}
    >
      {title || 'New song'}
    </div>
    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>{author || '—'}</div>
    <div
      style={{
        paddingTop: 12,
        borderTop: '1px solid var(--rule)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        fontSize: 12,
        marginBottom: chords.length || category ? 14 : 0,
      }}
    >
      <div>
        <div
          style={{
            color: 'var(--ink-4)',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            textTransform: 'uppercase',
          }}
        >
          Level
        </div>
        <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{level}</div>
      </div>
      <div>
        <div
          style={{
            color: 'var(--ink-4)',
            fontFamily: 'var(--mono)',
            fontSize: 10,
            textTransform: 'uppercase',
          }}
        >
          Key
        </div>
        <div style={{ fontWeight: 500 }}>{keyName}</div>
      </div>
      {capoFret !== null && (
        <div>
          <div
            style={{
              color: 'var(--ink-4)',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              textTransform: 'uppercase',
            }}
          >
            Capo
          </div>
          <div style={{ fontWeight: 500 }}>{capoFret}fr</div>
        </div>
      )}
      {tempo !== null && (
        <div>
          <div
            style={{
              color: 'var(--ink-4)',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              textTransform: 'uppercase',
            }}
          >
            Tempo
          </div>
          <div style={{ fontWeight: 500 }}>{tempo} bpm</div>
        </div>
      )}
    </div>
    {chords.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: category ? 10 : 0 }}>
        {chords.map((c) => (
          <span
            key={c}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'var(--gold-tint)',
              color: 'var(--gold-2)',
            }}
          >
            {c}
          </span>
        ))}
      </div>
    )}
    {(category || hasYoutube || hasSpotify) && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: 'var(--ink-3)',
        }}
      >
        {category && <span>{category}</span>}
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={dotStyle(hasYoutube, '#e63946')} title="YouTube link" />
          <span style={dotStyle(hasSpotify, '#3a7d3a')} title="Spotify link" />
        </span>
      </div>
    )}
  </>
);
