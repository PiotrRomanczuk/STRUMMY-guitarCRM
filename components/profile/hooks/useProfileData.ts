'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProfileEditSchema, type ProfileEdit } from '@/schemas/ProfileSchema';
import { queryClient } from '@/lib/query-client';
import { ZodError } from 'zod';

function parseZodErrors(err: unknown): Record<string, string> {
  if (err instanceof ZodError) {
    return err.issues.reduce(
      (acc: Record<string, string>, e) => {
        const field = e.path[0]?.toString() || 'unknown';
        acc[field] = e.message;
        return acc;
      },
      {} as Record<string, string>
    );
  }
  return {};
}

async function loadProfileFromDb(userId: string): Promise<ProfileEdit> {
  const supabase = createClient();
  const { data, error } = await supabase.from('profiles').select('id, email, full_name, first_name, last_name').eq('id', userId).single();

  // If no profile exists yet, return empty form
  if (error && error.code === 'PGRST116') {
    return { firstname: '', lastname: '', username: '', bio: '' };
  }

  if (error) throw error;

  // Use first_name/last_name columns directly, fallback to full_name split
  const firstname = data.first_name || (data.full_name ? data.full_name.split(' ')[0] : '') || '';
  const lastname = data.last_name || (data.full_name ? data.full_name.split(' ').slice(1).join(' ') : '') || '';

  return {
    firstname,
    lastname,
    username: '',
    bio: '',
  };
}

async function saveProfileToDb(userId: string, profileData: ProfileEdit) {
  const validatedData = ProfileEditSchema.parse(profileData);

  const supabase = createClient();
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  // Write first_name/last_name directly — trigger syncs full_name
  if (existingProfile) {
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: validatedData.firstname,
        last_name: validatedData.lastname,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      first_name: validatedData.firstname,
      last_name: validatedData.lastname,
    });
    if (error) throw error;
  }
}

export function useProfileData(user: { id: string } | null) {
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProfileEdit>({
    firstname: '',
    lastname: '',
    username: '',
    bio: '',
  });

  // Fetch profile data and populate form
  const { isLoading, error: fetchError } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const data = await loadProfileFromDb(user.id);
      setFormData(data);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Mutation for saving profile
  const {
    mutate: saveProfile,
    isPending: saving,
    error: saveError,
  } = useMutation({
    mutationFn: (data: ProfileEdit) => (user ? saveProfileToDb(user.id, data) : Promise.reject()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setSuccess(true);
      setValidationErrors({});
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      if (err instanceof ZodError) {
        setValidationErrors(parseZodErrors(err));
      }
    },
  });

  const handleFormDataChange = (data: ProfileEdit) => {
    setFormData(data);
    // Clear validation errors for changed fields
    const changedFields = Object.keys(data).filter(
      (key) => data[key as keyof ProfileEdit] !== formData[key as keyof ProfileEdit]
    );
    if (changedFields.length > 0) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        changedFields.forEach((field) => delete next[field]);
        return next;
      });
    }
  };

  const handleBlur = (field: string) => {
    // Validate single field on blur
    try {
      const fieldSchema = ProfileEditSchema.shape[field as keyof typeof ProfileEditSchema.shape];
      if (fieldSchema) {
        fieldSchema.parse(formData[field as keyof ProfileEdit]);
        // Clear error if validation passes
        if (validationErrors[field]) {
          setValidationErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      }
    } catch (err) {
      const fieldErrors = parseZodErrors(err);
      if (fieldErrors[field]) {
        setValidationErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate before submitting
    try {
      ProfileEditSchema.parse(formData);
      setValidationErrors({});
      saveProfile(formData);
    } catch (err) {
      const fieldErrors = parseZodErrors(err);
      setValidationErrors(fieldErrors);
    }
  };

  const error = fetchError || saveError;

  return {
    user,
    loading: isLoading,
    saving,
    error,
    success,
    formData,
    validationErrors,
    setFormData: handleFormDataChange,
    handleBlur,
    handleSubmit,
  };
}
