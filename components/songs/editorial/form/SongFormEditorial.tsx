'use client';

import { useActionState } from 'react';

import { createSongAction, type SongFormState } from '@/app/actions/song-form';

import { Field } from './Field';

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
};

const monoInputStyle = {
  ...inputStyle,
  fontFamily: 'var(--mono)',
  fontSize: 13,
};

const INITIAL_STATE: SongFormState = {};

export const SongFormEditorial = () => {
  const [state, formAction, pending] = useActionState(createSongAction, INITIAL_STATE);

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
      <Field label="Title" error={state.errors?.title}>
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Hotel California"
          style={inputStyle}
        />
      </Field>
      <Field label="Author" error={state.errors?.author}>
        <input name="author" required maxLength={100} placeholder="Eagles" style={inputStyle} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Level" error={state.errors?.level}>
          <select name="level" required defaultValue="beginner" style={inputStyle}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Key" error={state.errors?.key}>
          <select name="key" required defaultValue="C" style={inputStyle}>
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Capo (fret)" error={state.errors?.capo_fret} optional>
          <input
            name="capo_fret"
            type="number"
            min={0}
            max={20}
            placeholder="0"
            style={monoInputStyle}
          />
        </Field>
        <Field label="Tempo (BPM)" error={state.errors?.tempo} optional>
          <input
            name="tempo"
            type="number"
            min={0}
            max={300}
            placeholder="120"
            style={monoInputStyle}
          />
        </Field>
      </div>
      <Field label="Chords" error={state.errors?.chords} optional>
        <input name="chords" maxLength={500} placeholder="C, G, Am, F" style={monoInputStyle} />
      </Field>

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

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
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
          {pending ? 'Saving…' : 'Add song'}
        </button>
      </div>
    </form>
  );
};
