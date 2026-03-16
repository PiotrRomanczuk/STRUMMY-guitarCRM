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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-colors',
              i < currentStep ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
          {stepLabel && (
            <span className="font-medium text-foreground ml-1">
              — {stepLabel}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.round((currentStep / totalSteps) * 100)}%
        </p>
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

      <div className="flex gap-3 pt-4 border-t border-border sticky bottom-0 bg-background pb-safe">
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
          <Button type="submit" className="flex-1" disabled={submitDisabled}>
            {submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
