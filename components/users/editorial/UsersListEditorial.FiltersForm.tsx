'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import type { UserListFilters } from '@/lib/services/users-list-queries';

const controlStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--mono)',
  fontSize: 12,
  color: 'var(--ink)',
};

type Props = {
  filters: UserListFilters;
};

const buildHref = (filters: UserListFilters, next: Partial<UserListFilters>): string => {
  const merged = { ...filters, ...next };
  const params = new URLSearchParams();
  if (merged.search) params.set('search', merged.search);
  if (merged.role) params.set('role', merged.role);
  if (merged.active) params.set('active', merged.active);
  if (merged.studentStatus) params.set('studentStatus', merged.studentStatus);
  const qs = params.toString();
  return qs ? `/dashboard/users?${qs}` : '/dashboard/users';
};

/** People filters that apply live — selects push immediately, search debounces. */
export const UsersListFiltersForm = ({ filters }: Props) => {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = (next: Partial<UserListFilters>) =>
    router.push(buildHref(filters, next), { scroll: false });

  const applyDebounced = (next: Partial<UserListFilters>) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      router.replace(buildHref(filters, next), { scroll: false });
    }, 350);
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}
    >
      <input
        name="search"
        defaultValue={filters.search ?? ''}
        placeholder="Search name or email"
        aria-label="Search people by name or email"
        onChange={(e) => applyDebounced({ search: e.target.value.trim() || undefined })}
        style={{ ...controlStyle, fontFamily: 'var(--sans)', minWidth: 220 }}
      />
      <select
        name="role"
        aria-label="Filter by role"
        defaultValue={filters.role ?? ''}
        onChange={(e) => apply({ role: (e.target.value || undefined) as UserListFilters['role'] })}
        style={controlStyle}
      >
        <option value="">All roles</option>
        <option value="student">Students</option>
        <option value="teacher">Teachers</option>
        <option value="admin">Admins</option>
        <option value="shadow">Unclaimed</option>
      </select>
      <select
        name="active"
        aria-label="Filter by active state"
        defaultValue={filters.active ?? ''}
        onChange={(e) =>
          apply({ active: (e.target.value || undefined) as UserListFilters['active'] })
        }
        style={controlStyle}
      >
        <option value="">Active</option>
        <option value="false">Deactivated</option>
      </select>
      <select
        name="studentStatus"
        aria-label="Filter by student status"
        defaultValue={filters.studentStatus ?? ''}
        onChange={(e) =>
          apply({
            studentStatus: (e.target.value || undefined) as UserListFilters['studentStatus'],
          })
        }
        style={controlStyle}
      >
        <option value="">All student statuses</option>
        <option value="lead">Lead</option>
        <option value="trial">Trial</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="churned">Churned</option>
      </select>
    </form>
  );
};
