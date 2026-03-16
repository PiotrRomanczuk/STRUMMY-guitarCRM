'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAssignmentMutations } from '@/components/assignments/hooks/useAssignmentMutations';
import { fadeIn } from '@/lib/animations/variants';
import { toast } from 'sonner';
import { StepStudent, StepContent, StepSchedule } from './AssignmentForm.Steps';

interface AssignmentFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: string;
    student_id: string;
  };
  students: Array<{ id: string; full_name: string | null; email: string }>;
  teacherId: string;
}

const STEPS = [
  { id: 'student', label: 'Student' },
  { id: 'content', label: 'Content' },
  { id: 'schedule', label: 'Schedule' },
] as const;

export function AssignmentForm({
  mode,
  initialData,
  students,
  teacherId: _teacherId,
}: AssignmentFormProps) {
  const router = useRouter();
  const { createAssignment, updateAssignment, isLoading } = useAssignmentMutations();
  const [step, setStep] = useState(0);

  const [studentId, setStudentId] = useState(initialData?.student_id ?? '');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [dueDate, setDueDate] = useState(
    initialData?.due_date ? initialData.due_date.slice(0, 10) : ''
  );

  const canAdvance = useCallback(() => {
    if (step === 0) return !!studentId;
    if (step === 1) return title.trim().length > 0;
    // Final step: validate all required fields from previous steps are present
    if (step === 2) return !!studentId && title.trim().length > 0;
    return true;
  }, [step, studentId, title]);

  const handleNext = () => {
    if (!canAdvance()) { toast.error('Please fill in required fields'); return; }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = async () => {
    if (!canAdvance()) { toast.error('Please fill in required fields'); return; }
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        student_id: studentId,
      };
      if (mode === 'edit' && initialData) {
        await updateAssignment(initialData.id, payload);
        toast.success('Assignment updated');
      } else {
        await createAssignment({ ...payload, student_id: studentId });
        toast.success('Assignment created');
      }
      router.push('/dashboard/assignments');
      router.refresh();
    } catch { toast.error('Failed to save assignment'); }
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="px-4 space-y-6 pb-safe">
      <ProgressIndicator step={step} onStepClick={(i) => i < step && setStep(i)} />

      <AnimatePresence mode="wait">
        <motion.div key={step} variants={fadeIn} initial="hidden" animate="visible" className="min-h-[300px] space-y-4">
          {step === 0 && <StepStudent students={students} selectedId={studentId} onSelect={setStudentId} />}
          {step === 1 && <StepContent title={title} description={description} onTitleChange={setTitle} onDescriptionChange={setDescription} />}
          {step === 2 && <StepSchedule dueDate={dueDate} onDueDateChange={setDueDate} />}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between gap-3 sticky bottom-0 bg-background py-4 pb-safe">
        <Button variant="outline" className="min-h-[44px]" onClick={step === 0 ? () => router.back() : () => setStep((s) => Math.max(s - 1, 0))}>
          <ArrowLeft className="h-4 w-4 mr-1" />{step === 0 ? 'Cancel' : 'Previous'}
        </Button>
        <Button className="min-h-[44px]" onClick={isLastStep ? handleSubmit : handleNext} disabled={!canAdvance() || isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : isLastStep ? <Check className="h-4 w-4 mr-1" /> : <ArrowRight className="h-4 w-4 mr-1" />}
          {isLastStep ? (mode === 'edit' ? 'Update' : 'Create') : 'Next'}
        </Button>
      </div>
    </div>
  );
}

function ProgressIndicator({ step, onStepClick }: { step: number; onStepClick: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <button
            onClick={() => onStepClick(i)}
            disabled={i > step}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
              'transition-colors min-h-[44px] min-w-[44px]',
              i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              i < step && 'cursor-pointer'
            )}
            aria-label={`Step ${i + 1}: ${s.label}`}
          >
            {i < step ? <Check className="h-4 w-4" /> : i + 1}
          </button>
          {i < STEPS.length - 1 && <div className={cn('h-0.5 w-8 rounded-full', i < step ? 'bg-primary' : 'bg-muted')} />}
        </div>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
    </div>
  );
}

export default AssignmentForm;
