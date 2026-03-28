'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StitchFieldLabelProps {
  label: string;
  required?: boolean;
  dotColor?: string;
}

export function StitchFieldLabel({
  label,
  required,
  dotColor,
}: StitchFieldLabelProps) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
      {dotColor && (
        <span
          className={cn('w-2 h-2 rounded-full', dotColor)}
          aria-hidden="true"
        />
      )}
      {label}
      {required && <span className="text-stone-400">*</span>}
    </label>
  );
}

interface StitchInputProps {
  id: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

export function StitchInput({
  id,
  value,
  type = 'text',
  placeholder,
  onChange,
  onBlur,
  error,
}: StitchInputProps) {
  return (
    <>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={cn(
          'w-full px-4 py-3 rounded-xl text-sm',
          'bg-stone-100 dark:bg-stone-800 border-0',
          'text-stone-900 dark:text-stone-100',
          'placeholder:text-stone-400 dark:placeholder:text-stone-500',
          'focus:outline-none focus:ring-2 focus:ring-amber-500/50',
          'transition-shadow',
          error && 'ring-2 ring-red-500/50'
        )}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

interface StitchTextareaProps {
  id: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

export function StitchTextarea({
  id,
  value,
  placeholder,
  rows = 3,
  onChange,
  onBlur,
  error,
}: StitchTextareaProps) {
  return (
    <>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={!!error}
        className={cn(
          'w-full px-4 py-3 rounded-xl text-sm resize-y',
          'bg-stone-100 dark:bg-stone-800 border-0',
          'text-stone-900 dark:text-stone-100',
          'placeholder:text-stone-400 dark:placeholder:text-stone-500',
          'focus:outline-none focus:ring-2 focus:ring-amber-500/50',
          'transition-shadow',
          error && 'ring-2 ring-red-500/50'
        )}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

interface StitchSelectProps {
  id: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
}

export function StitchSelect({
  id,
  value,
  options,
  placeholder,
  onChange,
  onBlur,
  error,
}: StitchSelectProps) {
  return (
    <>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        className={cn(
          'w-full px-4 py-3 rounded-xl text-sm appearance-none',
          'bg-stone-100 dark:bg-stone-800 border-0',
          'text-stone-900 dark:text-stone-100',
          'focus:outline-none focus:ring-2 focus:ring-amber-500/50',
          'transition-shadow',
          error && 'ring-2 ring-red-500/50'
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

interface StitchPickerButtonProps {
  icon: ReactNode;
  placeholder: string;
  selectedLabel?: string;
  onClick: () => void;
}

export function StitchPickerButton({
  icon,
  placeholder,
  selectedLabel,
  onClick,
}: StitchPickerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl',
        'bg-stone-100 dark:bg-stone-800',
        'hover:bg-stone-150 dark:hover:bg-stone-700 transition-colors',
        'text-left'
      )}
    >
      <span className="shrink-0 w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-400">
        {icon}
      </span>
      <span
        className={cn(
          'text-sm',
          selectedLabel
            ? 'text-stone-900 dark:text-stone-100 font-medium'
            : 'text-stone-400 dark:text-stone-500'
        )}
      >
        {selectedLabel || placeholder}
      </span>
    </button>
  );
}
