'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface UserListFiltersProps {
  search: string;
  roleFilter: '' | 'admin' | 'teacher' | 'student';
  studentStatusFilter: '' | 'active' | 'archived';
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: '' | 'admin' | 'teacher' | 'student') => void;
  onStudentStatusFilterChange: (value: '' | 'active' | 'archived') => void;
}

const ROLE_CHIPS = [
  { label: 'All', value: '' as const },
  { label: 'Students', value: 'student' as const },
  { label: 'Teachers', value: 'teacher' as const },
  { label: 'Admins', value: 'admin' as const },
];

const STATUS_CHIPS = [
  { label: 'Active', value: 'active' as const },
  { label: 'Archived', value: 'archived' as const },
];

export function UserListFilters({
  search,
  roleFilter,
  studentStatusFilter,
  onSearchChange,
  onRoleFilterChange,
  onStudentStatusFilterChange,
}: UserListFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search students..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9 min-h-[44px] text-base"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Role filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {ROLE_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value}
            label={chip.label}
            active={roleFilter === chip.value}
            onClick={() => onRoleFilterChange(chip.value)}
          />
        ))}
      </div>

      {/* Status chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
        {STATUS_CHIPS.map((chip) => (
          <FilterChip
            key={chip.value}
            label={chip.label}
            active={studentStatusFilter === chip.value}
            onClick={() => onStudentStatusFilterChange(chip.value)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 h-11 px-4 rounded-full text-sm font-medium transition-colors',
        'border border-border min-h-[44px]',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-muted-foreground'
      )}
    >
      {label}
    </button>
  );
}
