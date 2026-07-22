'use client';

import { useActionState, useState } from 'react';

import { createSongAction, type SongFormState } from '@/app/actions/song-form';
import { SongNotesAI } from '@/components/songs/form/SongNotesAI';
import { SHOW_AI_FEATURES } from '@/lib/config/features';

import { Field } from './Field';

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Level = (typeof LEVELS)[number];

const toNumberOrNull = (value: string): number | null => {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
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

const textareaStyle = {
  ...inputStyle,
  minHeight: 120,
  resize: 'vertical' as const,
  lineHeight: 1.5,
};

const INITIAL_STATE: SongFormState = {};

export const SongFormEditorial = () => {
  const [state, formAction, pending] = useActionState(createSongAction, INITIAL_STATE);

  // Controlled fields — kept in state so the AI assistant can read the song
  // context and write generated notes back into the form. `name` attributes are
  // preserved so the native form-action submission still carries every value.
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [key, setKey] = useState('C');
  const [capoFret, setCapoFret] = useState<number | null>(null);
  const [tempo, setTempo] = useState<number | null>(null);
  const [chords, setChords] = useState('');
  const [notes, setNotes] = useState('');

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
      <Field label="Title" error={state.errors?.title} fieldId="title">
        <input
          name="title"
          required
          maxLength={200}
          placeholder="Hotel California"
          style={inputStyle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-describedby={state.errors?.title ? 'error-title' : undefined}
        />
      </Field>
      <Field label="Author" error={state.errors?.author} fieldId="author">
        <input
          name="author"
          required
          maxLength={100}
          placeholder="Eagles"
          style={inputStyle}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          aria-describedby={state.errors?.author ? 'error-author' : undefined}
        />
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <Field label="Level" error={state.errors?.level} fieldId="level">
          <select
            name="level"
            required
            style={inputStyle}
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            aria-describedby={state.errors?.level ? 'error-level' : undefined}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Key" error={state.errors?.key} fieldId="key">
          <select
            name="key"
            required
            style={inputStyle}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            aria-describedby={state.errors?.key ? 'error-key' : undefined}
          >
            {KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
        <Field label="Capo (fret)" error={state.errors?.capo_fret} optional>
          <input
            name="capo_fret"
            type="number"
            min={0}
            max={20}
            placeholder="0"
            style={monoInputStyle}
            value={capoFret ?? ''}
            onChange={(e) => setCapoFret(toNumberOrNull(e.target.value))}
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
            value={tempo ?? ''}
            onChange={(e) => setTempo(toNumberOrNull(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Chords" error={state.errors?.chords} optional>
        <input
          name="chords"
          maxLength={500}
          placeholder="C, G, Am, F"
          style={monoInputStyle}
          value={chords}
          onChange={(e) => setChords(e.target.value)}
        />
      </Field>

      <Field label="Teaching notes" error={state.errors?.notes} optional>
        {SHOW_AI_FEATURES && (
          <SongNotesAI
            songData={{
              title,
              author,
              level,
              key,
              chords,
              tempo,
              strumming_pattern: '',
              capo_fret: capoFret,
            }}
            currentNotes={notes}
            onNotesGenerated={setNotes}
            disabled={pending}
          />
        )}
        <textarea
          name="notes"
          maxLength={4000}
          placeholder={
            SHOW_AI_FEATURES
              ? 'Teaching tips and practice suggestions — or generate them with AI above.'
              : 'Teaching tips and practice suggestions.'
          }
          style={{ ...textareaStyle, marginTop: SHOW_AI_FEATURES ? 10 : 0 }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
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
