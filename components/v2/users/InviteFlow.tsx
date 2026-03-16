'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { InfoStep, ConfirmStep, SuccessStep } from './InviteFlow.Steps';
import type { InviteData } from './InviteFlow.Steps';

type InviteStep = 'info' | 'confirm' | 'success';

/**
 * Simplified mobile invite flow for quickly adding a new student.
 * Two-step process: enter name + email, then confirm.
 * Suitable for teachers adding students between lessons.
 */
export function InviteFlow() {
  const router = useRouter();
  const [step, setStep] = useState<InviteStep>('info');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InviteData>({
    firstName: '',
    email: '',
  });

  const canProceed = data.firstName.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!data.firstName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: '',
          email: data.email.trim() || '',
          username: '',
          isAdmin: false,
          isTeacher: false,
          isStudent: true,
          isParent: false,
          isActive: true,
          isShadow: !data.email.trim(),
          parentId: null,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to create student');
      }

      setStep('success');
      toast.success('Student added successfully');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to add student'
      );
    } finally {
      setLoading(false);
    }
  }, [data]);

  return (
    <MobilePageShell title="Add Student" subtitle="Quick invite">
      <AnimatePresence mode="wait">
        {step === 'info' && (
          <InfoStep
            key="info"
            data={data}
            onChange={setData}
            canProceed={canProceed}
            onNext={() => setStep('confirm')}
          />
        )}

        {step === 'confirm' && (
          <ConfirmStep
            key="confirm"
            data={data}
            loading={loading}
            onBack={() => setStep('info')}
            onSubmit={handleSubmit}
          />
        )}

        {step === 'success' && (
          <SuccessStep
            key="success"
            name={data.firstName}
            onAddAnother={() => {
              setData({ firstName: '', email: '' });
              setStep('info');
            }}
            onDone={() => router.push('/dashboard/users')}
          />
        )}
      </AnimatePresence>
    </MobilePageShell>
  );
}
