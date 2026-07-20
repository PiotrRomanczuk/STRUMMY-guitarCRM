'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import type { AssignmentListCounts } from '@/lib/services/assignment-list-params';
import type { StudentOption } from '@/lib/services/lesson-form-data';

type Props = {
  counts: AssignmentListCounts;
  activeStatus?: string;
  sort?: string;
  dir: 'asc' | 'desc';
  search?: string;
  students?: StudentOption[];
  studentId?: string;
};

const TABS: { key: string; label: string; countKey: keyof AssignmentListCounts }[] = [
  { key: '', label: 'All', countKey: 'all' },
  { key: 'not_started', label: 'Not started', countKey: 'not_started' },
  { key: 'in_progress', label: 'In progress', countKey: 'in_progress' },
  { key: 'overdue', label: 'Overdue', countKey: 'overdue' },
  { key: 'completed', label: 'Completed', countKey: 'completed' },
  { key: 'cancelled', label: 'Cancelled', countKey: 'cancelled' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Needs attention' },
  { value: 'due_date', label: 'Due date' },
  { value: 'created_at', label: 'Newest' },
  { value: 'updated_at', label: 'Recently updated' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
];

const selectStyle: React.CSSProperties = {
  border: '1px solid var(--rule)',
  borderRadius: 8,
  padding: '6px 10px',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  background: 'var(--card)',
  color: 'var(--ink-2)',
};

// eslint-disable-next-line max-lines-per-function -- editorial list controls (inline styles)
export const AssignmentsListControls = ({
  counts,
  activeStatus,
  sort,
  dir,
  search,
  students,
  studentId,
}: Props) => {
  const router = useRouter();
  const pathname = usePathname();

  const current: Record<string, string | undefined> = {
    status: activeStatus || undefined,
    student: studentId || undefined,
    q: search || undefined,
    sort: sort || undefined,
    dir: sort ? dir : undefined,
  };

  const buildHref = (patch: Record<string, string | null>): string => {
    const merged = { ...current, ...patch };
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) usp.set(k, v);
    const qs = usp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const push = (patch: Record<string, string | null>) => router.push(buildHref(patch));

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {TABS.map((tab) => {
          const active = (activeStatus ?? '') === tab.key;
          return (
            <Link
              key={tab.key || 'all'}
              href={buildHref({ status: tab.key || null })}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 999,
                border: `1px solid ${active ? 'var(--ink-2)' : 'var(--rule)'}`,
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--ivory)' : 'var(--ink-3)',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                textDecoration: 'none',
              }}
            >
              {tab.label}
              <span style={{ opacity: 0.7 }}>{counts[tab.countKey]}</span>
            </Link>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = String(new FormData(e.currentTarget).get('q') ?? '').trim();
            push({ q: value || null });
          }}
          style={{ display: 'flex', gap: 6 }}
        >
          <input
            key={search ?? ''}
            name="q"
            defaultValue={search ?? ''}
            placeholder="Search title…"
            aria-label="Search assignments by title"
            style={{ ...selectStyle, minWidth: 180 }}
          />
        </form>

        {students && students.length > 0 && (
          <select
            aria-label="Filter by student"
            value={studentId ?? ''}
            onChange={(e) => push({ student: e.target.value || null })}
            style={selectStyle}
          >
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name ?? s.email ?? 'Student'}
              </option>
            ))}
          </select>
        )}

        <select
          aria-label="Sort assignments"
          value={sort ?? ''}
          onChange={(e) => push({ sort: e.target.value || null, dir: e.target.value ? dir : null })}
          style={selectStyle}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value || 'attention'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {sort && (
          <button
            type="button"
            onClick={() => push({ dir: dir === 'asc' ? 'desc' : 'asc' })}
            aria-label={`Sort direction: ${dir === 'asc' ? 'ascending' : 'descending'}`}
            style={{ ...selectStyle, cursor: 'pointer' }}
          >
            {dir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        )}
      </div>
    </div>
  );
};
