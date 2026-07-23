'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { FormSection } from '@/components/_editorial/FormSection';
import { FormPreviewPanel } from '@/components/_editorial/FormPreviewPanel';
import { updateSongAction, type SongEditState } from '@/app/actions/song-edit';
import { SongFormEditorialPreview } from '../form/SongFormEditorial.Preview';
import { SongEditFormEditorialFieldsIdentity } from './SongEditFormEditorial.Fields.Identity';
import { SongEditFormEditorialFieldsDetails } from './SongEditFormEditorial.Fields.Details';
import { SongEditFormEditorialFieldsLyrics } from './SongEditFormEditorial.Fields.Lyrics';

const INITIAL: SongEditState = {};

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

export const SongEditFormEditorial = ({ song }: { song: Song }) => {
  const [state, formAction, pending] = useActionState(updateSongAction, INITIAL);
  const [title, setTitle] = useState(song.title ?? '');
  const [author, setAuthor] = useState(song.author ?? '');
  const [level, setLevel] = useState(song.level ?? 'beginner');
  const [key, setKey] = useState(song.key ?? 'C');

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
          href={`/dashboard/songs/${song.id}`}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← Song
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
          Edit {song.title ?? 'song'}
        </h1>
        <p style={{ margin: '0 0 22px', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          The basics plus sections &amp; lyrics. Cover art, audio, and tab notation get edited from
          the detail view.
        </p>

        <form action={formAction}>
          <input type="hidden" name="id" value={song.id} />
          <div className="ed-grid-form">
            <div>
              <FormSection
                numeral="I · IDENTITY"
                title="Title & author"
                count={2}
                populated={[title, author].filter(Boolean).length}
              >
                <SongEditFormEditorialFieldsIdentity
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
                <SongEditFormEditorialFieldsDetails
                  level={level}
                  keyName={key}
                  capoFret={song.capo_fret}
                  tempo={song.tempo}
                  chords={song.chords}
                  onLevel={setLevel}
                  onKey={setKey}
                />
              </FormSection>

              <FormSection
                numeral="III · LYRICS"
                title="Sections & lyrics"
                count={1}
                populated={song.lyrics_with_chords ? 1 : 0}
              >
                <SongEditFormEditorialFieldsLyrics
                  lyrics={song.lyrics_with_chords}
                  error={state.errors?.lyrics_with_chords}
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
                  {pending ? 'Saving…' : 'Save changes'}
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
