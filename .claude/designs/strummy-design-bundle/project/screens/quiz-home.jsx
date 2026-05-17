// Screen 1 — Quiz Home / Start screen
// Pick quiz type, see streak/XP/daily goal/accuracy.

function QuizHomeScreen({ density = 'mobile' }) {
  const isMobile = density === 'mobile';
  const xp = 1240, xpToNext = 1500, dailyDone = 28, dailyGoal = 40;
  const accuracy = 87, streak = 12;

  const modes = [
    { id: 'name',  title: 'Name the Chord',  desc: 'See a diagram. Pick its name.', icon: 'eye',    time: '5 min' },
    { id: 'hear',  title: 'Hear the Chord',  desc: 'Listen. Identify by ear.',      icon: 'headphones', time: '5 min', badge: 'Pro' },
    { id: 'build', title: 'Build the Chord', desc: 'Place fingers on the fretboard.', icon: 'hand',    time: '8 min' },
  ];

  return (
    <div className={cx('bg-background text-foreground antialiased min-h-full',
      isMobile ? 'w-[390px] min-h-[844px]' : 'w-full')}>
      {/* Header */}
      <header className={cx('flex items-center justify-between',
        isMobile ? 'px-4 pt-6 pb-2' : 'max-w-6xl mx-auto px-10 pt-8 pb-4')}>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Skills · Chord Quiz</p>
          <h1 className={cx('font-display font-semibold tracking-tight mt-1',
            isMobile ? 'text-2xl' : 'text-3xl')}
            style={{ fontFamily: 'var(--font-display)' }}>Good evening, Maya</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="px-2.5 py-1 text-sm gap-1.5">
            <Icon name="fire" className="w-3.5 h-3.5 fill-amber-500" strokeWidth={0} />
            <span className="tabular-nums">{streak}</span>
          </Badge>
          <button className="h-9 w-9 grid place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground">
            <Icon name="settings" className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className={cx(isMobile ? 'px-4 pb-10 space-y-6' : 'max-w-6xl mx-auto px-10 pb-12 space-y-8')}>
        {/* Stats strip */}
        <div className={cx('grid gap-3', isMobile ? 'grid-cols-3' : 'grid-cols-4')}>
          <StatTile icon="zap" label="XP" value={xp.toLocaleString()} sub={`${xpToNext - xp} to level 8`} accent="primary" />
          <StatTile icon="target" label="Today" value={`${dailyDone}/${dailyGoal}`} sub="XP earned" progress={dailyDone / dailyGoal} />
          <StatTile icon="trending" label="Accuracy" value={`${accuracy}%`} sub="last 7 days" />
          {!isMobile && <StatTile icon="clock" label="Avg. response" value="2.4s" sub="−0.3s vs last week" />}
        </div>

        {/* Daily goal card */}
        <Card className={cx(isMobile ? 'p-5' : 'p-6')}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Daily goal</p>
              <p className="font-display text-lg font-semibold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                {dailyGoal - dailyDone} XP to keep your streak
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{Math.round((dailyDone/dailyGoal)*100)}%</span>
          </div>
          <Progress value={(dailyDone / dailyGoal) * 100} className="h-2.5" />
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> 2 quizzes done today</span>
            <span>·</span>
            <span>Resets at midnight</span>
          </div>
        </Card>

        {/* Mode picker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Pick a mode</h2>
            <button className="text-xs text-muted-foreground hover:text-foreground">Recently played →</button>
          </div>
          <div className={cx('grid gap-3', isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
            {modes.map((m, i) => <ModeCard key={m.id} {...m} primary={i === 0} />)}
          </div>
        </div>

        {/* Recent chords row */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Working on</h2>
            <button className="text-xs text-muted-foreground hover:text-foreground">All chords →</button>
          </div>
          <div className={cx('grid gap-3', isMobile ? 'grid-cols-3' : 'grid-cols-6')}>
            {['Dm7','F#m7','Bm','Cmaj7','G7','Fmaj7'].map((c) => (
              <div key={c} className="rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition-colors cursor-pointer">
                <div className="aspect-[0.85] mb-2">
                  <ChordDiagram {...VOICINGS[c]} hideName size="md" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{c}</span>
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">62%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, sub, accent, progress }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 relative overflow-hidden">
      {accent === 'primary' && <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />}
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <span className={cx('h-7 w-7 rounded-lg grid place-items-center',
            accent === 'primary' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
            <Icon name={icon} className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        </div>
        <p className="font-display text-2xl font-bold tabular-nums leading-none mb-1" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
        {progress !== undefined ? (
          <Progress value={progress * 100} className="h-1 mt-2" />
        ) : (
          <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
        )}
      </div>
    </div>
  );
}

function ModeCard({ title, desc, icon, time, badge, primary }) {
  return (
    <button className={cx('group relative text-left rounded-xl border bg-card p-5 transition-all overflow-hidden',
      primary ? 'border-primary/40 hover:border-primary/70 hover:shadow-lg hover:shadow-primary/5' : 'border-border hover:border-primary/40')}>
      {primary && <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />}
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <span className={cx('h-10 w-10 rounded-xl grid place-items-center',
            primary ? 'bg-primary/15 text-primary' : 'bg-secondary text-foreground')}>
            <Icon name={icon} className="w-5 h-5" />
          </span>
          {badge && <Badge variant="default" className="text-[10px]">{badge}</Badge>}
        </div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <Icon name="clock" className="w-3 h-3" /> {time}
          </span>
          <span className={cx('inline-flex items-center gap-1 text-xs font-medium',
            primary ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')}>
            Start <Icon name="arrowRight" className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

window.QuizHomeScreen = QuizHomeScreen;
