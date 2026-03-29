'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const STORAGE_KEY = 'strummy-demo-banner-dismissed';

function getSnapshot(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getServerSnapshot(): boolean {
  return true; // Hide on server to avoid flash
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export function DemoBanner() {
  const [localDismissed, setLocalDismissed] = useState(false);
  const wasDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setLocalDismissed(true);
  }, []);

  if (wasDismissed || localDismissed) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-[#f2b127]/15 border-b border-[#f2b127]/30 px-4 py-2 text-sm text-[#f2b127]">
      <span className="truncate">
        <strong>Demo Account</strong> — You&apos;re viewing sample data.{' '}
        <Link href="/sign-up" className="underline underline-offset-2 hover:text-[#ffd183] font-medium">
          Sign up
        </Link>{' '}
        to create your own workspace.
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded hover:bg-[#f2b127]/20 transition-colors"
        aria-label="Dismiss demo banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
