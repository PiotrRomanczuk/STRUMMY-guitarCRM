type Props = {
  title: string;
  author: string;
  level: string;
  keyName: string;
};

/** Live-preview sidebar content for the "Add a song" form. */
export const SongFormEditorialPreview = ({ title, author, level, keyName }: Props) => (
  <>
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
    </div>
  </>
);
