// Screen 3 — Correct/Incorrect feedback overlay
// Animated overlay revealing the answer, with audio playback + Continue CTA.

function FeedbackOverlay({ density = 'mobile', state = 'correct' }) {
  const isMobile = density === 'mobile';
  const correct = state === 'correct';
  const voicing = VOICINGS.Dm7;

  // Framer Motion description (in real app):
  // - Backdrop fades in 0→1, duration 0.18s, ease "easeOut"
  // - Card slides up 24px → 0, opacity 0→1, spring(stiffness 320, damping 28)
  // - Chord name letter-by-letter stagger (0.04s per char) on correct
  // - Heart bounce (scale 1 → 1.2 → 1) on incorrect

  return (
    <div className={cx('relative bg-background', isMobile ? 'w-[390px] min-h-[844px]' : 'w-full min-h-[800px]')}>
      {/* Dimmed question behind */}
      <div className="absolute inset-0 opacity-30 pointer-events-none blur-[2px]">
        <InQuizScreen density={density} />
      </div>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />

      {/* Sheet docked to bottom (mobile) / modal (desktop) */}
      <div className={cx('absolute inset-x-0 bottom-0', isMobile ? '' : 'inset-y-0 flex items-center justify-center')}>
        <div className={cx(
          'relative bg-card border-t-2 shadow-2xl',
          correct ? 'border-emerald-500' : 'border-rose-500',
          isMobile ? 'rounded-t-3xl px-5 pt-6 pb-8' : 'rounded-2xl border max-w-xl w-full mx-auto p-8'
        )}>
          {/* Top: status row */}
          <div className="flex items-center gap-3 mb-5">
            <span className={cx('h-12 w-12 rounded-2xl grid place-items-center',
              correct ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500')}>
              <Icon name={correct ? 'check' : 'x'} className="w-6 h-6" strokeWidth={2.5} />
            </span>
            <div className="flex-1">
              <p className={cx('font-display text-2xl font-bold tracking-tight',
                correct ? 'text-emerald-500' : 'text-rose-500')} style={{ fontFamily: 'var(--font-display)' }}>
                {correct ? 'Nailed it' : 'Not quite'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {correct ? '+12 XP · 1.8s response' : 'Lost 1 heart · 4 left'}
              </p>
            </div>
            {correct && (
              <div className="flex items-center gap-1 text-amber-500">
                <Icon name="fire" className="w-4 h-4 fill-amber-500" strokeWidth={0} />
                <span className="font-semibold text-foreground tabular-nums text-sm">13</span>
              </div>
            )}
          </div>

          {/* Reveal: chord name + diagram */}
          <div className={cx('rounded-xl bg-secondary/40 border border-border/60 p-4 flex items-center gap-4',
            isMobile ? '' : 'p-6 gap-6')}>
            <div className={cx(isMobile ? 'w-20 shrink-0' : 'w-28 shrink-0')}>
              <ChordDiagram {...voicing} hideName size="md" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                {correct ? 'You picked' : 'Correct answer'}
              </p>
              <p className="font-display text-3xl font-bold tracking-tight leading-none mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                Dm7
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                D minor seventh · open position · 4 strings
              </p>
              {!correct && (
                <p className="text-xs text-rose-500 mt-2">You picked <span className="font-semibold">Am7</span></p>
              )}
            </div>
            <button className="h-10 w-10 rounded-full bg-card border border-border grid place-items-center hover:border-primary/50 shrink-0"
              aria-label="Play the chord">
              <Icon name="play" className="w-4 h-4 fill-foreground" strokeWidth={0} />
            </button>
          </div>

          {/* Tip / context */}
          <div className="mt-4 flex gap-3 text-xs text-muted-foreground">
            <Icon name="sparkles" className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
            <p className="leading-relaxed">
              {correct
                ? 'Dm7 shares a shape with Dm — same bottom four strings, just one finger lifted.'
                : 'Am7 has an open A-string; Dm7 is muted to the low E and A. Listen for the lower root.'}
            </p>
          </div>

          {/* Continue button — primary action, full-width on mobile */}
          <Button size="lg" className="w-full mt-6 h-12 text-base font-semibold">
            Continue <Icon name="arrowRight" className="w-4 h-4" />
          </Button>
          <p className="text-center text-[11px] text-muted-foreground mt-3 font-mono">
            <span className="px-1.5 py-0.5 bg-secondary border border-border rounded text-[10px]">Space</span> to continue
          </p>
        </div>
      </div>
    </div>
  );
}

window.FeedbackOverlay = FeedbackOverlay;
