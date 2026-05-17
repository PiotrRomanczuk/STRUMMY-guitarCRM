// Screen 5 — Quiz history / progress
// Heatmap calendar, per-chord mastery rings, leaderboard toggle, filters.

function HistoryScreen({ density = 'mobile' }) {
  const isMobile = density === 'mobile';
  const [tab, setTab] = React.useState('progress');

  // 12 weeks heatmap data (0–4 intensity)
  const weeks = Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const seed = (w * 7 + d) * 9301 + 49297;
      const r = (seed % 233280) / 233280;
      // Make recent weeks denser; sundays lighter
      const bias = w / 12;
      if (r < 0.18 - bias * 0.12) return 0;
      return Math.min(4, Math.floor(r * 5 + bias * 2));
    })
  );

  const chords = [
    { name: 'Am',     mastery: 96 }, { name: 'Em',    mastery: 94 },
    { name: 'G',      mastery: 92 }, { name: 'C',     mastery: 90 },
    { name: 'Dm',     mastery: 84 }, { name: 'Cmaj7', mastery: 78 },
    { name: 'Am7',    mastery: 74 }, { name: 'G7',    mastery: 70 },
    { name: 'Dm7',    mastery: 58 }, { name: 'F',     mastery: 52 },
    { name: 'Bm',     mastery: 38 }, { name: 'F#m7',  mastery: 28 },
  ];

  const leaderboard = [
    { rank: 1, name: 'Priya R.',     xp: 4120, you: false },
    { rank: 2, name: 'Maya K.',      xp: 3840, you: true  },
    { rank: 3, name: 'Jordan P.',    xp: 3610, you: false },
    { rank: 4, name: 'Sam Okafor',   xp: 3290, you: false },
    { rank: 5, name: 'Lena Brzeski', xp: 3104, you: false },
  ];

  return (
    <div className={cx('bg-background text-foreground antialiased',
      isMobile ? 'w-[390px] min-h-[844px]' : 'w-full min-h-[800px]')}>
      {/* Header */}
      <header className={cx('flex items-center justify-between gap-3',
        isMobile ? 'px-4 pt-6 pb-3' : 'max-w-6xl mx-auto px-10 pt-8 pb-4')}>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Skills · Chord Quiz</p>
          <h1 className={cx('font-display font-semibold tracking-tight mt-1',
            isMobile ? 'text-2xl' : 'text-3xl')}
            style={{ fontFamily: 'var(--font-display)' }}>Your progress</h1>
        </div>
        <button className="h-9 px-3 inline-flex items-center gap-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground">
          <Icon name="filter" className="w-3.5 h-3.5" /> {!isMobile && '30 days'}
        </button>
      </header>

      {/* Tabs */}
      <div className={cx(isMobile ? 'px-4' : 'max-w-6xl mx-auto px-10')}>
        <div className="flex items-center gap-1 border-b border-border">
          {['progress', 'chords', 'leaderboard'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cx('px-3 h-10 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
                tab === t ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={cx(isMobile ? 'px-4 pb-10 pt-5 space-y-5' : 'max-w-6xl mx-auto px-10 pb-12 pt-6 space-y-6')}>
        {/* Stats strip */}
        <div className={cx('grid gap-3', isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
          <SmallStat label="Quizzes" value="84" sub="last 30 days" />
          <SmallStat label="Best streak" value="13" sub="days, current" tone="amber" icon="fire" />
          <SmallStat label="Total XP" value="14,720" sub="level 7" tone="primary" icon="zap" />
          <SmallStat label="Mastered" value="9/32" sub="chords ≥ 90%" icon="trophy" />
        </div>

        {/* Heatmap */}
        <Card className={cx(isMobile ? 'p-5' : 'p-6')}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display text-base font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Daily activity</p>
              <p className="text-xs text-muted-foreground mt-0.5">68 quizzes in the last 12 weeks</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
              <span>Less</span>
              {[0,1,2,3,4].map((v) => <div key={v} className={cx('h-3 w-3 rounded-sm', heatColor(v))} />)}
              <span>More</span>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1 shrink-0">
                {week.map((v, di) => (
                  <div key={di} className={cx('h-3.5 w-3.5 rounded-sm', heatColor(v))} title={`${v} quizzes`} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground font-mono">
            <span>12 weeks ago</span>
            <span>Today</span>
          </div>
        </Card>

        {/* Per-chord mastery + Leaderboard */}
        <div className={cx('grid gap-5', isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
          <Card className={cx('p-5', !isMobile && 'col-span-2')}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-display text-base font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Chord mastery</p>
                <p className="text-xs text-muted-foreground mt-0.5">Accuracy across last 100 attempts</p>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <button className="px-2 py-1 text-muted-foreground hover:text-foreground rounded">All</button>
                <button className="px-2 py-1 text-foreground bg-secondary rounded">Open</button>
                <button className="px-2 py-1 text-muted-foreground hover:text-foreground rounded">Barre</button>
              </div>
            </div>
            <div className={cx('grid gap-3', isMobile ? 'grid-cols-3' : 'grid-cols-4')}>
              {chords.slice(0, isMobile ? 6 : 8).map((c) => <MasteryRing key={c.name} {...c} />)}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-base font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Studio leaderboard</p>
              <button className="text-xs text-muted-foreground hover:text-foreground">Hide</button>
            </div>
            <ol className="space-y-1">
              {leaderboard.map((p) => (
                <li key={p.rank} className={cx('flex items-center gap-3 px-2.5 py-2 rounded-md',
                  p.you ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary/40')}>
                  <span className={cx('w-5 font-mono text-xs tabular-nums',
                    p.rank === 1 ? 'text-amber-500 font-bold' : 'text-muted-foreground')}>
                    {p.rank}
                  </span>
                  <div className="h-7 w-7 rounded-full bg-secondary border border-border grid place-items-center text-[10px] font-semibold text-muted-foreground">
                    {p.name.split(' ').map(s => s[0]).join('').slice(0,2)}
                  </div>
                  <span className={cx('flex-1 text-sm truncate', p.you ? 'font-semibold' : '')}>
                    {p.name}{p.you && <span className="text-[10px] text-primary ml-1.5">YOU</span>}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{p.xp.toLocaleString()}</span>
                </li>
              ))}
            </ol>
            <button className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground py-1.5">
              See full ranking →
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function heatColor(v) {
  return [
    'bg-muted',
    'bg-primary/15',
    'bg-primary/30',
    'bg-primary/55',
    'bg-primary/85',
  ][v] || 'bg-muted';
}

function SmallStat({ label, value, sub, icon, tone }) {
  const tones = {
    primary: 'bg-primary/15 text-primary',
    amber:   'bg-amber-500/15 text-amber-500',
    default: 'bg-muted text-muted-foreground',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <span className={cx('h-6 w-6 rounded-md grid place-items-center', tones[tone] || tones.default)}>
            <Icon name={icon} className="w-3 h-3" />
          </span>
        )}
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      </div>
      <p className="font-display text-xl font-bold tabular-nums leading-none" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function MasteryRing({ name, mastery }) {
  const r = 22, c = 2 * Math.PI * r;
  const offset = c - (mastery / 100) * c;
  const colorClass = mastery >= 90 ? 'stroke-emerald-500'
    : mastery >= 70 ? 'stroke-primary'
    : mastery >= 50 ? 'stroke-amber-500'
    : 'stroke-rose-500';
  return (
    <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
      <div className="relative">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r={r} className="fill-none stroke-border" strokeWidth="4" />
          <circle cx="28" cy="28" r={r} className={cx('fill-none transition-all', colorClass)}
            strokeWidth="4" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-mono text-[10px] tabular-nums font-semibold">{mastery}</span>
      </div>
      <span className="font-display text-sm font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{name}</span>
    </div>
  );
}

window.HistoryScreen = HistoryScreen;
