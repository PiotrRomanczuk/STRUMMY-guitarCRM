'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { FormSection } from '@/components/_editorial/FormSection';
import { FormPreviewPanel } from '@/components/_editorial/FormPreviewPanel';
import { updateSongAction, type SongEditState } from '@/app/actions/song-edit';
import { SongFormEditorialPreview } from '../form/SongFormEditorial.Preview';
import { SongFormEditorialCompletionTracker } from '../form/SongFormEditorial.CompletionTracker';
import {
  SongFormEditorialFieldsChords,
  parseChordsString,
} from '../form/SongFormEditorial.Fields.Chords';
import { SongFormEditorialFieldsStrumming } from '../form/SongFormEditorial.Fields.Strumming';
import { SongFormEditorialCoverUpload } from '../form/SongFormEditorial.CoverUpload';
import { SongFormEditorialFieldsExternal } from '../form/SongFormEditorial.Fields.External';
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
  time_signature: number | null;
  release_year: number | null;
  chords: string | null;
  strumming_pattern: string | null;
  category: string | null;
  youtube_url: string | null;
  spotify_link_url: string | null;
  ultimate_guitar_link: string | null;
  tiktok_short_url: string | null;
  cover_image_url: string | null;
  lyrics_with_chords: string | null;
};

// eslint-disable-next-line max-lines-per-function -- single-page editorial form wiring 8 sub-sections
export const SongEditFormEditorial = ({ song }: { song: Song }) => {
  const [state, formAction, pending] = useActionState(updateSongAction, INITIAL);
  const [title, setTitle] = useState(song.title ?? '');
  const [author, setAuthor] = useState(song.author ?? '');
  const [level, setLevel] = useState(song.level ?? 'beginner');
  const [key, setKey] = useState(song.key ?? 'C');
  const [capoFret, setCapoFret] = useState(song.capo_fret);
  const [tempo, setTempo] = useState(song.tempo);
  const [timeSignature, setTimeSignature] = useState(song.time_signature);
  const [releaseYear, setReleaseYear] = useState(song.release_year);
  const [chords, setChords] = useState(parseChordsString(song.chords ?? ''));
  const [strumming, setStrumming] = useState(song.strumming_pattern ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(song.cover_image_url);
  const [category, setCategory] = useState(song.category ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(song.youtube_url ?? '');
  const [spotifyLinkUrl, setSpotifyLinkUrl] = useState(song.spotify_link_url ?? '');
  const [ultimateGuitarLink, setUltimateGuitarLink] = useState(song.ultimate_guitar_link ?? '');
  const [tiktokShortUrl, setTiktokShortUrl] = useState(song.tiktok_short_url ?? '');

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
          The full picture — performance details, resources, and sections &amp; lyrics.
        </p>

        <form action={formAction}>
          <input type="hidden" name="id" value={song.id} />
          <input type="hidden" name="chords" value={chords.join(', ')} />
          <input type="hidden" name="strumming_pattern" value={strumming} />
          <input type="hidden" name="cover_image_url" value={coverImageUrl ?? ''} />
          <div className="ed-grid-form">
            <div>
              <FormSection
                numeral="I · ESSENTIALS"
                title="The basics"
                count={2}
                populated={essentialsPopulated}
              >
                <SongEditFormEditorialFieldsIdentity
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
                  <SongFormEditorialCoverUpload
                    value={coverImageUrl}
                    onChange={setCoverImageUrl}
                    songId={song.id}
                  />
                </div>
              </FormSection>

              <FormSection
                numeral="II · MUSICAL"
                title="Performance details"
                count={4}
                populated={musicalPopulated}
              >
                <SongEditFormEditorialFieldsDetails
                  level={level}
                  keyName={key}
                  capoFret={capoFret}
                  tempo={tempo}
                  timeSignature={timeSignature}
                  releaseYear={releaseYear}
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
                numeral="IV · LYRICS"
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
                  coverImageUrl={song.cover_image_url}
                  hasYoutube={Boolean(youtubeUrl)}
                  hasSpotify={Boolean(spotifyLinkUrl)}
                />
              </FormPreviewPanel>
              <SongFormEditorialCompletionTracker
                sections={[
                  { label: 'Essentials', populated: essentialsPopulated, total: 2 },
                  { label: 'Musical', populated: musicalPopulated, total: 4 },
                  { label: 'Resources', populated: resourcesPopulated, total: 4 },
                  { label: 'Lyrics', populated: song.lyrics_with_chords ? 1 : 0, total: 1 },
                ]}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
