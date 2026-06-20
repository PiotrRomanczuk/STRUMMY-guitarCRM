'use client';

import { RouteError } from '@/components/shared/RouteError';

export default function PracticeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} context="practice" />;
}
