'use client';

import { useEffect, useRef } from 'react';
import { SearchIcon } from 'lucide-react';

interface SidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <label
      className="bg-muted/60 focus-within:border-border flex items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 transition-colors"
      data-testid="sidebar-search"
    >
      <SearchIcon className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search"
        aria-label="Filter navigation"
        className="placeholder:text-muted-foreground/70 min-w-0 flex-1 bg-transparent text-xs outline-none"
      />
      <kbd
        aria-hidden="true"
        className="border-border text-muted-foreground/70 rounded border px-1 font-mono text-[10px]"
      >
        ⌘K
      </kbd>
    </label>
  );
}
