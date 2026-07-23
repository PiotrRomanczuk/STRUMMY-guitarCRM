import { Field } from '../form/Field';

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
} as const;

type Props = {
  title: string;
  author: string;
  titleError?: string;
  authorError?: string;
  onTitle: (v: string) => void;
  onAuthor: (v: string) => void;
};

/** Section I — song title & author (controlled, so the preview can react live). */
export const SongEditFormEditorialFieldsIdentity = ({
  title,
  author,
  titleError,
  authorError,
  onTitle,
  onAuthor,
}: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Field label="Title" error={titleError} fieldId="title">
      <input
        name="title"
        required
        maxLength={200}
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        style={inputStyle}
        aria-describedby={titleError ? 'error-title' : undefined}
      />
    </Field>
    <Field label="Author" error={authorError} fieldId="author">
      <input
        name="author"
        required
        maxLength={100}
        value={author}
        onChange={(e) => onAuthor(e.target.value)}
        style={inputStyle}
        aria-describedby={authorError ? 'error-author' : undefined}
      />
    </Field>
  </div>
);
