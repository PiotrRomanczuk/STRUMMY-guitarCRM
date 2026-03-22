'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { StepWizardForm } from '@/components/v2/primitives';
import { FormFieldText, FormFieldSelect } from '@/components/shared/FormField';
import SpotifySearch from '@/components/songs/form/SpotifySearch';
import CategoryCombobox from '@/components/songs/form/CategoryCombobox';
import { MUSIC_KEY_OPTIONS, LEVEL_OPTIONS } from '@/components/songs/form/options';
import { useSongMutation } from '@/components/songs/form/useSongMutation';
import {
  createFormData,
  clearFieldError,
  type SongFormData,
} from '@/components/songs/form/helpers';
import type { Song } from '@/schemas/SongSchema';
import type { SpotifyTrack } from '@/types/spotify';

interface SongFormV2Props {
  /** Edit mode: pass existing song; Create mode: omit */
  song?: Song | null;
  mode: 'create' | 'edit';
}

export function SongFormV2({ song, mode }: SongFormV2Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<SongFormData>(() =>
    mode === 'create' ? createFormData(null) : createFormData(song)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { isSubmitting, saveSong } = useSongMutation({
    mode,
    songId: song?.id,
    onSuccess: () => {
      toast.success(mode === 'create' ? 'Song created!' : 'Song updated!');
      router.push('/dashboard/songs');
    },
  });

  const handleChange = useCallback(
    (field: keyof SongFormData, value: SongFormData[keyof SongFormData]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => clearFieldError(prev, field));
    },
    []
  );

  const handleBlur = useCallback((_field: string) => {
    // Validate on blur handled by StepWizardForm required fields
  }, []);

  const handleSpotifySelect = useCallback((track: SpotifyTrack) => {
    setFormData((prev) => ({
      ...prev,
      title: track.name || prev.title,
      author: track.artist || prev.author,
      spotify_link_url: track.url || `https://open.spotify.com/track/${track.id}`,
      cover_image_url: track.image || prev.cover_image_url,
      release_year: track.release_date
        ? parseInt(track.release_date.slice(0, 4))
        : prev.release_year,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    await saveSong(formData);
  };

  const steps = buildSteps(formData, errors, handleChange, handleBlur, handleSpotifySelect);

  return (
    <MobilePageShell
      title={mode === 'create' ? 'New Song' : 'Edit Song'}
      subtitle={mode === 'edit' ? formData.title || 'Untitled' : undefined}
    >
      <form onSubmit={handleSubmit}>
        <StepWizardForm
          steps={steps}
          formData={formData as unknown as Record<string, unknown>}
          errors={errors}
          submitLabel={isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Song' : 'Save Changes'}
        />
      </form>
    </MobilePageShell>
  );
}

function buildSteps(
  formData: SongFormData,
  errors: Record<string, string>,
  onChange: (field: keyof SongFormData, value: SongFormData[keyof SongFormData]) => void,
  onBlur: (field: string) => void,
  onSpotifySelect: (track: SpotifyTrack) => void
) {
  return [
    {
      label: 'Basic Information',
      requiredFields: ['title', 'author', 'level', 'key'],
      content: (
        <div className="space-y-5">
          <SpotifySearch onSelect={onSpotifySelect} />
          <FormFieldText
            label="Song Title" id="title" value={formData.title} error={errors.title}
            onChange={(v) => onChange('title', v)} onBlur={() => onBlur('title')} required
          />
          <FormFieldText
            label="Artist" id="author" value={formData.author} error={errors.author}
            onChange={(v) => onChange('author', v)} onBlur={() => onBlur('author')} required
          />
          <FormFieldSelect
            label="Difficulty Level" id="level" value={formData.level} error={errors.level}
            onChange={(v) => onChange('level', v)} onBlur={() => onBlur('level')}
            options={LEVEL_OPTIONS} required
          />
          <FormFieldSelect
            label="Musical Key" id="key" value={formData.key} error={errors.key}
            onChange={(v) => onChange('key', v)} onBlur={() => onBlur('key')}
            options={MUSIC_KEY_OPTIONS} required
          />
          <CategoryCombobox
            value={formData.category} error={errors.category}
            onChange={(v) => onChange('category', v)} onBlur={() => onBlur('category')}
          />
        </div>
      ),
    },
    {
      label: 'Resources & Media',
      content: (
        <div className="space-y-5">
          <FormFieldText
            label="YouTube URL" id="youtube_url" type="url"
            value={formData.youtube_url} error={errors.youtube_url}
            onChange={(v) => onChange('youtube_url', v)} onBlur={() => onBlur('youtube_url')}
            placeholder="https://youtube.com/watch?v=..."
          />
          <FormFieldText
            label="Spotify Link" id="spotify_link_url" type="url"
            value={formData.spotify_link_url} error={errors.spotify_link_url}
            onChange={(v) => onChange('spotify_link_url', v)} onBlur={() => onBlur('spotify_link_url')}
            placeholder="https://open.spotify.com/track/..."
          />
          <FormFieldText
            label="Ultimate Guitar Link" id="ultimate_guitar_link" type="url"
            value={formData.ultimate_guitar_link} error={errors.ultimate_guitar_link}
            onChange={(v) => onChange('ultimate_guitar_link', v)} onBlur={() => onBlur('ultimate_guitar_link')}
          />
          <FormFieldText
            label="TikTok Short URL" id="tiktok_short_url" type="url"
            value={formData.tiktok_short_url} error={errors.tiktok_short_url}
            onChange={(v) => onChange('tiktok_short_url', v)} onBlur={() => onBlur('tiktok_short_url')}
            placeholder="https://www.tiktok.com/@user/video/..."
          />
        </div>
      ),
    },
    {
      label: 'Musical Details',
      content: (
        <div className="space-y-5">
          <FormFieldText
            label="Capo Fret" id="capo_fret" type="number"
            value={formData.capo_fret?.toString() || ''} error={errors.capo_fret}
            onChange={(v) => onChange('capo_fret', v ? parseInt(v) : null)}
            onBlur={() => onBlur('capo_fret')} placeholder="0"
          />
          <FormFieldText
            label="Tempo (BPM)" id="tempo" type="number"
            value={formData.tempo?.toString() || ''} error={errors.tempo}
            onChange={(v) => onChange('tempo', v ? parseInt(v) : null)}
            onBlur={() => onBlur('tempo')} placeholder="120"
          />
          <FormFieldText
            label="Strumming Pattern" id="strumming_pattern"
            value={formData.strumming_pattern} error={errors.strumming_pattern}
            onChange={(v) => onChange('strumming_pattern', v)}
            onBlur={() => onBlur('strumming_pattern')} placeholder="D DU UDU"
          />
          <FormFieldText
            label="Chords" id="chords"
            value={formData.chords} error={errors.chords}
            onChange={(v) => onChange('chords', v)}
            onBlur={() => onBlur('chords')} placeholder="Em7 G D C"
          />
        </div>
      ),
    },
  ];
}
