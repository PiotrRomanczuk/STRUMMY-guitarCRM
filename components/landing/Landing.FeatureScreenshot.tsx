'use client';

import { BrowserFrame, Avatar, HealthDot } from './landing-primitives';

const SONGS = [
  { title: 'Blackbird', author: 'The Beatles', key: 'G', status: 'started' },
  { title: 'Landslide', author: 'Fleetwood Mac', key: 'C', status: 'remembered' },
  { title: 'Classical Gas', author: 'Mason Williams', key: 'Am', status: 'to_learn' },
  { title: 'Dust in the Wind', author: 'Kansas', key: 'C', status: 'mastered' },
];

const STATUS_COLORS: Record<string, { label: string; color: string; dots: number }> = {
  to_learn: { label: 'To learn', color: 'var(--l-ink-4)', dots: 1 },
  started: { label: 'Started', color: 'var(--l-info)', dots: 2 },
  remembered: { label: 'Remembered', color: 'var(--l-warn)', dots: 3 },
  mastered: { label: 'Mastered', color: 'var(--l-success)', dots: 5 },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.to_learn;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `${s.color}15`, color: s.color }}
    >
      <span className="inline-flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full"
            style={{ background: i < s.dots ? s.color : `${s.color}40` }}
          />
        ))}
      </span>
      {s.label}
    </span>
  );
}

const BARS = [18, 24, 12, 30, 22, 36, 28, 40, 34, 26, 32, 38, 44, 40];

export function LandingFeatureScreenshot() {
  const card = { background: 'var(--l-card)', border: '1px solid var(--l-rule)', borderRadius: 10 };

  return (
    <BrowserFrame url="app.strummy.app/students/s1" height={480}>
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

        <div className="flex-1 overflow-hidden px-6 py-5">
          <div
            className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: 'var(--l-ink-4)' }}
          >
            Students · Intermediate
          </div>

          {/* Header */}
          <div className="mb-4 flex items-center gap-3.5">
            <Avatar initials="EJ" color="#c89523" size={52} />
            <div className="flex-1">
              <div className="font-serif text-[26px] font-normal tracking-[-0.02em]">
                Emma Johnson
              </div>
              <div
                className="mt-0.5 flex items-center gap-2.5 text-xs"
                style={{ color: 'var(--l-ink-3)' }}
              >
                <HealthDot health="excellent" /> Excellent <span>·</span> 2.3 years with you{' '}
                <span>·</span> Next: Today · 4:00p
              </div>
            </div>
            <button
              className="rounded-md border px-3 py-1.5 text-[11px]"
              style={{ borderColor: 'var(--l-rule)', background: 'var(--l-card)' }}
            >
              Message
            </button>
            <button
              className="rounded-md border-none px-3 py-1.5 text-[11px]"
              style={{ background: 'var(--l-ink)', color: 'var(--l-paper)' }}
            >
              + Lesson
            </button>
          </div>

          {/* Stat grid */}
          <div className="mb-3.5 grid grid-cols-4 gap-2.5">
            {[
              { l: 'Songs', v: '14', s: '5 mastered' },
              { l: 'Practice', v: '11', s: 'day streak' },
              { l: 'Lessons', v: '48', s: 'all time' },
              { l: 'Skill', v: '62', s: '% proficient' },
            ].map((st, i) => (
              <div key={i} style={{ ...card, padding: '10px 12px' }}>
                <div
                  className="text-[9px] uppercase tracking-[0.1em]"
                  style={{ color: 'var(--l-ink-4)' }}
                >
                  {st.l}
                </div>
                <div className="mt-0.5 font-serif text-[22px] font-normal leading-none tracking-[-0.03em]">
                  {st.v}
                </div>
                <div className="mt-0.5 text-[9px]" style={{ color: 'var(--l-ink-4)' }}>
                  {st.s}
                </div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-[1.3fr_1fr] gap-2.5">
            {/* Repertoire */}
            <div style={{ ...card, padding: '12px 14px' }}>
              <div
                className="mb-2 text-[9px] font-medium uppercase tracking-[0.14em]"
                style={{ color: 'var(--l-ink-4)' }}
              >
                Repertoire
              </div>
              {SONGS.map((sg, i) => (
                <div
                  key={i}
                  className="grid items-center gap-2.5"
                  style={{
                    gridTemplateColumns: '24px 1fr auto',
                    padding: '7px 0',
                    borderTop: i === 0 ? '1px solid var(--l-rule)' : 'none',
                    borderBottom: '1px solid var(--l-rule)',
                  }}
                >
                  <span className="font-mono text-[9px]" style={{ color: 'var(--l-gold-2)' }}>
                    {sg.key}
                  </span>
                  <div className="min-w-0">
                    <div className="font-serif text-xs italic">{sg.title}</div>
                    <div className="text-[9px]" style={{ color: 'var(--l-ink-4)' }}>
                      {sg.author}
                    </div>
                  </div>
                  <StatusPill status={sg.status} />
                </div>
              ))}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-2.5">
              <div style={{ ...card, padding: '12px 14px' }}>
                <div
                  className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: 'var(--l-ink-4)' }}
                >
                  Practice · 14 days
                </div>
                <div className="flex items-end gap-[3px]" style={{ height: 40 }}>
                  {BARS.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${(v / 44) * 100}%`,
                        background: i >= 12 ? 'var(--l-gold)' : 'var(--l-ink-5)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ ...card, padding: '12px 14px' }}>
                <div
                  className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: 'var(--l-ink-4)' }}
                >
                  AI lesson notes · last session
                </div>
                <div className="text-[11px] leading-normal" style={{ color: 'var(--l-ink-2)' }}>
                  <em className="font-serif text-xs">
                    &ldquo;Alternating bass pattern is solid at 60 BPM. Right-hand independence is
                    the next hurdle — suggest fingerpicking drill for 10 min/day.&rdquo;
                  </em>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
