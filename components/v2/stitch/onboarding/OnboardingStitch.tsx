'use client';

import { useCallback, useState, useTransition } from 'react';
import { Menu, ArrowRight, Info, User } from 'lucide-react';
import { completeOnboarding } from '@/app/actions/onboarding';
import { OnboardingSchema } from '@/schemas/OnboardingSchema';
import type { OnboardingData } from '@/types/onboarding';
import { StitchButton } from '@/components/v2/stitch';
import { RoleCard } from './OnboardingStitch.RoleCard';
import { SkillCard } from './OnboardingStitch.SkillCard';
import { GoalChip } from './OnboardingStitch.GoalChip';
import { CurriculumCard } from './OnboardingStitch.CurriculumCard';

const GOALS = ['Learn Songs', 'Music Theory', 'Performance', 'Songwriting', 'Technique'] as const;
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

interface OnboardingStitchProps {
  firstName?: string;
}

export function OnboardingStitch({ firstName }: OnboardingStitchProps) {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [skillLevel, setSkillLevel] = useState<OnboardingData['skillLevel'] | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const toggleGoal = useCallback((goal: string) => {
    setGoals((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));
  }, []);

  const handleSubmit = useCallback(() => {
    setError('');
    const parsed = OnboardingSchema.safeParse({
      role,
      skillLevel,
      goals,
      learningStyle: [],
      instrumentPreference: [],
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setError(firstIssue?.message ?? 'Please fill in all required fields');
      return;
    }

    startTransition(async () => {
      const result = await completeOnboarding(parsed.data as OnboardingData);
      if (result?.error) setError(result.error);
    });
  }, [role, skillLevel, goals]);

  const isFormValid = skillLevel !== null && goals.length > 0;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-[family-name:var(--font-manrope)]">
      {/* Header bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl shadow-sm shadow-stone-200/50 dark:shadow-stone-900/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Menu className="h-5 w-5 text-stone-500" />
          <span className="font-bold text-stone-900 dark:text-stone-100">Strummy</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
          <User className="h-4 w-4 text-stone-500" />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 space-y-8 pb-24">
        {/* Welcome heading */}
        <section>
          <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 font-[family-name:var(--font-plus-jakarta)]">
            Welcome to the workshop{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2">
            Let&apos;s tune your experience to hit the right notes.
          </p>
        </section>

        {/* Your Role */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 font-[family-name:var(--font-plus-jakarta)]">
            Your Role
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard role="student" isSelected={role === 'student'} onSelect={setRole} />
            <RoleCard role="teacher" isSelected={role === 'teacher'} onSelect={setRole} />
          </div>
        </section>

        {/* Skill Level */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 font-[family-name:var(--font-plus-jakarta)]">
            Skill Level
          </h2>
          <div className="space-y-3">
            {SKILL_LEVELS.map((level) => (
              <SkillCard
                key={level}
                level={level}
                isSelected={skillLevel === level}
                onSelect={setSkillLevel}
              />
            ))}
          </div>
        </section>

        {/* Your Goals */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 font-[family-name:var(--font-plus-jakarta)]">
            Your Goals
          </h2>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((goal) => (
              <GoalChip
                key={goal}
                label={goal}
                isSelected={goals.includes(goal)}
                onToggle={toggleGoal}
              />
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-stone-400">
            <Info className="h-3.5 w-3.5" />
            Pick at least one goal
          </p>
        </section>

        {/* Curriculum card */}
        <CurriculumCard />

        {/* Error */}
        {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

        {/* Submit */}
        <StitchButton
          onClick={handleSubmit}
          loading={isPending}
          disabled={!isFormValid}
          icon={<ArrowRight className="h-4 w-4" />}
          className="w-full"
        >
          Complete Setup
        </StitchButton>
      </main>
    </div>
  );
}
