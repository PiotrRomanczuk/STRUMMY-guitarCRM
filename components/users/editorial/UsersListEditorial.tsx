import Link from 'next/link';

import type { UserListRow, UserListFilters } from '@/lib/services/users-list-queries';
import { ShadowBadge } from './ShadowBadge';

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const initialsFor = (name: string | null, email: string | null): string => {
  const src = (name && name.trim()) || (email && email.trim()) || '?';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0] ?? '?')[0].toUpperCase();
};

const rolesFor = (r: UserListRow): string => {
  const roles: string[] = [];
  if (r.isAdmin) roles.push('Admin');
  if (r.isTeacher) roles.push('Teacher');
  if (r.isStudent) roles.push('Student');
  return roles.join(' · ') || 'No role';
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--mono)',
  fontSize: 12,
  color: 'var(--ink)',
};

type Props = {
  rows: UserListRow[];
  filters: UserListFilters;
  canEdit: boolean;
};

export const UsersListEditorial = ({ rows, filters, canEdit }: Props) => (
  <div
    style={{
      background: 'var(--ivory)',
      color: 'var(--ink)',
      fontSize: 13,
      lineHeight: 1.4,
      minHeight: '100%',
      padding: '28px 32px 64px',
    }}
  >
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.16em',
        }}
      >
        Studio
      </div>
      <h1
        style={{
          margin: '4px 0 6px',
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          fontSize: 40,
          letterSpacing: '-0.02em',
          fontStyle: 'italic',
        }}
      >
        People
      </h1>
      <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{rows.length} shown</div>
    </div>

    <form
      method="get"
      style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}
    >
      <input
        name="search"
        defaultValue={filters.search ?? ''}
        placeholder="Search name or email"
        style={{ ...selectStyle, fontFamily: 'var(--sans)', minWidth: 220 }}
      />
      <select name="role" defaultValue={filters.role ?? ''} style={selectStyle}>
        <option value="">All roles</option>
        <option value="student">Students</option>
        <option value="teacher">Teachers</option>
        <option value="admin">Admins</option>
        <option value="shadow">Unclaimed</option>
      </select>
      <select name="active" defaultValue={filters.active ?? ''} style={selectStyle}>
        <option value="">Active</option>
        <option value="false">Deactivated</option>
      </select>
      <button
        type="submit"
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          border: 'none',
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--sans)',
        }}
      >
        Filter
      </button>
    </form>

    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {rows.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--ink-4)',
            fontStyle: 'italic',
            fontFamily: 'var(--serif)',
            fontSize: 15,
          }}
        >
          No people match these filters.
        </div>
      ) : (
        rows.map((r, i) => (
          <div
            key={r.id}
            className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_150px_120px_90px]"
            style={{
              gap: 14,
              padding: '14px 20px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--rule)' : 'none',
              alignItems: 'center',
            }}
          >
            <Link
              href={`/dashboard/users/${r.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minWidth: 0,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-dim))',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--serif)',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--ink-2)',
                  flexShrink: 0,
                  opacity: r.isActive ? 1 : 0.5,
                }}
              >
                {initialsFor(r.fullName, r.email)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.fullName ?? r.email ?? 'Unnamed'}
                  {r.isShadow && <ShadowBadge />}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    color: 'var(--ink-4)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.email}
                </div>
              </div>
            </Link>
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-3)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
              }}
            >
              {rolesFor(r)}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
              {r.isActive ? formatDate(r.createdAt) : 'Deactivated'}
            </span>
            <span style={{ textAlign: 'right' }}>
              {canEdit && (
                <Link
                  href={`/dashboard/users/${r.id}/edit`}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    color: 'var(--gold-2)',
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                  }}
                >
                  Edit →
                </Link>
              )}
            </span>
          </div>
        ))
      )}
    </div>
  </div>
);
