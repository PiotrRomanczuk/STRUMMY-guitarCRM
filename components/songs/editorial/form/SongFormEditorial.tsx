'use client';

import Link from 'next/link';
import { useActionState, useRef, useState } from 'react';

import { FormSection } from '@/components/_editorial/FormSection';
import { FormPreviewPanel } from '@/components/_editorial/FormPreviewPanel';
import { createSongAction, type SongFormState } from '@/app/actions/song-form';

import { SongFormEditorialFieldsIdentity } from './SongFormEditorial.Fields.Identity';
import { SongFormEditorialFieldsDetails } from './SongFormEditorial.Fields.Details';
import { SongFormEditorialFieldsChords } from './SongFormEditorial.Fields.Chords';
import { SongFormEditorialFieldsStrumming } from './SongFormEditorial.Fields.Strumming';
import { SongFormEditorialFieldsExternal } from './SongFormEditorial.Fields.External';
import { SongFormEditorialFieldsNotes } from './SongFormEditorial.Fields.Notes';
import { SongFormEditorialFieldsLyrics } from './SongFormEditorial.Fields.Lyrics';
import { SongFormEditorialCoverUpload } from './SongFormEditorial.CoverUpload';
import { SongFormEditorialPreview } from './SongFormEditorial.Preview';
import { SongFormEditorialCompletionTracker } from './SongFormEditorial.CompletionTracker';
import {
  SongFormEditorialSpotifyAccelerator,
  type SpotifyAutoFill,
} from './SongFormEditorial.SpotifyAccelerator';
import { SongFormEditorialDuplicateWarning } from './SongFormEditorial.DuplicateWarning';

type Level = 'beginner' | 'intermediate' | 'advanced';

const INITIAL_STATE: SongFormState = {};

// eslint-disable-next-line max-lines-per-function -- single-page editorial form wiring 9 sub-sections
export const SongFormEditorial = () => {
  const [state, formAction, pending] = useActionState(createSongAction, INITIAL_STATE);

  // Controlled fields — kept in state so the AI assistant, Spotify accelerator,
  // and live preview can all read/write the same values. `name` attributes are
  // preserved so the native form-action submission still carries every value.
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [level, setLevel] = useState<Level>('beginner');
  const [key, setKey] = useState('C');
  const [capoFret, setCapoFret] = useState<number | null>(null);
  const [tempo, setTempo] = useState<number | null>(null);
  const [timeSignature, setTimeSignature] = useState<number | null>(null);
  const [releaseYear, setReleaseYear] = useState<number | null>(null);
  const [chords, setChords] = useState<string[]>([]);
  const [strumming, setStrumming] = useState('');
  const [notes, setNotes] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [category, setCategory] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [spotifyLinkUrl, setSpotifyLinkUrl] = useState('');
  const [ultimateGuitarLink, setUltimateGuitarLink] = useState('');
  const [tiktokShortUrl, setTiktokShortUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const isDraftRef = useRef<HTMLInputElement>(null);

  const applySpotifyAutoFill = (fill: SpotifyAutoFill) => {
    setTitle(fill.title);
    setAuthor(fill.author);
    setSpotifyLinkUrl(fill.spotifyLinkUrl);
    setCoverImageUrl(fill.coverImageUrl);
    if (fill.releaseYear) setReleaseYear(fill.releaseYear);
    if (fill.key) setKey(fill.key);
    if (fill.tempo) setTempo(fill.tempo);
    if (fill.timeSignature) setTimeSignature(fill.timeSignature);
  };

  const essentialsPopulated = [title, author].filter(Boolean).length;
  const musicalPopulated = [capoFret, tempo, timeSignature, releaseYear].filter(
    (v) => v !== null
  ).length;
  const resourcesPopulated = [
    youtubeUrl,
    spotifyLinkUrl,
    ultimateGuitarLink,
    tiktokShortUrl,
  ].filter(Boolean).length;

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
          Search Spotify to auto-fill, or enter manually. Only title, artist, level, and key are
          required.
        </p>

        <SongFormEditorialSpotifyAccelerator onAutoFill={applySpotifyAutoFill} />
        <SongFormEditorialDuplicateWarning title={title} author={author} />

        <form action={formAction}>
          <input type="hidden" name="cover_image_url" value={coverImageUrl ?? ''} />
          <input type="hidden" name="chords" value={chords.join(', ')} />
          <input type="hidden" name="strumming_pattern" value={strumming} />
          <input type="hidden" name="is_draft" ref={isDraftRef} defaultValue="false" />

          <div className="ed-grid-form">
            <div>
              <FormSection
                numeral="I · ESSENTIALS"
                title="The basics"
                count={2}
                populated={essentialsPopulated}
              >
                <SongFormEditorialFieldsIdentity
                  title={title}
                  author={author}
                  titleError={state.errors?.title}
                  authorError={state.errors?.author}
                  onTitle={setTitle}
                  onAuthor={setAuthor}
                />
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.12em',
                      marginBottom: 6,
                    }}
                  >
                    Cover image <span style={{ color: 'var(--ink-5)' }}>Optional</span>
                  </div>
                  <SongFormEditorialCoverUpload value={coverImageUrl} onChange={setCoverImageUrl} />
                </div>
              </FormSection>

              <FormSection
                numeral="II · MUSICAL"
                title="Performance details"
                count={4}
                populated={musicalPopulated}
              >
                <SongFormEditorialFieldsDetails
                  level={level}
                  key_={key}
                  capoFret={capoFret}
                  tempo={tempo}
                  timeSignature={timeSignature}
                  releaseYear={releaseYear}
                  levelError={state.errors?.level}
                  keyError={state.errors?.key}
                  onLevel={setLevel}
                  onKey={setKey}
                  onCapoFret={setCapoFret}
                  onTempo={setTempo}
                  onTimeSignature={setTimeSignature}
                  onReleaseYear={setReleaseYear}
                />
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.12em',
                      marginBottom: 6,
                    }}
                  >
                    Chords <span style={{ color: 'var(--ink-5)' }}>Optional</span>
                  </div>
                  <SongFormEditorialFieldsChords chords={chords} onChange={setChords} />
                </div>
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.12em',
                      marginBottom: 6,
                    }}
                  >
                    Strumming pattern <span style={{ color: 'var(--ink-5)' }}>Optional</span>
                  </div>
                  <SongFormEditorialFieldsStrumming value={strumming} onChange={setStrumming} />
                </div>
              </FormSection>

              <FormSection
                numeral="III · RESOURCES"
                title="External links"
                count={4}
                populated={resourcesPopulated}
              >
                <SongFormEditorialFieldsExternal
                  category={category}
                  youtubeUrl={youtubeUrl}
                  spotifyLinkUrl={spotifyLinkUrl}
                  ultimateGuitarLink={ultimateGuitarLink}
                  tiktokShortUrl={tiktokShortUrl}
                  onCategory={setCategory}
                  onYoutubeUrl={setYoutubeUrl}
                  onSpotifyLinkUrl={setSpotifyLinkUrl}
                  onUltimateGuitarLink={setUltimateGuitarLink}
                  onTiktokShortUrl={setTiktokShortUrl}
                />
              </FormSection>

              <FormSection
                numeral="IV · CONTENT"
                title="Lyrics & notes"
                count={2}
                populated={[lyrics, notes].filter(Boolean).length}
              >
                <div style={{ marginBottom: 16 }}>
                  <SongFormEditorialFieldsLyrics
                    value={lyrics}
                    onChange={setLyrics}
                    error={state.errors?.lyrics_with_chords}
                  />
                </div>
                <SongFormEditorialFieldsNotes
                  notes={notes}
                  notesError={state.errors?.notes}
                  pending={pending}
                  songData={{
                    title,
                    author,
                    level,
                    key,
                    chords: chords.join(', '),
                    tempo,
                    capo_fret: capoFret,
                    strumming_pattern: strumming,
                  }}
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
                  onClick={() => {
                    if (isDraftRef.current) isDraftRef.current.value = 'true';
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid var(--rule)',
                    background: 'var(--card)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: pending ? 'wait' : 'pointer',
                    fontFamily: 'var(--sans)',
                  }}
                >
                  Save draft
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  onClick={() => {
                    if (isDraftRef.current) isDraftRef.current.value = 'false';
                  }}
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
                  {pending ? 'Saving…' : 'Create song'}
                </button>
              </div>
            </div>

            <div>
              <FormPreviewPanel>
                <SongFormEditorialPreview
                  title={title}
                  author={author}
                  level={level}
                  keyName={key}
                  capoFret={capoFret}
                  tempo={tempo}
                  chords={chords}
                  category={category}
                  coverImageUrl={coverImageUrl}
                  hasYoutube={Boolean(youtubeUrl)}
                  hasSpotify={Boolean(spotifyLinkUrl)}
                />
              </FormPreviewPanel>
              <SongFormEditorialCompletionTracker
                sections={[
                  { label: 'Essentials', populated: essentialsPopulated, total: 2 },
                  { label: 'Musical', populated: musicalPopulated, total: 4 },
                  { label: 'Resources', populated: resourcesPopulated, total: 4 },
                  {
                    label: 'Content',
                    populated: [lyrics, notes].filter(Boolean).length,
                    total: 2,
                  },
                ]}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
