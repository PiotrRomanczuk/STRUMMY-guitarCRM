'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Dispatch, SetStateAction } from 'react';
import { AssignmentFormFields } from './AssignmentForm.Fields';
import { AssignmentFormActions } from './AssignmentForm.Actions';
import MobileAssignmentForm from './MobileAssignmentForm';
import { useAssignmentForm } from './useAssignmentForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useFormErrorFocus } from '@/hooks/use-form-error-focus';
import { useMediaQuery } from '@/hooks/use-media-query';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface AssignmentFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
    teacher_id: string;
    student_id: string;
  };
  mode: 'create' | 'edit';
  userId?: string;
  students?: Student[];
}

export default function AssignmentForm({
  initialData,
  mode,
  userId,
  students = [],
}: AssignmentFormProps) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    formData,
    fieldErrors,
    handleFieldChange,
    handleBlur,
    validate,
    setFieldErrors,
  } = useAssignmentForm({ initialData, mode, userId });

  const formRef = useRef<HTMLFormElement>(null);
  useFormErrorFocus(fieldErrors as Record<string, string | undefined>, formRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the validation errors');
      return;
    }

    await submitAssignment(formData, mode, initialData?.id, router, setLoading, setError);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/dashboard/assignments"
        className="text-primary hover:underline mb-6 inline-block"
      >
        &larr; Back to assignments
      </Link>

      <div className="bg-card rounded-lg shadow-md p-4 sm:p-6 lg:p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {mode === 'create' ? 'Create Assignment' : 'Edit Assignment'}
        </h1>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isMobile ? (
            <MobileAssignmentForm
              formData={formData}
              errors={fieldErrors as Record<string, string | undefined>}
              students={students}
              onChange={handleFieldChange}
              onBlur={handleBlur}
            />
          ) : (
            <>
              <AssignmentFormFields
                formData={formData}
                fieldErrors={fieldErrors}
                onChange={handleFieldChange}
                onBlur={handleBlur}
                students={students}
                selectedStudent={students.find((s) => s.id === formData.student_id)}
                recentSongs={['Wonderwall', 'Hotel California']}
                lessonTopic="Practice assignment"
              />
              <AssignmentFormActions mode={mode} loading={loading} />
            </>
          )}
        </form>
      </div>
    </div>
  );
}

async function submitAssignment(
  formData: {
    title: string;
    description: string;
    due_date: string;
    status: string;
    student_id: string;
  },
  mode: string,
  id: string | undefined,
  router: ReturnType<typeof useRouter>,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setError: Dispatch<SetStateAction<string | null>>
) {
  setLoading(true);
  setError(null);

  try {
    const url = mode === 'create' ? '/api/assignments' : `/api/assignments/${id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save assignment');
    }

    const data = await response.json();
    toast.success(mode === 'create' ? 'Assignment created successfully' : 'Assignment updated successfully');
    router.push(`/dashboard/assignments/${data.id}`);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  } finally {
    setLoading(false);
  }
}
