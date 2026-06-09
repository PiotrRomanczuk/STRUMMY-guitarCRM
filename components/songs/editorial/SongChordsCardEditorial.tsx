import { Card, CardHeader, ChordGrid } from './primitives';

type Props = { title: string; chordTokens: string[] };

export const SongChordsCardEditorial = ({ title, chordTokens }: Props) => {
  if (chordTokens.length === 0) {
    return (
      <Card>
        <CardHeader eyebrow="Voicings" title="Chords" />
        <div
          style={{
            padding: '0 24px 28px',
            fontStyle: 'italic',
            color: 'var(--ink-4)',
            fontFamily: 'var(--serif)',
            fontSize: 14,
          }}
        >
          No chord chart on file yet. Edit the song to add chords.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        eyebrow="Voicings"
        title={
          <>
            Chords in <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{title}</em>
          </>
        }
      />
      <div
        style={{
          padding: '0 24px 22px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 14,
        }}
      >
        {chordTokens.map((c) => (
          <div
            key={c}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '10px 4px',
              border: '1px solid var(--rule)',
              borderRadius: 8,
              background: 'var(--paper)',
            }}
          >
            <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500 }}>{c}</div>
            <ChordGrid name={c} size={56} />
          </div>
        ))}
      </div>
    </Card>
  );
};
