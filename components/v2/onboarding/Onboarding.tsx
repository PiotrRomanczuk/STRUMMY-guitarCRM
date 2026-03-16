'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '@/lib/animations/variants';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { completeOnboarding } from '@/app/actions/onboarding';
import { OnboardingSchema } from '@/schemas/OnboardingSchema';
import type { OnboardingData } from '@/types/onboarding';
import { StepRole } from './StepRole';
import { StepSkillLevel } from './StepSkillLevel';
import { StepGoals } from './StepGoals';
import { StepWelcome } from './StepWelcome';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface OnboardingV2Props { firstName?: string }

export function OnboardingV2({ firstName }: OnboardingV2Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    role: undefined, goals: [], skillLevel: 'beginner',
    learningStyle: [], instrumentPreference: [],
  });

  const canAdvance = (): boolean => {
    if (step === 1) return formData.role != null;
    if (step === 2) return formData.skillLevel != null;
    if (step === 3) return formData.goals.length > 0;
    return true;
  };

  const getStepError = (currentStep: number): string => {
    if (currentStep === 1) return 'Please select a role';
    if (currentStep === 2) return 'Please select your skill level';
    if (currentStep === 3) return 'Please select at least one goal';
    return 'Please complete all required fields';
  };

  const handleSubmit = async () => {
    const result = OnboardingSchema.safeParse(formData);
    if (!result.success) { toast.error(getStepError(step)); return; }
    setLoading(true);
    try {
      const res = await completeOnboarding(formData);
      if (res?.error) { toast.error(res.error); setLoading(false); return; }
      setStep(4);
      toast.success('Profile set up successfully!');
    } catch (err) {
      logger.error('Onboarding error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const handleNext = async () => {
    if (!canAdvance()) {
      toast.error(getStepError(step));
      return;
    }
    if (step === 3) { await handleSubmit(); return; }
    setStep((s) => Math.min(s + 1, 4));
  };

  const toggleGoal = (goalId: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter((g) => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" aria-hidden="true" />
      <div className="relative flex-1 flex flex-col w-full max-w-md mx-auto px-4 py-6">
        {step < 4 && (
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={cn('h-1.5 rounded-full flex-1 transition-colors duration-300', s <= step ? 'bg-primary' : 'bg-muted')} />
            ))}
            <span className="text-xs text-muted-foreground ml-2 shrink-0">{step}/3</span>
          </div>
        )}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={step} variants={fadeIn} initial="hidden" animate="visible" exit="hidden">
              {step === 1 && (
                <StepRole selectedRole={formData.role ?? null} onSelect={(role) => setFormData((p) => ({ ...p, role }))} />
              )}
              {step === 2 && (
                <StepSkillLevel selectedLevel={formData.skillLevel} onSelect={(level) => setFormData((p) => ({ ...p, skillLevel: level }))} />
              )}
              {step === 3 && <StepGoals selectedGoals={formData.goals} onToggle={toggleGoal} />}
              {step === 4 && <StepWelcome firstName={firstName} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="sticky bottom-0 pb-[env(safe-area-inset-bottom)] pt-4 bg-background">
          {step < 4 ? (
            <div className="flex gap-3">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(s - 1, 1))} disabled={loading} className="min-h-[44px] px-5">
                  <ArrowLeft className="h-4 w-4 mr-1" />Back
                </Button>
              )}
              <Button type="button" onClick={handleNext} disabled={loading || !canAdvance()} className="flex-1 min-h-[44px] font-semibold">
                {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Setting up...</>) : step === 3 ? 'Complete Setup' : (<>Next<ArrowRight className="h-4 w-4 ml-1" /></>)}
              </Button>
            </div>
          ) : (
            <Button type="button" onClick={() => window.location.assign('/dashboard')} className="w-full min-h-[44px] font-semibold">
              Go to Dashboard<ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
