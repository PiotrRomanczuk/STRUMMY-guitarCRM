'use client';

import { BrowserFrame, Avatar } from './landing-primitives';

const DAYS = ['Mon 21', 'Tue 22', 'Wed 23', 'Thu 24', 'Fri 25'];
const HOURS = ['3:00p', '4:00p', '5:00p', '6:00p'];

interface Lesson {
  day: number;
  hour: number;
  student: string;
  initials: string;
  color: string;
  song: string;
  dur: string;
  live?: boolean;
}

const LESSONS: Lesson[] = [
  {
    day: 0,
    hour: 0,
    student: 'Emma Johnson',
    initials: 'EJ',
    color: '#c89523',
    song: 'Blackbird',
    dur: '45m',
  },
  {
    day: 0,
    hour: 2,
    student: 'Carlos Reyes',
    initials: 'CR',
    color: '#7a5c3a',
    song: 'Wonderwall',
    dur: '30m',
  },
  {
    day: 1,
    hour: 1,
    student: 'Lily Park',
    initials: 'LP',
    color: '#6b8e5a',
    song: 'Landslide',
    dur: '45m',
  },
  {
    day: 2,
    hour: 0,
    student: 'Maya Patel',
    initials: 'MP',
    color: '#8b5e8b',
    song: 'Classical Gas',
    dur: '30m',
  },
  {
    day: 2,
    hour: 2,
    student: 'Emma Johnson',
    initials: 'EJ',
    color: '#c89523',
    song: 'Dust in the Wind',
    dur: '45m',
  },
  {
    day: 3,
    hour: 1,
    student: 'Carlos Reyes',
    initials: 'CR',
    color: '#7a5c3a',
    song: 'House of the Rising Sun',
    dur: '30m',
    live: true,
  },
  {
    day: 3,
    hour: 3,
    student: 'Lily Park',
    initials: 'LP',
    color: '#6b8e5a',
    song: 'Tears in Heaven',
    dur: '45m',
  },
  {
    day: 4,
    hour: 0,
    student: 'Maya Patel',
    initials: 'MP',
    color: '#8b5e8b',
    song: 'Stairway to Heaven',
    dur: '30m',
  },
  {
    day: 4,
    hour: 2,
    student: 'Noah Kim',
    initials: 'NK',
    color: '#5a7d9b',
    song: 'Nothing Else Matters',
    dur: '45m',
  },
];

function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-2.5 py-2"
      style={{
        background: lesson.live ? 'var(--l-gold-tint)' : 'var(--l-card)',
        border: `1px solid ${lesson.live ? 'var(--l-gold-dim)' : 'var(--l-rule)'}`,
      }}
    >
      <Avatar initials={lesson.initials} color={lesson.color} size={24} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[10px] font-medium">{lesson.student}</span>
          {lesson.live && (
            <span
              className="shrink-0 rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-white"
              style={{ background: 'var(--l-gold)' }}
            >
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[9px]" style={{ color: 'var(--l-ink-4)' }}>
          <span className="font-serif italic">{lesson.song}</span>
          <span>· {lesson.dur}</span>
        </div>
      </div>
    </div>
  );
}

export function LandingLessonsScreenshot() {
  const card = { background: 'var(--l-card)', border: '1px solid var(--l-rule)', borderRadius: 10 };

  return (
    <BrowserFrame url="app.strummy.app/lessons" height={480}>
      <div
        className="flex h-full w-full overflow-hidden text-xs leading-snug"
        style={{ background: 'var(--l-ivory)' }}
      >
        {/* Mini sidebar */}
        <div
          className="flex w-12 shrink-0 flex-col items-center gap-2.5 border-r py-3"
          style={{ background: 'var(--l-paper)', borderColor: 'var(--l-rule)' }}
        >
          <div
            className="h-6 w-6 rounded-md"
            style={{ background: 'linear-gradient(135deg, var(--l-gold), var(--l-gold-2))' }}
          />
        </div>

        <div className="flex-1 overflow-hidden px-5 py-4">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div
                className="font-mono text-[10px] uppercase tracking-[0.14em]"
                style={{ color: 'var(--l-ink-4)' }}
              >
                Lessons · Week 17
              </div>
              <div className="mt-0.5 font-serif text-lg font-normal tracking-[-0.02em]">
                April 21 – 25
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border px-2.5 py-1 text-[10px]"
                style={{ borderColor: 'var(--l-rule)', background: 'var(--l-card)' }}
              >
                Today
              </button>
              <button
                className="rounded-md border-none px-2.5 py-1 text-[10px]"
                style={{ background: 'var(--l-ink)', color: 'var(--l-paper)' }}
              >
                + New lesson
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {/* Day headers */}
            <div
              className="grid border-b"
              style={{
                gridTemplateColumns: '48px repeat(5, 1fr)',
                borderColor: 'var(--l-rule)',
                background: 'var(--l-paper)',
              }}
            >
              <div className="border-r px-2 py-2" style={{ borderColor: 'var(--l-rule)' }} />
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  className="border-r px-2 py-2 text-center font-mono text-[9px] uppercase tracking-[0.08em]"
                  style={{
                    borderColor: 'var(--l-rule)',
                    color: i === 3 ? 'var(--l-gold)' : 'var(--l-ink-4)',
                    fontWeight: i === 3 ? 600 : 400,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Time rows */}
            {HOURS.map((hour, hi) => (
              <div
                key={hour}
                className="grid border-b last:border-b-0"
                style={{ gridTemplateColumns: '48px repeat(5, 1fr)', borderColor: 'var(--l-rule)' }}
              >
                <div
                  className="border-r px-2 py-2.5 text-right font-mono text-[9px]"
                  style={{ borderColor: 'var(--l-rule)', color: 'var(--l-ink-4)' }}
                >
                  {hour}
                </div>
                {DAYS.map((_, di) => {
                  const lesson = LESSONS.find((l) => l.day === di && l.hour === hi);
                  return (
                    <div
                      key={di}
                      className="border-r p-1"
                      style={{ borderColor: 'var(--l-rule)', minHeight: 56 }}
                    >
                      {lesson && <LessonCard lesson={lesson} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sync indicator */}
          <div
            className="mt-2.5 flex items-center gap-1.5 font-mono text-[9px]"
            style={{ color: 'var(--l-ink-4)' }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--l-success)' }}
            />
            Synced with Google Calendar · last updated 2m ago
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
