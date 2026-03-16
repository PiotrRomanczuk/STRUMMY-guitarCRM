'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { StepWizardForm } from '@/components/v2/primitives';
import { StepBasicInfo, StepDetails } from './CourseForm.Steps';
import {
  createTheoryCourse,
  updateTheoryCourse,
} from '@/app/dashboard/theory/actions';

interface CourseFormV2Props {
  mode: 'create' | 'edit';
  courseId?: string;
  defaultValues?: {
    title: string;
    description: string;
    cover_image_url: string;
    level: string;
    is_published: boolean;
  };
}

/**
 * v2 Theory Course Form using StepWizardForm primitive.
 * Step 1: Title and description.
 * Step 2: Level, cover image, publish toggle.
 *
 * Reuses existing `createTheoryCourse` and `updateTheoryCourse` server actions.
 */
export function CourseFormV2({ mode, courseId, defaultValues }: CourseFormV2Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: defaultValues?.title ?? '',
    description: defaultValues?.description ?? '',
    cover_image_url: defaultValues?.cover_image_url ?? '',
    level: defaultValues?.level ?? 'beginner',
    is_published: defaultValues?.is_published ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrors({ title: 'Title is required' });
      toast.error('Please fill in the course title');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const input = {
      title: formData.title,
      description: formData.description || undefined,
      cover_image_url: formData.cover_image_url || undefined,
      level: formData.level,
      is_published: formData.is_published,
    };

    const result =
      mode === 'create'
        ? await createTheoryCourse(input)
        : await updateTheoryCourse(courseId!, input);

    setIsSubmitting(false);

    if (!result.success) {
      const errorMsg = 'error' in result ? result.error : 'Something went wrong';
      toast.error(errorMsg ?? 'Something went wrong');
      return;
    }

    toast.success(mode === 'create' ? 'Course created!' : 'Course updated!');

    if (mode === 'create' && 'courseId' in result) {
      router.push(`/dashboard/theory/${result.courseId}`);
    } else {
      router.push(`/dashboard/theory/${courseId}`);
    }
  };

  const steps = [
    {
      label: 'Basic Info',
      content: (
        <StepBasicInfo formData={formData} onChange={setFormData} errors={errors} />
      ),
      requiredFields: ['title'],
    },
    {
      label: 'Details',
      content: (
        <StepDetails formData={formData} onChange={setFormData} errors={errors} />
      ),
    },
  ];

  const title = mode === 'create' ? 'New Course' : 'Edit Course';

  return (
    <MobilePageShell title={title} showBack>
      <form onSubmit={handleSubmit}>
        <StepWizardForm
          steps={steps}
          formData={formData as unknown as Record<string, unknown>}
          errors={errors}
          submitLabel={isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Course' : 'Save Changes'}
          submitDisabled={isSubmitting}
        />
      </form>
    </MobilePageShell>
  );
}
