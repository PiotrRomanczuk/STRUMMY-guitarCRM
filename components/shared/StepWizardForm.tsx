'use client';

import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WizardStep {
  label: string;
  content: ReactNode;
  requiredFields?: string[];
}

interface StepWizardFormProps {
  steps: WizardStep[];
  formData: Record<string, unknown>;
  errors: Record<string, string | undefined>;
  submitLabel?: string;
  submitDisabled?: boolean;
  className?: string;
  onStepChange?: (step: number) => void;
}

function ProgressBar({
  currentStep,
  totalSteps,
  stepLabel,
}: {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-2.5 h-2.5 rounded-full transition-colors',
              i < currentStep ? 'bg-primary' : 'border-2 border-muted'
            )}
          />
        ))}
      </div>
      <div className="flex flex-col items-center">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </p>
        {stepLabel && (
          <p className="text-base font-semibold text-foreground mt-1">
            {stepLabel}
          </p>
        )}
      </div>
    </div>
  );
}

export default function StepWizardForm({
  steps,
  formData,
  errors,
  submitLabel = 'Save',
  submitDisabled = false,
  className,
  onStepChange,
}: StepWizardFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = steps.length;

  const canAdvance = () => {
    const required = steps[currentStep]?.requiredFields ?? [];
    return required.every((field) => {
      const value = formData[field];
      const hasError = errors[field];
      const isFilled = value !== '' && value !== null && value !== undefined;
      if (Array.isArray(value)) return value.length > 0 && !hasError;
      return isFilled && !hasError;
    });
  };

  const goTo = (step: number) => {
    setCurrentStep(step);
    onStepChange?.(step);
  };

  const handleNext = () => {
    if (!canAdvance()) {
      toast.error('Please fill all required fields before continuing');
      return;
    }
    goTo(Math.min(currentStep + 1, totalSteps - 1));
  };

  const handlePrevious = () => {
    goTo(Math.max(currentStep - 1, 0));
  };

  return (
    <div className={cn('space-y-6', className)}>
      <ProgressBar
        currentStep={currentStep + 1}
        totalSteps={totalSteps}
        stepLabel={steps[currentStep]?.label}
      />

      <div className="min-h-[400px]">
        {steps[currentStep]?.content}
      </div>

      <div className="flex gap-3 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-xl pb-safe z-20">
        {currentStep > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            className="flex-1"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        )}

        {currentStep < totalSteps - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="flex-1"
            disabled={!canAdvance()}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            className="flex-1 bg-[image:var(--gradient-gold)] text-primary-foreground font-semibold shadow-lg hover:opacity-90"
            disabled={submitDisabled}
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
