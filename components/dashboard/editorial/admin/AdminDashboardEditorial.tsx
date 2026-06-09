import type { AdminPendingInvite, PlatformPulse } from '@/lib/services/admin-dashboard-queries';

import { Card, CardHeader, ComingSoonBody } from '../primitives';

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '18px 22px',
      borderRight: '1px solid var(--rule)',
    }}
  >
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.14em',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontSize: 32,
        fontWeight: 500,
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </div>
  </div>
);

type Props = {
  pulse: PlatformPulse;
  invites: AdminPendingInvite[];
  now: Date;
};

const formatRelative = (iso: string, now: Date): string => {
  const then = new Date(iso);
  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  if (days < 1) return 'today';
  if (days < 14) return `${days}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const AdminDashboardEditorial = ({ pulse, invites, now }: Props) => (
  <div
    style={{
      background: 'var(--ivory)',
      color: 'var(--ink)',
      fontSize: 13,
      lineHeight: 1.4,
      minHeight: '100%',
      padding: '24px 32px 64px',
    }}
  >
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.16em',
        }}
      >
        Platform
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
        Admin overview
      </h1>
      <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>The whole studio at a glance.</div>
    </div>

    <Card>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          background: 'var(--paper)',
        }}
      >
        <Stat label="Users" value={String(pulse.totalUsers)} />
        <Stat label="Students" value={String(pulse.totalStudents)} />
        <Stat label="Teachers" value={String(pulse.totalTeachers)} />
        <Stat label="Songs" value={String(pulse.totalSongs)} />
        <Stat label="Lessons" value={String(pulse.totalLessons)} />
      </div>
    </Card>

    <div
      style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card>
          <CardHeader eyebrow="Watch closely" title="At-risk students" />
          <ComingSoonBody note="Students with low practice or stale progress will surface here. Real query lands in a follow-up." />
        </Card>
        <Card>
          <CardHeader eyebrow="Aggregate" title="Cohort insights" />
          <ComingSoonBody note="Mastery distribution + practice trends by cohort. Coming next." />
        </Card>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card>
          <CardHeader
            eyebrow="Inbox"
            title="Pending invites"
            action={
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
                {invites.length}
              </span>
            }
          />
          {invites.length === 0 ? (
            <ComingSoonBody note="No pending invitations." />
          ) : (
            <div>
              {invites.map((inv, i) => (
                <div
                  key={inv.id}
                  style={{
                    padding: '12px 22px',
                    borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                    borderBottom: '1px solid var(--rule)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)' }}>
                    {inv.email}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.1em',
                    }}
                  >
                    {formatRelative(inv.createdAt, now)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader eyebrow="Trace" title="Audit log" />
          <ComingSoonBody note="System events: invites, role changes, deletes. Wires to audit_log table next." />
        </Card>
        <Card>
          <CardHeader eyebrow="Health" title="Services" />
          <ComingSoonBody note="Supabase, Vercel, Google Drive, Spotify, AI providers. Coming next." />
        </Card>
      </div>
    </div>
  </div>
);
