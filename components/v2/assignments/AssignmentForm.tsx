'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentMutations } from '@/components/assignments/hooks/useAssignmentMutations';
import { StepWizardForm } from '@/components/v2/primitives/StepWizardForm';
import { toast } from 'sonner';
import { StepStudent, StepContent, StepSchedule } from './AssignmentForm.Steps';
import { SongPicker } from './AssignmentForm.SongPicker';

interface AssignmentFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: string;
    student_id: string;
    song_id: string | null;
  };
  students: Array<{ id: string; full_name: string | null; email: string }>;
  teacherId: string;
}

export function AssignmentForm({
  mode,
  initialData,
  students,
  teacherId: _teacherId,
}: AssignmentFormProps) {
  const router = useRouter();
  const { createAssignment, updateAssignment, isLoading } = useAssignmentMutations();

  const [formData, setFormData] = useState({
    studentId: initialData?.student_id ?? '',
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    dueDate: initialData?.due_date ? initialData.due_date.slice(0, 10) : '',
    songId: initialData?.song_id ?? '',
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        student_id: formData.studentId,
        song_id: formData.songId || null,
      };
      if (mode === 'edit' && initialData) {
        await updateAssignment(initialData.id, payload);
        toast.success('Assignment updated');
      } else {
        await createAssignment(payload);
        toast.success('Assignment created');
      }
      router.push('/dashboard/assignments');
      router.refresh();
    } catch {
      toast.error('Failed to save assignment');
    }
  };

  const steps = [
    {
      label: 'Student',
      requiredFields: ['studentId'],
      content: (
        <StepStudent
          students={students}
          selectedId={formData.studentId}
          onSelect={(id) => update('studentId', id)}
        />
      ),
    },
    {
      label: 'Content',
      requiredFields: ['title'],
      content: (
        <StepContent
          title={formData.title}
          description={formData.description}
          onTitleChange={(v) => update('title', v)}
          onDescriptionChange={(v) => update('description', v)}
        />
      ),
    },
    {
      label: 'Song',
      content: (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Link a Song</h2>
          <p className="text-sm text-muted-foreground">
            Optionally link a song from the repertoire to this assignment.
          </p>
          <SongPicker value={formData.songId} onChange={(v) => update('songId', v)} />
        </div>
      ),
    },
    {
      label: 'Schedule',
      content: (
        <StepSchedule
          dueDate={formData.dueDate}
          onDueDateChange={(v) => update('dueDate', v)}
        />
      ),
    },
  ];

  return (
    <div className="px-4 pb-safe">
      <form onSubmit={handleSubmit}>
        <StepWizardForm
          steps={steps}
          formData={formData as unknown as Record<string, unknown>}
          errors={{}}
          submitLabel={mode === 'edit' ? 'Update' : 'Create'}
          submitDisabled={isLoading}
        />
      </form>
    </div>
  );
}

export default AssignmentForm;
