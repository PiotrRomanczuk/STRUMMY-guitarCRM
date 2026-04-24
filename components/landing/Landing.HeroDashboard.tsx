'use client';

import { Avatar, HealthDot } from './landing-primitives';

const ICON_PATHS = {
  home: 'M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  lesson: 'M4 5h13a3 3 0 0 1 3 3v12H7a3 3 0 0 1-3-3zM4 5a3 3 0 0 0 3 3h13',
  students: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  song: 'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  assign: 'M9 11l3 3 7-7M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  stats: 'M3 3v18h18M7 14l3-3 4 4 6-6',
  calendar:
    'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 4h18M8 3v4M16 3v4',
  fretboard: 'M3 6h18M3 10h18M3 14h18M3 18h18M7 3v18M13 3v18M19 3v18',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm10 2l-4.35-4.35',
  spark:
    'M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8',
};

function MiniIcon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const SIDEBAR_ITEMS = [
  { d: ICON_PATHS.home, active: true },
  { d: ICON_PATHS.lesson },
  { d: ICON_PATHS.students },
  { d: ICON_PATHS.song },
  { d: ICON_PATHS.assign },
  { d: ICON_PATHS.stats },
  { d: ICON_PATHS.calendar },
  { d: ICON_PATHS.fretboard },
];

const STUDENTS = [
  { name: 'Emma Johnson', initials: 'EJ', color: '#c89523', health: 'excellent' },
  { name: 'Carlos Reyes', initials: 'CR', color: '#b84a3a', health: 'at_risk' },
  { name: 'Lily Park', initials: 'LP', color: '#3a7d3a', health: 'good' },
];

const LESSONS = [
  { time: '4:00p', dur: '45m', student: STUDENTS[0], song: 'Blackbird', key: 'G' },
  { time: '5:00p', dur: '30m', student: STUDENTS[1], song: 'Wonderwall', key: 'Em' },
  { time: '6:30p', dur: '45m', student: STUDENTS[2], song: 'House of the Rising Sun', key: 'Am' },
];

const STATS = [
  { label: 'Lessons today', value: '3', sub: '2h 0m total' },
  { label: 'Active students', value: '27', sub: 'of 31 this week' },
  { label: 'Studio streak', value: '11', sub: 'days on average' },
];

export function HeroDashboard() {
  const card = { background: 'var(--l-card)', border: '1px solid var(--l-rule)', borderRadius: 8 };

  return (
    <div
      className="flex h-full w-full overflow-hidden text-xs leading-snug"
      style={{ background: 'var(--l-ivory)', color: 'var(--l-ink)' }}
    >
      {/* Icon sidebar */}
      <aside
        className="flex w-[54px] shrink-0 flex-col items-center gap-1 border-r py-3.5"
        style={{ background: 'var(--l-paper)', borderColor: 'var(--l-rule)' }}
      >
        <div
          className="mb-2 grid h-[26px] w-[26px] place-items-center rounded-md"
          style={{ background: 'linear-gradient(135deg, var(--l-gold) 0%, var(--l-gold-2) 100%)' }}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M5 19c0-3 2-5 4-6s2-4 5-4 5 3 5 3-2 2-5 2-3 2-5 3-4 2-4 2z" />
          </svg>
        </div>
        {SIDEBAR_ITEMS.map((it, i) => (
          <div
            key={i}
            className="relative grid h-8 w-8 place-items-center rounded-md"
            style={{
              color: it.active ? 'var(--l-ink)' : 'var(--l-ink-4)',
              background: it.active ? 'var(--l-rule-2)' : 'transparent',
            }}
          >
            {it.active && (
              <span
                className="absolute -left-2.5 bottom-2 top-2 w-0.5 rounded-r"
                style={{ background: 'var(--l-gold)' }}
              />
            )}
            <MiniIcon d={it.d} size={15} />
          </div>
        ))}
      </aside>

      {/* Main panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div
          className="flex h-[42px] items-center gap-2.5 border-b px-4"
          style={{ borderColor: 'var(--l-rule)', background: 'var(--l-paper)' }}
        >
          <div
            className="flex min-w-[200px] items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]"
            style={{ background: 'var(--l-rule-2)', color: 'var(--l-ink-4)' }}
          >
            <MiniIcon d={ICON_PATHS.search} size={11} />
            <span>Search students, songs…</span>
          </div>
          <div className="flex-1" />
          <div
            className="rounded-full px-2.5 py-1 text-[10px] font-medium"
            style={{ background: 'var(--l-gold-tint)', color: 'var(--l-gold-2)' }}
          >
            Wk 17
          </div>
          <div
            className="rounded-md px-3 py-1.5 text-[11px] font-medium"
            style={{ background: 'var(--l-ink)', color: 'var(--l-paper)' }}
          >
            + New lesson
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-5" style={{ background: 'var(--l-ivory)' }}>
          {/* Greeting */}
          <div className="mb-4">
            <div
              className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--l-ink-4)' }}
            >
              Thursday · April 23
            </div>
            <div className="font-serif text-[26px] font-normal tracking-[-0.02em] leading-tight">
              Good afternoon, <em style={{ color: 'var(--l-gold-2)' }}>Sarah</em>.
            </div>
          </div>

          {/* Stats */}
          <div className="mb-3.5 grid grid-cols-3 gap-2.5">
            {STATS.map((s, i) => (
              <div key={i} style={{ ...card, padding: '12px 14px' }}>
                <div
                  className="text-[9px] font-medium uppercase tracking-[0.12em]"
                  style={{ color: 'var(--l-ink-4)' }}
                >
                  {s.label}
                </div>
                <div className="mt-1.5 font-serif text-[28px] font-normal leading-none tracking-[-0.03em]">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[10px]" style={{ color: 'var(--l-ink-4)' }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Agenda */}
          <div style={{ ...card, padding: '14px 18px' }}>
            <div
              className="flex items-baseline justify-between border-b pb-2"
              style={{ borderColor: 'var(--l-rule)' }}
            >
              <div>
                <div
                  className="text-[9px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: 'var(--l-ink-4)' }}
                >
                  Today&apos;s agenda
                </div>
                <div className="mt-0.5 font-serif text-[16px] tracking-[-0.01em]">
                  3 lessons · 2h 0m
                </div>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--l-ink-4)' }}>
                Open calendar →
              </span>
            </div>
            {LESSONS.map((l, idx) => (
              <div
                key={idx}
                className="grid items-center gap-3"
                style={{
                  gridTemplateColumns: '54px 1fr auto',
                  padding: '10px 0',
                  borderBottom: idx === 2 ? 'none' : '1px solid var(--l-rule)',
                }}
              >
                <div>
                  <div className="font-mono text-xs font-medium" style={{ color: 'var(--l-ink)' }}>
                    {l.time}
                  </div>
                  <div className="font-mono text-[10px]" style={{ color: 'var(--l-ink-4)' }}>
                    {l.dur}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 flex items-center gap-2">
                    <Avatar initials={l.student.initials} color={l.student.color} size={22} />
                    <span className="text-[12.5px] font-medium">{l.student.name}</span>
                    <HealthDot health={l.student.health} size={6} />
                  </div>
                  <div className="flex items-center gap-2 pl-[30px]">
                    <span
                      className="rounded-sm border px-1.5 py-px font-mono text-[10px]"
                      style={{ color: 'var(--l-gold-2)', borderColor: 'var(--l-gold-dim)' }}
                    >
                      {l.key}
                    </span>
                    <span className="font-serif text-xs italic" style={{ color: 'var(--l-ink-2)' }}>
                      {l.song}
                    </span>
                  </div>
                </div>
                <button
                  className="cursor-pointer rounded-md border px-3 py-1.5 text-[11px]"
                  style={{
                    borderColor: 'var(--l-rule)',
                    background: 'var(--l-card)',
                    color: 'var(--l-ink-2)',
                  }}
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
