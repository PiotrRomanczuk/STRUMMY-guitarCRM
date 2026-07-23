const monoStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--mono)',
  fontSize: 13,
  color: 'var(--ink)',
} as const;
const textareaStyle = {
  ...monoStyle,
  minHeight: 160,
  resize: 'vertical' as const,
  lineHeight: 1.5,
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.12em',
      }}
    >
      {children}
    </span>
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 9,
        color: 'var(--ink-5)',
        textTransform: 'uppercase',
        letterSpacing: '.12em',
      }}
    >
      Optional
    </span>
  </div>
);

type Props = { lyrics: string | null; error?: string };

/** Section III — sections & lyrics (uncontrolled; not needed by the preview). */
export const SongEditFormEditorialFieldsLyrics = ({ lyrics, error }: Props) => (
  <div>
    <Label>Sections &amp; lyrics</Label>
    <textarea
      name="lyrics_with_chords"
      maxLength={20000}
      defaultValue={lyrics ?? ''}
      placeholder={'[Verse 1]\nC        G\nLyrics line one…'}
      style={textareaStyle}
      aria-describedby={error ? 'error-lyrics' : undefined}
    />
    {error && (
      <div
        id="error-lyrics"
        style={{ marginTop: 4, fontSize: 11, color: 'var(--danger)', fontFamily: 'var(--mono)' }}
      >
        {error}
      </div>
    )}
  </div>
);
