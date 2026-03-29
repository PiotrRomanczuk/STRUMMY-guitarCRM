'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  StitchFormShell,
  StitchSection,
  StitchAlert,
  StitchFormActions,
} from '@/components/v2/stitch';
import SpotifySearch from '@/components/songs/form/SpotifySearch';
import { useSongMutation } from '@/components/songs/form/useSongMutation';
import { createFormData, clearFieldError } from '@/components/songs/form/helpers';
import type { SongFormData } from '@/components/songs/form/helpers';
import type { Song } from '@/schemas/SongSchema';
import type { SpotifyTrack } from '@/types/spotify';
import { EssentialInfoSection, ResourcesSection, MusicalDetailsSection } from './SongFormSections';

interface SongFormStitchProps {
  song?: Song | null;
  mode: 'create' | 'edit';
}

export function SongFormStitch({ song, mode }: SongFormStitchProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<SongFormData>(() => createFormData(song));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const { isSubmitting, saveSong } = useSongMutation({
    mode,
    songId: song?.id,
    onSuccess: () => {
      const label = mode === 'create' ? 'created' : 'updated';
      toast.success(`Song ${label} successfully`);
      router.push('/songs');
    },
  });

  const isEditMode = mode === 'edit';
  const title = isEditMode ? 'Edit Song' : 'New Song';
  const submitLabel = isEditMode ? 'SAVE CHANGES' : 'CREATE SONG';

  const handleFieldChange = useCallback((field: keyof SongFormData, value: string) => {
    setFormData((prev) => {
      if (field === 'capo_fret' || field === 'tempo') {
        const num = value === '' ? null : Number(value);
        return { ...prev, [field]: num };
      }
      return { ...prev, [field]: value };
    });
    setErrors((prev) => clearFieldError(prev, field));
  }, []);

  const handleFieldBlur = useCallback((_field: string) => {
    // Placeholder for field-level validation on blur
  }, []);

  const handleSpotifySelect = useCallback((track: SpotifyTrack) => {
    setFormData((prev) => ({
      ...prev,
      title: track.name,
      author: track.artist,
      spotify_link_url: track.url ?? '',
      cover_image_url: track.image ?? '',
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors: Record<string, string> = {};
      if (!formData.title.trim()) validationErrors.title = 'Title is required';
      if (!formData.author.trim()) validationErrors.author = 'Artist is required';

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      const { error } = await saveSong(formData);
      if (error) {
        toast.error(error.message);
      }
    },
    [formData, saveSong]
  );

  return (
    <StitchFormShell title={title} subtitle={isEditMode ? formData.title : undefined}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {duplicateWarning && (
          <StitchAlert
            message="A song with this title already exists"
            onDismiss={() => setDuplicateWarning(false)}
          />
        )}

        <StitchSection title="Essential Information" collapsible={false}>
          <div className="space-y-4">
            <SpotifySearch onSelect={handleSpotifySelect} />
            <EssentialInfoSection
              formData={formData}
              errors={errors}
              onFieldChange={handleFieldChange}
              onFieldBlur={handleFieldBlur}
            />
          </div>
        </StitchSection>

        <ResourcesSection
          formData={formData}
          errors={errors}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
        />

        <MusicalDetailsSection
          formData={formData}
          errors={errors}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
        />

        <StitchFormActions
          onCancel={() => router.back()}
          submitLabel={submitLabel}
          loading={isSubmitting}
        />
      </form>
    </StitchFormShell>
  );
}
