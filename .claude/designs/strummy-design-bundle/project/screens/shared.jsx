// Shared UI primitives matching Strummy's design system
// (shadcn/ui + Tailwind 4, dark "Virtuoso's Studio" + warm-ivory light mode)

const { useState, useEffect, useRef } = React;

// ─── Utilities ─────────────────────────────────────────────────────────
const cx = (...c) => c.filter(Boolean).join(' ');

// ─── Lucide icon helper (renders an SVG path by name) ──────────────────
// We use inline SVGs (Lucide-compatible 24x24, stroke 2) to avoid a runtime.
const Icon = ({ name, className = 'w-4 h-4', strokeWidth = 2 }) => {
  const paths = {
    flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
    zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
    heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z',
    target: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    play: 'M6 3 20 12 6 21z',
    volume: 'M11 4.7 6.7 9H3v6h3.7L11 19.3zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14',
    headphones: 'M3 18v-6a9 9 0 0 1 18 0v6 M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z',
    hand: 'M18 11V6a2 2 0 0 0-4 0v5 M14 10V4a2 2 0 0 0-4 0v6 M10 10.5V6a2 2 0 0 0-4 0v8 M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
    check: 'M20 6 9 17l-5-5',
    x: 'M18 6 6 18 M6 6l12 12',
    chevronRight: 'm9 18 6-6-6-6',
    chevronLeft: 'm15 18-6-6 6-6',
    arrowRight: 'M5 12h14 M12 5l7 7-7 7',
    trophy: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17a2 2 0 0 1-.4 1.2L8 21h8l-1.6-2.8A2 2 0 0 1 14 17v-2.34 M18 2H6v7a6 6 0 0 0 12 0z',
    share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13',
    moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79',
    sun: 'M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41 M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10',
    clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z M12 6v6l4 2',
    music: 'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    sparkles: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z M5 3v4 M19 17v4 M3 5h4 M17 19h4',
    settings: 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    trending: 'm22 7-8.5 8.5-5-5L2 17 M16 7h6v6',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13A4 4 0 0 1 16 11',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54z',
    bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
    eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z',
    book: 'M2 19V5a2 2 0 0 1 2-2h15a1 1 0 0 1 1 1v15 M2 19a2 2 0 0 0 2 2h16 M5 21V8h13',
    chord: 'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
    refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15 6.7L3 16 M3 21v-5h5',
    fire: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]?.split(' M').map((p, i) => (
        <path key={i} d={(i === 0 ? '' : 'M') + p} />
      ))}
    </svg>
  );
};

// ─── shadcn-style primitives ───────────────────────────────────────────
const Card = ({ className, children, ...p }) => (
  <div className={cx('rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...p}>
    {children}
  </div>
);

const Button = ({ variant = 'default', size = 'default', className, children, ...p }) => {
  const v = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-border bg-transparent hover:bg-secondary/60',
    ghost: 'hover:bg-secondary/60',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  }[variant];
  const s = {
    sm: 'h-8 px-3 text-sm',
    default: 'h-9 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
    icon: 'h-9 w-9 p-0',
  }[size];
  return (
    <button className={cx('inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50', v, s, className)} {...p}>
      {children}
    </button>
  );
};

const Badge = ({ variant = 'default', className, children }) => {
  const v = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-muted text-muted-foreground border border-border',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    outline: 'border border-border text-foreground',
  }[variant];
  return <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', v, className)}>{children}</span>;
};

const Progress = ({ value = 0, className, indicatorClassName }) => (
  <div className={cx('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
    <div className={cx('h-full rounded-full bg-primary transition-all', indicatorClassName)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

// ─── ChordDiagram — Fender-Play-style fretboard SVG ────────────────────
// Shows finger dots, muted/open indicators above the nut, fret numbers.
function ChordDiagram({ name, frets, fingers, baseFret = 1, size = 'lg', hideName = false, accent = 'primary' }) {
  const widths = { sm: 96, md: 140, lg: 220, xl: 280 };
  const W = widths[size];
  const STRINGS = 6;
  const FRETS_SHOWN = 5;
  const padX = W * 0.12;
  const padTop = W * 0.18;
  const gridW = W - padX * 2;
  const gridH = W * 1.12;
  const stringGap = gridW / (STRINGS - 1);
  const fretGap = gridH / FRETS_SHOWN;
  const dotR = stringGap * 0.36;
  const isNutPosition = baseFret === 1;
  const dotFill = accent === 'primary' ? 'fill-primary' : 'fill-foreground';

  return (
    <svg viewBox={`0 0 ${W} ${gridH + padTop + 28}`} className="w-full h-auto" aria-label={`${name} chord diagram`}>
      {/* Chord name */}
      {!hideName && (
        <text x={W / 2} y={padTop * 0.55} textAnchor="middle" className="fill-foreground font-display"
          style={{ fontSize: W * 0.13, fontWeight: 700, fontFamily: 'var(--font-display, ui-serif)' }}>
          {name}
        </text>
      )}

      {/* Open/muted indicators above nut */}
      {frets.map((f, i) => {
        const x = padX + i * stringGap;
        const y = padTop - 8;
        if (f === null) return <text key={`m${i}`} x={x} y={y} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: stringGap * 0.55, fontWeight: 600 }}>×</text>;
        if (f === 0) return <circle key={`o${i}`} cx={x} cy={y - stringGap * 0.05} r={dotR * 0.55} className="fill-none stroke-muted-foreground" strokeWidth="1.5" />;
        return null;
      })}

      {/* Nut (thick line) or fret indicator */}
      {isNutPosition ? (
        <rect x={padX - 1} y={padTop} width={gridW + 2} height={W * 0.022} className="fill-foreground" />
      ) : (
        <text x={padX - 10} y={padTop + fretGap * 0.6} textAnchor="end" className="fill-muted-foreground font-mono" style={{ fontSize: 11 }}>{baseFret}fr</text>
      )}

      {/* Strings */}
      {Array.from({ length: STRINGS }).map((_, i) => (
        <line key={`s${i}`} x1={padX + i * stringGap} y1={padTop} x2={padX + i * stringGap} y2={padTop + gridH}
          className="stroke-border" strokeWidth={i === 0 || i === 5 ? 1.5 : 1} />
      ))}

      {/* Frets */}
      {Array.from({ length: FRETS_SHOWN + 1 }).map((_, i) => (
        <line key={`f${i}`} x1={padX} y1={padTop + i * fretGap} x2={padX + gridW} y2={padTop + i * fretGap}
          className="stroke-border" strokeWidth="1" />
      ))}

      {/* Finger dots */}
      {frets.map((f, i) => {
        if (f === null || f === 0) return null;
        const relativeFret = f - baseFret + 1;
        if (relativeFret < 1 || relativeFret > FRETS_SHOWN) return null;
        const cx = padX + i * stringGap;
        const cy = padTop + (relativeFret - 0.5) * fretGap;
        const finger = fingers?.[i];
        return (
          <g key={`d${i}`}>
            <circle cx={cx} cy={cy} r={dotR} className={dotFill} />
            {finger ? (
              <text x={cx} y={cy + dotR * 0.4} textAnchor="middle"
                className="fill-primary-foreground" style={{ fontSize: dotR * 1.05, fontWeight: 700 }}>
                {finger}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* String labels (E A D G B E) */}
      {['E', 'A', 'D', 'G', 'B', 'E'].map((s, i) => (
        <text key={`l${i}`} x={padX + i * stringGap} y={padTop + gridH + 18} textAnchor="middle"
          className="fill-muted-foreground font-mono" style={{ fontSize: stringGap * 0.4, letterSpacing: 0.5 }}>
          {s}
        </text>
      ))}
    </svg>
  );
}

// ─── Chord voicings (real, from Strummy's lib/music-theory) ────────────
const VOICINGS = {
  C:      { name: 'C',      frets: [null, 3, 2, 0, 1, 0],   fingers: [null, 3, 2, 0, 1, 0] },
  A:      { name: 'A',      frets: [null, 0, 2, 2, 2, 0],   fingers: [null, 0, 1, 2, 3, 0] },
  G:      { name: 'G',      frets: [3, 2, 0, 0, 0, 3],      fingers: [2, 1, 0, 0, 0, 3] },
  E:      { name: 'E',      frets: [0, 2, 2, 1, 0, 0],      fingers: [0, 2, 3, 1, 0, 0] },
  D:      { name: 'D',      frets: [null, null, 0, 2, 3, 2],fingers: [null, null, 0, 1, 3, 2] },
  Am:     { name: 'Am',     frets: [null, 0, 2, 2, 1, 0],   fingers: [null, 0, 2, 3, 1, 0] },
  Em:     { name: 'Em',     frets: [0, 2, 2, 0, 0, 0],      fingers: [0, 2, 3, 0, 0, 0] },
  Dm:     { name: 'Dm',     frets: [null, null, 0, 2, 3, 1],fingers: [null, null, 0, 2, 3, 1] },
  Dm7:    { name: 'Dm7',    frets: [null, null, 0, 2, 1, 1],fingers: [null, null, 0, 2, 1, 1] },
  Am7:    { name: 'Am7',    frets: [null, 0, 2, 0, 1, 0],   fingers: [null, 0, 2, 0, 1, 0] },
  Cmaj7:  { name: 'Cmaj7',  frets: [null, 3, 2, 0, 0, 0],   fingers: [null, 3, 2, 0, 0, 0] },
  Fmaj7:  { name: 'Fmaj7',  frets: [null, null, 3, 2, 1, 0],fingers: [null, null, 3, 2, 1, 0] },
  Dmaj7:  { name: 'Dmaj7',  frets: [null, null, 0, 2, 2, 2],fingers: [null, null, 0, 1, 2, 3] },
  F:      { name: 'F',      frets: [1, 3, 3, 2, 1, 1],      fingers: [1, 3, 4, 2, 1, 1] },
  Bm:     { name: 'Bm',     frets: [null, 2, 4, 4, 3, 2],   fingers: [null, 1, 3, 4, 2, 1], baseFret: 2 },
  'F#m7': { name: 'F#m7',   frets: [2, 4, 2, 2, 2, 2],      fingers: [1, 3, 1, 1, 1, 1], baseFret: 2 },
  G7:     { name: 'G7',     frets: [3, 2, 0, 0, 0, 1],      fingers: [3, 2, 0, 0, 0, 1] },
  E7:     { name: 'E7',     frets: [0, 2, 0, 1, 0, 0],      fingers: [0, 2, 0, 1, 0, 0] },
  'F#maj7':{name: 'F#maj7', frets: [2, 4, 3, 3, 2, null],   fingers: [1, 4, 2, 3, 1, null], baseFret: 2 },
};

// Make available globally for other Babel script files
Object.assign(window, { cx, Icon, Card, Button, Badge, Progress, ChordDiagram, VOICINGS });
