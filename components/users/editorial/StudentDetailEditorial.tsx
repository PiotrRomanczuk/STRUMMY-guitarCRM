import Link from 'next/link';

import type {
  StudentPreferences,
  StudentProfile,
  StudentRecentLesson,
  StudentRepertoireRow,
} from '@/lib/services/student-detail-queries';
import { totalPracticeMinutes } from '@/lib/services/student-detail-queries';
import { DeleteShadowButton } from './DeleteShadowButton';
import { InviteShadowButton } from './InviteShadowButton';
import { ShadowBadge } from './ShadowBadge';
import { StudentDetailEditorialRepertoire } from './StudentDetailEditorial.Repertoire';
import { Empty, formatMinutes } from './StudentDetailEditorial.shared';
export { Empty, formatMinutes };

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

type Props = {
  profile: StudentProfile;
  repertoire: StudentRepertoireRow[];
  lessons: StudentRecentLesson[];
  preferences: StudentPreferences | null; // IDA-4 — null when onboarding was never completed
  /** True when the viewer is staff (admin/teacher) and may edit repertoire status. */
  canEdit?: boolean;
};

export const StudentDetailEditorial = ({
  profile,
  repertoire,
  lessons,
  preferences,
  canEdit = false,
}: Props) => {
  const totalMins = totalPracticeMinutes(repertoire);
  const mastered = repertoire.filter((r) => r.status === 'mastered').length;
  const active = repertoire.filter((r) => r.status !== 'to_learn').length;
  const display = profile.fullName ?? profile.email ?? 'Student';

  return (
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
      <div style={{ marginBottom: 22 }}>
        <Link
          href="/dashboard/users"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← Students
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            marginTop: 14,
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-dim))',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--ink-2)',
              fontFamily: 'var(--serif)',
              fontSize: 36,
              fontWeight: 500,
            }}
          >
            {initialsFor(profile.fullName, profile.email)}
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                letterSpacing: '.16em',
              }}
            >
              Student · joined {formatDate(profile.createdAt)}
            </div>
            <h1
              style={{
                margin: '4px 0 4px',
                fontFamily: 'var(--serif)',
                fontWeight: 400,
                fontSize: 44,
                letterSpacing: '-0.02em',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {display}
              {profile.isShadow && <ShadowBadge />}
            </h1>
            {profile.email && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-3)' }}>
                {profile.email}
              </div>
            )}
            {preferences && (
              <div
                data-testid="student-about-line"
                style={{
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '.1em',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--rule)',
                    borderRadius: 4,
                    padding: '2px 8px',
                  }}
                >
                  {preferences.skillLevel}
                </span>
                {preferences.goals.map((goal) => (
                  <span
                    key={goal}
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: 11,
                      color: 'var(--ink-3)',
                      background: 'var(--paper)',
                      borderRadius: 12,
                      padding: '2px 10px',
                    }}
                  >
                    {goal}
                  </span>
                ))}
              </div>
            )}
            <div
              style={{
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {profile.isShadow && (
                <InviteShadowButton userId={profile.id} defaultEmail={profile.inviteEmail} />
              )}
              <a
                href={`/dashboard/users/${profile.id}/import`}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--rule)',
                  background: 'transparent',
                  color: 'var(--ink)',
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: 'var(--sans)',
                  textDecoration: 'none',
                }}
              >
                Import songs
              </a>
              {profile.isShadow && <DeleteShadowButton userId={profile.id} />}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 32 }}>
            <Stat label="Songs in progress" value={String(active)} />
            <Stat label="Mastered" value={String(mastered)} />
            <Stat label="Total practice" value={formatMinutes(totalMins)} />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 20,
        }}
      >
        <Card>
          <CardHeader eyebrow="Repertoire" title="Songs the student is learning" />
          <StudentDetailEditorialRepertoire repertoire={repertoire} canEdit={canEdit} />
        </Card>

        <Card>
          <CardHeader eyebrow="Recent" title="Lessons" />
          {lessons.length === 0 ? (
            <Empty>No lessons yet.</Empty>
          ) : (
            <div>
              {lessons.map((l, i) => (
                <Link
                  key={l.id}
                  href={`/dashboard/lessons/${l.id}`}
                  style={{
                    display: 'block',
                    padding: '12px 22px',
                    borderBottom: i < lessons.length - 1 ? '1px solid var(--rule)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                    }}
                  >
                    {formatDate(l.scheduledAt)} · {l.status}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {l.title ?? 'Untitled lesson'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
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

