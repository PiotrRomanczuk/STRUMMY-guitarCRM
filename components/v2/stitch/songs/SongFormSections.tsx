'use client';

import { Link, Music } from 'lucide-react';
import {
  StitchSection,
  StitchFieldLabel,
  StitchInput,
  StitchTextarea,
  StitchSelect,
} from '@/components/v2/stitch';
import { MUSIC_KEY_OPTIONS, LEVEL_OPTIONS } from '@/components/songs/form/options';
import CategoryCombobox from '@/components/songs/form/CategoryCombobox';
import type { SongFormData } from '@/components/songs/form/helpers';

interface SectionProps {
  formData: SongFormData;
  errors: Record<string, string>;
  onFieldChange: (field: keyof SongFormData, value: string) => void;
  onFieldBlur: (field: string) => void;
}

export function EssentialInfoSection({
  formData,
  errors,
  onFieldChange,
  onFieldBlur,
}: SectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <StitchFieldLabel label="Song Title" required />
        <StitchInput
          id="title"
          value={formData.title}
          placeholder="Enter song title"
          onChange={(v) => onFieldChange('title', v)}
          onBlur={() => onFieldBlur('title')}
          error={errors.title}
        />
      </div>

      <div>
        <StitchFieldLabel label="Artist" required />
        <StitchInput
          id="author"
          value={formData.author}
          placeholder="Enter artist name"
          onChange={(v) => onFieldChange('author', v)}
          onBlur={() => onFieldBlur('author')}
          error={errors.author}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <StitchFieldLabel label="Difficulty Level" required />
          <StitchSelect
            id="level"
            value={formData.level}
            options={LEVEL_OPTIONS}
            onChange={(v) => onFieldChange('level', v)}
            error={errors.level}
          />
        </div>
        <div>
          <StitchFieldLabel label="Musical Key" required />
          <StitchSelect
            id="key"
            value={formData.key}
            options={MUSIC_KEY_OPTIONS}
            onChange={(v) => onFieldChange('key', v)}
            error={errors.key}
          />
        </div>
      </div>

      <div>
        <CategoryCombobox
          value={formData.category}
          onChange={(v) => onFieldChange('category', v)}
          onBlur={() => onFieldBlur('category')}
          error={errors.category}
        />
      </div>
    </div>
  );
}

export function ResourcesSection({
  formData,
  errors,
  onFieldChange,
  onFieldBlur,
}: SectionProps) {
  return (
    <StitchSection
      icon={<Link className="h-5 w-5" />}
      title="Resources & Media"
      fieldCount={4}
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div>
          <StitchFieldLabel label="YouTube" dotColor="bg-red-500" />
          <StitchInput
            id="youtube_url"
            value={formData.youtube_url}
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            onChange={(v) => onFieldChange('youtube_url', v)}
            onBlur={() => onFieldBlur('youtube_url')}
            error={errors.youtube_url}
          />
        </div>
        <div>
          <StitchFieldLabel label="Spotify" dotColor="bg-green-500" />
          <StitchInput
            id="spotify_link_url"
            value={formData.spotify_link_url}
            type="url"
            placeholder="https://open.spotify.com/track/..."
            onChange={(v) => onFieldChange('spotify_link_url', v)}
            onBlur={() => onFieldBlur('spotify_link_url')}
            error={errors.spotify_link_url}
          />
        </div>
        <div>
          <StitchFieldLabel label="Ultimate Guitar" dotColor="bg-orange-500" />
          <StitchInput
            id="ultimate_guitar_link"
            value={formData.ultimate_guitar_link}
            type="url"
            placeholder="https://tabs.ultimate-guitar.com/..."
            onChange={(v) => onFieldChange('ultimate_guitar_link', v)}
            onBlur={() => onFieldBlur('ultimate_guitar_link')}
            error={errors.ultimate_guitar_link}
          />
        </div>
        <div>
          <StitchFieldLabel
            label="TikTok"
            dotColor="bg-stone-900 dark:bg-stone-100"
          />
          <StitchInput
            id="tiktok_short_url"
            value={formData.tiktok_short_url}
            type="url"
            placeholder="https://tiktok.com/..."
            onChange={(v) => onFieldChange('tiktok_short_url', v)}
            onBlur={() => onFieldBlur('tiktok_short_url')}
            error={errors.tiktok_short_url}
          />
        </div>
      </div>
    </StitchSection>
  );
}

export function MusicalDetailsSection({
  formData,
  errors,
  onFieldChange,
  onFieldBlur,
}: SectionProps) {
  return (
    <StitchSection
      icon={<Music className="h-5 w-5" />}
      title="Musical Details"
      fieldCount={4}
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <StitchFieldLabel label="Capo Fret" />
            <StitchInput
              id="capo_fret"
              value={formData.capo_fret?.toString() ?? ''}
              type="number"
              placeholder="0"
              onChange={(v) => onFieldChange('capo_fret', v)}
              error={errors.capo_fret}
            />
          </div>
          <div>
            <StitchFieldLabel label="Tempo BPM" />
            <StitchInput
              id="tempo"
              value={formData.tempo?.toString() ?? ''}
              type="number"
              placeholder="120"
              onChange={(v) => onFieldChange('tempo', v)}
              error={errors.tempo}
            />
          </div>
        </div>

        <div>
          <StitchFieldLabel label="Strumming Pattern" />
          <StitchInput
            id="strumming_pattern"
            value={formData.strumming_pattern}
            placeholder="D D U U D U"
            onChange={(v) => onFieldChange('strumming_pattern', v)}
            onBlur={() => onFieldBlur('strumming_pattern')}
            error={errors.strumming_pattern}
          />
        </div>

        <div>
          <StitchFieldLabel label="Chords" />
          <StitchTextarea
            id="chords"
            value={formData.chords}
            placeholder="G, C, Em, D..."
            rows={2}
            onChange={(v) => onFieldChange('chords', v)}
            onBlur={() => onFieldBlur('chords')}
            error={errors.chords}
          />
        </div>
      </div>
    </StitchSection>
  );
}
