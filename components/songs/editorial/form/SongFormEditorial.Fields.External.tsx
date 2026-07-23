'use client';

import { Field } from './Field';

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

const COMMON_CATEGORIES = [
  'Rock',
  'Pop',
  'Folk',
  'Blues',
  'Metal',
  'Jazz',
  'Country',
  'Classical',
  'Singer-Songwriter',
];

type Props = {
  category: string;
  youtubeUrl: string;
  spotifyLinkUrl: string;
  ultimateGuitarLink: string;
  tiktokShortUrl: string;
  onCategory: (v: string) => void;
  onYoutubeUrl: (v: string) => void;
  onSpotifyLinkUrl: (v: string) => void;
  onUltimateGuitarLink: (v: string) => void;
  onTiktokShortUrl: (v: string) => void;
};

/** Category + external reference links (all optional). */
export const SongFormEditorialFieldsExternal = ({
  category,
  youtubeUrl,
  spotifyLinkUrl,
  ultimateGuitarLink,
  tiktokShortUrl,
  onCategory,
  onYoutubeUrl,
  onSpotifyLinkUrl,
  onUltimateGuitarLink,
  onTiktokShortUrl,
}: Props) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <datalist id="song-category-suggestions">
      {COMMON_CATEGORIES.map((c) => (
        <option key={c} value={c} />
      ))}
    </datalist>
    <Field label="Category" optional>
      <input
        name="category"
        list="song-category-suggestions"
        value={category}
        placeholder="e.g. Rock"
        style={inputStyle}
        onChange={(e) => onCategory(e.target.value)}
      />
    </Field>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Field label="YouTube URL" optional>
        <input
          name="youtube_url"
          type="url"
          value={youtubeUrl}
          placeholder="youtube.com/watch?v=…"
          style={inputStyle}
          onChange={(e) => onYoutubeUrl(e.target.value)}
        />
      </Field>
      <Field label="Spotify link" optional>
        <input
          name="spotify_link_url"
          type="url"
          value={spotifyLinkUrl}
          placeholder="open.spotify.com/track/…"
          style={inputStyle}
          onChange={(e) => onSpotifyLinkUrl(e.target.value)}
        />
      </Field>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Field label="Ultimate Guitar" optional>
        <input
          name="ultimate_guitar_link"
          type="url"
          value={ultimateGuitarLink}
          placeholder="tabs.ultimate-guitar.com/…"
          style={inputStyle}
          onChange={(e) => onUltimateGuitarLink(e.target.value)}
        />
      </Field>
      <Field label="TikTok short" optional>
        <input
          name="tiktok_short_url"
          type="url"
          value={tiktokShortUrl}
          placeholder="tiktok.com/…"
          style={inputStyle}
          onChange={(e) => onTiktokShortUrl(e.target.value)}
        />
      </Field>
    </div>
  </div>
);
