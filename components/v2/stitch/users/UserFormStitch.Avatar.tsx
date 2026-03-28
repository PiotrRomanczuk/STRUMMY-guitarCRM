'use client';

import { Camera } from 'lucide-react';

export function UserFormAvatar() {
  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <span className="text-3xl text-white/80" aria-hidden="true">
            +
          </span>
        </div>
        <button
          type="button"
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 flex items-center justify-center shadow-sm hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
          aria-label="Upload avatar"
        >
          <Camera className="h-4 w-4 text-stone-500 dark:text-stone-400" />
        </button>
      </div>
    </div>
  );
}
