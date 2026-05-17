// Screen 2 — In-Quiz Question (the heart of the feature)
// Layout: hearts row, timer/progress, large fretboard, 4 multiple-choice answers.
// Mobile: vertical stack. Desktop: two-column with chord left, answers right.

const { useState: useState2 } = React;

function InQuizScreen({ density = 'mobile' }) {
  // sample state
  const hearts = 4;
  const streak = 12;
  const question = 5;
  const total = 10;
  const timer = 0.72; // 72% remaining
  const voicing = VOICINGS.Dm7;
  const options = ['Am7', 'Dm7', 'F#m7', 'Cmaj7'];
  const isMobile = density === 'mobile';

  return (
    <div className={cx('bg-background text-foreground antialiased', isMobile ? 'min-h-[844px] w-[390px]' : 'min-h-[800px] w-full')}>
      {/* Top bar: close · hearts · streak */}
      <header className={cx('flex items-center gap-3 border-b border-border/50',
        isMobile ? 'px-4 pt-3 pb-3' : 'px-10 pt-6 pb-5')}>
        <button className="h-9 w-9 grid place-items-center rounded-md hover:bg-secondary/60 -ml-2 text-muted-foreground">
          <Icon name="x" className="w-5 h-5" />
        </button>

        {/* Progress bar (question x of y) */}
        <div className="flex-1 mx-2">
          <Progress value={(question / total) * 100} className="h-2.5" indicatorClassName="bg-primary" />
        </div>

        <div className="flex items-center gap-1.5 text-rose-500">
          <Icon name="heart" className="w-5 h-5 fill-rose-500" strokeWidth={0} />
          <span className="font-semibold tabular-nums text-foreground">{hearts}</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-500">
          <Icon name="fire" className="w-5 h-5 fill-amber-500" strokeWidth={0} />
          <span className="font-semibold tabular-nums text-foreground">{streak}</span>
        </div>
      </header>

      {/* Body */}
      <div className={cx(isMobile ? 'px-4 py-6' : 'max-w-5xl mx-auto px-10 py-12 grid grid-cols-2 gap-16 items-center')}>
        {/* Question + chord */}
        <div className={cx(isMobile ? 'space-y-5' : 'space-y-7')}>
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Question {question} of {total} · Name the chord
            </p>
            <h1 className={cx('font-display font-semibold text-foreground tracking-tight',
              isMobile ? 'text-[26px] leading-tight' : 'text-4xl leading-tight')}
              style={{ fontFamily: 'var(--font-display)' }}>
              Which chord is this?
            </h1>
          </div>

          {/* Chord card */}
          <div className={cx('relative rounded-2xl border bg-card overflow-hidden',
            isMobile ? 'p-5' : 'p-8')}>
            {/* subtle gold corner glow */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />
            <div className={cx('mx-auto', isMobile ? 'max-w-[200px]' : 'max-w-[260px]')}>
              <ChordDiagram {...voicing} hideName size={isMobile ? 'lg' : 'xl'} />
            </div>

            {/* play-audio button (bottom-right of card) */}
            <button className="absolute bottom-4 right-4 h-11 w-11 rounded-full bg-secondary/80 backdrop-blur border border-border grid place-items-center hover:bg-secondary text-foreground"
              aria-label="Play chord audio">
              <Icon name="volume" className="w-5 h-5" />
            </button>
          </div>

          {/* Timer pill (only on desktop, where there's room) */}
          {!isMobile && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <Icon name="clock" className="w-3.5 h-3.5" />
              <div className="flex-1 max-w-[180px]">
                <Progress value={timer * 100} className="h-1" indicatorClassName="bg-foreground/60" />
              </div>
              <span className="tabular-nums">0:18</span>
            </div>
          )}
        </div>

        {/* Answer choices */}
        <div className={cx(isMobile ? 'space-y-3' : 'space-y-4')}>
          {!isMobile && (
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Choose one
            </p>
          )}
          <div className={cx('grid gap-3', isMobile ? 'grid-cols-2' : 'grid-cols-1')}>
            {options.map((opt, i) => (
              <AnswerChoice key={opt} index={i} label={opt} variant={isMobile ? 'compact' : 'wide'} />
            ))}
          </div>

          {/* Skip / hint row */}
          <div className={cx('flex items-center justify-between pt-2', isMobile && 'pt-4')}>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <Icon name="eye" className="w-3.5 h-3.5" /> Use a hint
            </button>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              Skip <Icon name="chevronRight" className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Answer choice — keystroke hint on desktop, big tappable on mobile
function AnswerChoice({ index, label, variant }) {
  const key = ['1', '2', '3', '4'][index];
  if (variant === 'wide') {
    return (
      <button className="group w-full flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/60 hover:bg-secondary/40 transition-colors text-left">
        <span className="h-8 w-8 rounded-md border border-border bg-secondary text-muted-foreground grid place-items-center font-mono text-xs group-hover:border-primary/40 group-hover:text-primary">
          {key}
        </span>
        <span className="font-display text-xl font-semibold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          {label}
        </span>
        <Icon name="chevronRight" className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary" />
      </button>
    );
  }
  return (
    <button className="aspect-[1.6] rounded-xl border border-border bg-card grid place-items-center hover:border-primary/60 hover:bg-secondary/40 transition-colors relative">
      <span className="absolute top-2 left-2 text-[10px] font-mono text-muted-foreground">{key}</span>
      <span className="font-display text-2xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
        {label}
      </span>
    </button>
  );
}

window.InQuizScreen = InQuizScreen;
