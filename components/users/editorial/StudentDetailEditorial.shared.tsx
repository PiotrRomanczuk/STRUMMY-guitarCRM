/**
 * Presentation helpers shared between StudentDetailEditorial (a Server
 * Component) and its client sub-components (Body, panels, chart).
 *
 * They live here rather than in StudentDetailEditorial.tsx because importing
 * them from the client bundle dragged that module's server-only dependency
 * chain (student-detail-queries → lib/supabase/server → next/headers) into the
 * client graph, which fails the production build. Keep this module free of any
 * server-only import.
 */

import { HEALTH_LABEL, type HealthStatus } from '@/lib/services/student-health.helpers';

export const formatMinutes = (m: number): string => {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const initialsFor = (name: string | null, email: string | null): string => {
  const src = (name && name.trim()) || (email && email.trim()) || '?';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0] ?? '?')[0].toUpperCase();
};

export const Empty = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: '28px 24px',
      textAlign: 'center',
      color: 'var(--ink-4)',
      fontStyle: 'italic',
      fontFamily: 'var(--serif)',
      fontSize: 14,
    }}
  >
    {children}
  </div>
);

export const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 10,
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

export const CardHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--rule)' }}>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--gold-2)',
        textTransform: 'uppercase',
        letterSpacing: '.14em',
        fontWeight: 500,
      }}
    >
      {eyebrow}
    </div>
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontSize: 22,
        fontWeight: 400,
        letterSpacing: '-0.02em',
        marginTop: 2,
      }}
    >
      {title}
    </div>
  </div>
);

export const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.12em',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontSize: 28,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        marginTop: 2,
      }}
    >
      {value}
    </div>
  </div>
);

const HEALTH_COLOR: Record<HealthStatus, string> = {
  on_track: 'var(--success)',
  watch: 'var(--warn)',
  at_risk: 'var(--danger)',
};

/** Pill that reads the student's practice health at a glance. */
export const HealthBadge = ({ status }: { status: HealthStatus }) => (
  <span
    data-testid="student-health-badge"
    data-status={status}
    className="ed-health-badge"
    style={{
      fontFamily: 'var(--mono)',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      fontWeight: 600,
      color: HEALTH_COLOR[status],
      border: `1px solid ${HEALTH_COLOR[status]}`,
      borderRadius: 999,
      padding: '3px 10px',
      whiteSpace: 'nowrap',
    }}
  >
    {HEALTH_LABEL[status]}
  </span>
);
