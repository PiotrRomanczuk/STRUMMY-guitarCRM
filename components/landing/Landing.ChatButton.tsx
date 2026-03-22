'use client';

import { useState } from 'react';
import { MessageCircle, Pencil } from 'lucide-react';

export function LandingChatButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:opacity-90 hover:scale-105 transition-all duration-300"
        aria-label="Open chat"
      >
        {isHovered ? (
          <Pencil className="h-7 w-7" />
        ) : (
          <MessageCircle className="h-7 w-7" />
        )}
      </button>
    </div>
  );
}
