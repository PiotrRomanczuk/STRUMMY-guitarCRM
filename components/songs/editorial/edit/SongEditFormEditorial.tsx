'use client';

import { useActionState } from 'react';

import { updateSongAction, type SongEditState } from '@/app/actions/song-edit';

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
const KEYS = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
  'Cm',
  'C#m',
  'Dm',
  'D#m',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'G#m',
  'Am',
  'A#m',
  'Bm',
] as const;

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

const monoStyle = { ...inputStyle, fontFamily: 'var(--mono)', fontSize: 13 } as const;

const INITIAL: SongEditState = {};

const Label = ({ children, optional }: { children: React.ReactNode; optional?: boolean }) => (
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
    {optional && (
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
    )}
  </div>
);

type Song = {
  id: string;
  title: string | null;
  author: string | null;
  level: string | null;
  key: string | null;
  capo_fret: number | null;
  tempo: number | null;
  chords: string | null;
  lyrics_with_chords: string | null;
};

const textareaStyle = {
  ...monoStyle,
  minHeight: 160,
  resize: 'vertical' as const,
  lineHeight: 1.5,
} as const;

export const SongEditFormEditorial = ({ song }: { song: Song }) => {
  const [state, formAction, pending] = useActionState(updateSongAction, INITIAL);

  return (
    <form
      action={formAction}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        padding: '24px 28px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <input type="hidden" name="id" value={song.id} />
      <div>
        <Label>Title</Label>
        <input
          name="title"
          required
          maxLength={200}
          defaultValue={song.title ?? ''}
          style={inputStyle}
          aria-describedby={state.errors?.title ? 'error-title' : undefined}
        />
        {state.errors?.title && <Error id="error-title" msg={state.errors.title} />}
      </div>
      <div>
        <Label>Author</Label>
        <input
          name="author"
          required
          maxLength={100}
          defaultValue={song.author ?? ''}
          style={inputStyle}
          aria-describedby={state.errors?.author ? 'error-author' : undefined}
        />
        {state.errors?.author && <Error id="error-author" msg={state.errors.author} />}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <div>
          <Label>Level</Label>
          <select name="level" required defaultValue={song.level ?? 'beginner'} style={inputStyle}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l[0].toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Key</Label>
          <select name="key" required defaultValue={song.key ?? 'C'} style={inputStyle}>
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <div>
          <Label optional>Capo (fret)</Label>
          <input
            name="capo_fret"
            type="number"
            min={0}
            max={20}
            defaultValue={song.capo_fret ?? ''}
            style={monoStyle}
          />
        </div>
        <div>
          <Label optional>Tempo (BPM)</Label>
          <input
            name="tempo"
            type="number"
            min={0}
            max={300}
            defaultValue={song.tempo ?? ''}
            style={monoStyle}
          />
        </div>
      </div>
      <div>
        <Label optional>Chords</Label>
        <input
          name="chords"
          maxLength={500}
          defaultValue={song.chords ?? ''}
          placeholder="C, G, Am, F"
          style={monoStyle}
        />
      </div>
      <div>
        <Label optional>Sections &amp; lyrics</Label>
        <textarea
          name="lyrics_with_chords"
          maxLength={20000}
          defaultValue={song.lyrics_with_chords ?? ''}
          placeholder={'[Verse 1]\nC        G\nLyrics line one…'}
          style={textareaStyle}
          aria-describedby={state.errors?.lyrics_with_chords ? 'error-lyrics' : undefined}
        />
        {state.errors?.lyrics_with_chords && (
          <Error id="error-lyrics" msg={state.errors.lyrics_with_chords} />
        )}
      </div>

      {state.errors?._form && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(184,74,58,.06)',
            border: '1px solid rgba(184,74,58,.2)',
            borderRadius: 6,
            color: 'var(--danger)',
            fontSize: 13,
          }}
        >
          {state.errors._form}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: pending ? 'var(--ink-4)' : 'var(--ink)',
            color: 'var(--paper)',
            fontSize: 13,
            fontWeight: 500,
            cursor: pending ? 'wait' : 'pointer',
            fontFamily: 'var(--sans)',
          }}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};

const Error = ({ id, msg }: { id?: string; msg: string }) => (
  <div
    id={id}
    style={{ marginTop: 4, fontSize: 11, color: 'var(--danger)', fontFamily: 'var(--mono)' }}
  >
    {msg}
  </div>
);
