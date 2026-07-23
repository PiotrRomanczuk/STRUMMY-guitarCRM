'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { FormSection } from '@/components/_editorial/FormSection';
import { FormPreviewPanel } from '@/components/_editorial/FormPreviewPanel';
import { createSongAction, type SongFormState } from '@/app/actions/song-form';

import { SongFormEditorialFieldsIdentity } from './SongFormEditorial.Fields.Identity';
import { SongFormEditorialFieldsDetails } from './SongFormEditorial.Fields.Details';
import { SongFormEditorialFieldsNotes } from './SongFormEditorial.Fields.Notes';
import { SongFormEditorialPreview } from './SongFormEditorial.Preview';

type Level = 'beginner' | 'intermediate' | 'advanced';

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
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        minHeight: '100%',
        padding: '28px 32px 64px',
      }}
    >
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <Link
          href="/dashboard/songs"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← Songs
        </Link>
        <h1
          style={{
            margin: '8px 0 6px',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          Add a song
        </h1>
        <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          The basics — title, author, level, key. Cover art, audio, lyrics, and tab notation get
          attached after the song lands in your library.
        </p>

        <form action={formAction}>
          <div className="ed-grid-form">
            <div>
              <FormSection
                numeral="I · IDENTITY"
                title="Title & author"
                count={2}
                populated={[title, author].filter(Boolean).length}
              >
                <SongFormEditorialFieldsIdentity
                  title={title}
                  author={author}
                  titleError={state.errors?.title}
                  authorError={state.errors?.author}
                  onTitle={setTitle}
                  onAuthor={setAuthor}
                />
              </FormSection>

              <FormSection
                numeral="II · DETAILS"
                title="Level, key & rhythm"
                count={2}
                populated={2}
              >
                <SongFormEditorialFieldsDetails
                  level={level}
                  key_={key}
                  capoFret={capoFret}
                  tempo={tempo}
                  chords={chords}
                  levelError={state.errors?.level}
                  keyError={state.errors?.key}
                  capoError={state.errors?.capo_fret}
                  tempoError={state.errors?.tempo}
                  chordsError={state.errors?.chords}
                  onLevel={setLevel}
                  onKey={setKey}
                  onCapoFret={setCapoFret}
                  onTempo={setTempo}
                  onChords={setChords}
                />
              </FormSection>

              <FormSection
                numeral="III · NOTES"
                title="Teaching notes"
                count={1}
                populated={notes ? 1 : 0}
              >
                <SongFormEditorialFieldsNotes
                  notes={notes}
                  notesError={state.errors?.notes}
                  pending={pending}
                  songData={{ title, author, level, key, chords, tempo, capo_fret: capoFret }}
                  onNotes={setNotes}
                />
              </FormSection>

              {state.errors?._form && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(184,74,58,.06)',
                    border: '1px solid rgba(184,74,58,.2)',
                    borderRadius: 6,
                    color: 'var(--danger)',
                    fontSize: 13,
                    marginBottom: 16,
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
                  {pending ? 'Saving…' : 'Add song'}
                </button>
              </div>
            </div>

            <FormPreviewPanel>
              <SongFormEditorialPreview title={title} author={author} level={level} keyName={key} />
            </FormPreviewPanel>
          </div>
        </form>
      </div>
    </div>
  );
};
