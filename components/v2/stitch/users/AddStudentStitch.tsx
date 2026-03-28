'use client';

import { useCallback, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { StitchFieldLabel, StitchInput, StitchButton } from '@/components/v2/stitch';

interface AddStudentStitchProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

type FormPhase = 'idle' | 'submitting' | 'success';

export function AddStudentStitch({ onClose, onSuccess }: AddStudentStitchProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<FormPhase>('idle');

  const firstLetter = name.trim().charAt(0).toUpperCase() || '?';
  const hasEmail = email.trim().length > 0;
  const isValid = name.trim().length > 0;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid) return;

      setPhase('submitting');
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: name.trim(),
            lastName: '',
            email: email.trim() || undefined,
            isAdmin: false,
            isTeacher: false,
            isStudent: true,
            isShadow: !hasEmail,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(body.error || `Request failed (${response.status})`);
        }

        toast.success(`${name.trim()} added successfully`);
        setPhase('success');
        onSuccess?.();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add student';
        toast.error(message);
        setPhase('idle');
      }
    },
    [name, email, isValid, hasEmail, onSuccess],
  );

  const handleReset = useCallback(() => {
    setName('');
    setEmail('');
    setPhase('idle');
  }, []);

  if (phase === 'success') {
    return (
      <div className="min-h-[100dvh] bg-stone-50 dark:bg-stone-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <span className="text-4xl">&#10003;</span>
        </div>
        <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
          Student added!
        </p>
        <div className="flex gap-3">
          <StitchButton variant="secondary" onClick={handleReset}>
            Add Another
          </StitchButton>
          <StitchButton onClick={onClose}>
            Done
          </StitchButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-stone-950">
      {/* Header bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
        <button type="button" onClick={onClose} className="p-2 -ml-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors" aria-label="Close">
          <X className="h-5 w-5 text-stone-500" />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          New Student
        </h1>
        <button type="button" onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors" aria-label="Close">
          <X className="h-5 w-5 text-stone-500" />
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <UserPlus className="h-9 w-9 text-white" />
          </div>
        </div>

        {/* Heading + subtitle */}
        <h2 className="text-2xl font-bold text-center text-stone-900 dark:text-stone-100 mb-1">
          Add Student
        </h2>
        <p className="text-center text-sm text-stone-500 dark:text-stone-400 mb-8">
          Enter their name to get started. Email is optional.
        </p>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-sm space-y-5">
          {/* Name field */}
          <div>
            <StitchFieldLabel label="Student Name" required />
            <StitchInput id="studentName" value={name} placeholder="e.g. John" onChange={setName} />
          </div>

          {/* Email field */}
          <div>
            <StitchFieldLabel label="Email" />
            <StitchInput id="studentEmail" value={email} type="email" placeholder="student@example.com" onChange={setEmail} />
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">
              Without email, a shadow profile is created (no login access).
            </p>
          </div>

          {/* Divider */}
          <hr className="border-stone-200 dark:border-stone-800" />

          {/* Live preview */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">
              Live Preview
            </p>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
              <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-sm shrink-0">
                {firstLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                  {name.trim() || 'Student Name'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                    Student
                  </span>
                  <span className="text-stone-300 dark:text-stone-600 text-xs" aria-hidden="true">&middot;</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {hasEmail ? 'Invite pending' : 'Shadow (no login)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <StitchButton
            type="submit"
            loading={phase === 'submitting'}
            disabled={!isValid}
            icon={<UserPlus className="h-4 w-4" />}
            className="w-full"
          >
            Add Student
          </StitchButton>
        </form>
      </div>
    </div>
  );
}
