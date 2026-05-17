// Screen 4 — End-of-session summary
// Accuracy, XP, streak, mastered vs struggling, "next quiz in…" timer, share.

function SummaryScreen({ density = 'mobile' }) {
  const isMobile = density === 'mobile';
  const acc = 92, correct = 11, total = 12;
  const xpEarned = 132, streakBefore = 12, streakAfter = 13;

  const mastered = ['Am7', 'G7', 'Cmaj7'];
  const struggling = ['F#m7', 'Bm'];

  return (
    <div className={cx('bg-background text-foreground antialiased',
      isMobile ? 'w-[390px] min-h-[844px]' : 'w-full min-h-[800px]')}>
      {/* Header */}
      <header className={cx('flex items-center justify-between',
        isMobile ? 'px-4 pt-4 pb-2' : 'max-w-4xl mx-auto px-10 pt-8 pb-4')}>
        <button className="h-9 w-9 grid place-items-center rounded-md hover:bg-secondary/60 -ml-2 text-muted-foreground">
          <Icon name="x" className="w-5 h-5" />
        </button>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Session · 3:42</p>
        <button className="h-9 w-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground">
          <Icon name="share" className="w-4 h-4" />
        </button>
      </header>

      <div className={cx(isMobile ? 'px-4 pb-10 space-y-5' : 'max-w-4xl mx-auto px-10 pb-12 space-y-6')}>
        {/* Hero stat: accuracy */}
        <div className="text-center pt-2 pb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2">Session complete</p>
          <p className={cx('font-display font-bold tracking-tight tabular-nums leading-none text-primary',
            isMobile ? 'text-[88px]' : 'text-[140px]')}
            style={{ fontFamily: 'var(--font-display)', fontFeatureSettings: '"tnum","lnum"' }}>
            {acc}<span className={cx('font-normal text-muted-foreground', isMobile ? 'text-3xl' : 'text-5xl')}>%</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{correct} of {total} correct</p>
        </div>

        {/* Three pill stats */}
        <div className="grid grid-cols-3 gap-3">
          <PillStat icon="zap" value={`+${xpEarned}`} label="XP earned" tone="primary" />
          <PillStat icon="fire" value={streakAfter} label="day streak" tone="amber" sub={`+1 from ${streakBefore}`} />
          <PillStat icon="clock" value="2.1s" label="avg response" sub="−0.4s" />
        </div>

        {/* Mastery sections */}
        <div className="grid gap-3">
          <MasteryCard variant="up" title="Mastered" subtitle="Accuracy ≥ 90% across 3 sessions" chords={mastered} />
          <MasteryCard variant="down" title="Need work" subtitle="Accuracy dipped below 60%" chords={struggling} />
        </div>

        {/* Question-by-question dots */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">This session</p>
            <button className="text-xs text-muted-foreground hover:text-foreground">Review all →</button>
          </div>
          <div className="flex gap-1.5">
            {[1,1,1,1,0,1,1,1,1,0,1,1].map((c, i) => (
              <div key={i} className={cx('flex-1 h-8 rounded-md flex items-center justify-center font-mono text-[10px]',
                c ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-500 border border-rose-500/20')}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Next session timer */}
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/8 to-transparent p-4 flex items-center gap-3">
          <Icon name="clock" className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <p className="font-display text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Next quiz unlocks in 3h 24m</p>
            <p className="text-xs text-muted-foreground mt-0.5">Spaced repetition · Comes back stronger</p>
          </div>
          <Button variant="outline" size="sm">Notify me</Button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" size="lg" className="h-12">
            <Icon name="refresh" className="w-4 h-4" /> Play again
          </Button>
          <Button size="lg" className="h-12 font-semibold">
            Continue <Icon name="arrowRight" className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function PillStat({ icon, value, label, sub, tone }) {
  const tones = {
    primary: 'text-primary',
    amber: 'text-amber-500',
    default: 'text-foreground',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <Icon name={icon} className={cx('w-4 h-4 mx-auto mb-2', tones[tone] || tones.default)} strokeWidth={tone === 'amber' ? 0 : 2}
        {...(tone === 'amber' ? { className: 'w-4 h-4 mx-auto mb-2 text-amber-500 fill-amber-500' } : {})} />
      <p className={cx('font-display text-2xl font-bold tabular-nums leading-none', tones[tone] || tones.default)}
        style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-1.5 font-medium">{label}</p>
      {sub && <p className="text-[10px] text-emerald-500 mt-1 font-mono">{sub}</p>}
    </div>
  );
}

function MasteryCard({ variant, title, subtitle, chords }) {
  const up = variant === 'up';
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={cx('h-6 w-6 rounded-md grid place-items-center text-xs',
          up ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500')}>
          {up ? <Icon name="trending" className="w-3.5 h-3.5" /> : <Icon name="trending" className="w-3.5 h-3.5 rotate-180" />}
        </span>
        <p className="font-display text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{title}</p>
        <span className="text-xs text-muted-foreground ml-auto">{subtitle}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar">
        {chords.map((c) => (
          <div key={c} className="shrink-0 rounded-lg border border-border bg-secondary/40 p-2 w-[78px]">
            <ChordDiagram {...VOICINGS[c]} hideName size="sm" />
            <p className="font-display text-xs font-semibold text-center mt-1" style={{ fontFamily: 'var(--font-display)' }}>{c}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

window.SummaryScreen = SummaryScreen;
