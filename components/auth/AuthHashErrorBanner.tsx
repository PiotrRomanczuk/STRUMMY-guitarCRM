'use client';
import { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';

export function AuthHashErrorBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('error=')) return;

    const params = new URLSearchParams(hash.slice(1));
    const code = params.get('error_code') ?? params.get('error') ?? '';
    const description = params.get('error_description')?.replace(/\+/g, ' ') ?? '';

    let msg: string | null = null;
    if (code === 'otp_expired' || description.toLowerCase().includes('expired')) {
      msg = 'Your invitation link has expired. Please ask your teacher to send a new invite.';
    } else if (code === 'access_denied') {
      msg = description || 'Access denied. Please request a new invitation link.';
    } else if (code) {
      msg = description || 'There was a problem with your link. Please try again.';
    }

    window.history.replaceState(null, '', window.location.pathname);
    if (msg) Promise.resolve().then(() => setMessage(msg));
  }, []);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive shadow-md">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{message}</p>
      </div>
    </div>
  );
}
