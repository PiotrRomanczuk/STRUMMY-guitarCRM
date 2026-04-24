'use client';

import { BrowserFrame } from './landing-primitives';

const STRINGS = 6;
const FRETS = 15;
const NOTE_NAMES = ['E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#'];
const OPEN_TUNING = [4, 11, 7, 2, 9, 4]; // E B G D A E (semitone indices)

// A minor pentatonic: A C D E G
const SCALE_NOTES = [9, 0, 2, 4, 7]; // A, C, D, E, G
const ROOT = 9; // A

function getNoteAt(string: number, fret: number): number {
  return (OPEN_TUNING[string] + fret) % 12;
}

function isInScale(note: number): boolean {
  return SCALE_NOTES.includes(note);
}

function isRoot(note: number): boolean {
  return note === ROOT;
}

const CAGED = ['C', 'A', 'G', 'E', 'D'];

export function LandingFretboardScreenshot() {
  const fretW = 52;
  const stringGap = 18;
  const padTop = 28;
  const padLeft = 32;
  const boardW = padLeft + FRETS * fretW + 20;
  const boardH = padTop + (STRINGS - 1) * stringGap + 28;

  return (
    <BrowserFrame url="app.strummy.app/fretboard" height={480}>
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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div
                className="font-mono text-[10px] uppercase tracking-[0.14em]"
                style={{ color: 'var(--l-ink-4)' }}
              >
                Fretboard · Theory
              </div>
              <div className="mt-0.5 font-serif text-lg font-normal tracking-[-0.02em]">
                A Minor Pentatonic
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px]"
                style={{
                  borderColor: 'var(--l-rule)',
                  background: 'var(--l-card)',
                  color: 'var(--l-ink-3)',
                }}
              >
                Root:{' '}
                <span className="font-medium" style={{ color: 'var(--l-ink)' }}>
                  A
                </span>{' '}
                ▾
              </div>
              <div
                className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px]"
                style={{
                  borderColor: 'var(--l-rule)',
                  background: 'var(--l-card)',
                  color: 'var(--l-ink-3)',
                }}
              >
                Scale:{' '}
                <span className="font-medium" style={{ color: 'var(--l-ink)' }}>
                  Minor Pentatonic
                </span>{' '}
                ▾
              </div>
            </div>
          </div>

          {/* CAGED positions */}
          <div className="mb-3 flex items-center gap-1.5">
            <span
              className="mr-1 font-mono text-[9px] uppercase tracking-[0.1em]"
              style={{ color: 'var(--l-ink-4)' }}
            >
              CAGED
            </span>
            {CAGED.map((c, i) => (
              <button
                key={c}
                className="rounded-md px-2.5 py-1 text-[10px] font-medium"
                style={{
                  background: i === 1 ? 'var(--l-ink)' : 'var(--l-card)',
                  color: i === 1 ? 'var(--l-paper)' : 'var(--l-ink-3)',
                  border: i === 1 ? 'none' : '1px solid var(--l-rule)',
                }}
              >
                {c}
              </button>
            ))}
            <div
              className="ml-auto flex items-center gap-3 text-[9px]"
              style={{ color: 'var(--l-ink-4)' }}
            >
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: 'var(--l-gold)' }}
                />
                Root
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: 'var(--l-ink-3)' }}
                />
                Scale note
              </span>
            </div>
          </div>

          {/* Fretboard */}
          <div
            className="overflow-x-auto overflow-y-hidden rounded-lg border"
            style={{ borderColor: 'var(--l-rule)', background: 'var(--l-card)' }}
          >
            <svg width={boardW} height={boardH} viewBox={`0 0 ${boardW} ${boardH}`}>
              {/* Nut */}
              <rect
                x={padLeft}
                y={padTop - 2}
                width={3}
                height={(STRINGS - 1) * stringGap + 4}
                fill="var(--l-ink)"
                rx={1}
              />

              {/* Fret lines */}
              {Array.from({ length: FRETS }).map((_, f) => (
                <line
                  key={f}
                  x1={padLeft + (f + 1) * fretW}
                  y1={padTop - 2}
                  x2={padLeft + (f + 1) * fretW}
                  y2={padTop + (STRINGS - 1) * stringGap + 2}
                  stroke="var(--l-rule)"
                  strokeWidth={1}
                />
              ))}

              {/* String lines */}
              {Array.from({ length: STRINGS }).map((_, s) => (
                <line
                  key={s}
                  x1={padLeft}
                  y1={padTop + s * stringGap}
                  x2={padLeft + FRETS * fretW}
                  y2={padTop + s * stringGap}
                  stroke="var(--l-ink-3)"
                  strokeWidth={1 + s * 0.15}
                  opacity={0.4}
                />
              ))}

              {/* Fret markers */}
              {[3, 5, 7, 9, 12, 15].map((f) => {
                if (f > FRETS) return null;
                const cx = padLeft + (f - 0.5) * fretW;
                const cy = padTop + ((STRINGS - 1) * stringGap) / 2;
                if (f === 12) {
                  return (
                    <g key={f}>
                      <circle cx={cx} cy={cy - 12} r={3} fill="var(--l-ink-5)" />
                      <circle cx={cx} cy={cy + 12} r={3} fill="var(--l-ink-5)" />
                    </g>
                  );
                }
                return <circle key={f} cx={cx} cy={cy} r={3} fill="var(--l-ink-5)" />;
              })}

              {/* Fret numbers */}
              {Array.from({ length: FRETS }).map((_, f) => (
                <text
                  key={f}
                  x={padLeft + (f + 0.5) * fretW}
                  y={14}
                  textAnchor="middle"
                  fontSize={8}
                  fontFamily="monospace"
                  fill="var(--l-ink-4)"
                  opacity={0.6}
                >
                  {f + 1}
                </text>
              ))}

              {/* Scale notes */}
              {Array.from({ length: STRINGS }).map((_, s) =>
                Array.from({ length: FRETS + 1 }).map((_, f) => {
                  const note = getNoteAt(s, f);
                  if (!isInScale(note)) return null;
                  if (f === 0) return null; // skip open strings for cleanliness
                  const root = isRoot(note);
                  const cx = padLeft + (f - 0.5) * fretW;
                  const cy = padTop + s * stringGap;
                  return (
                    <g key={`${s}-${f}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={9}
                        fill={root ? 'var(--l-gold)' : 'var(--l-ink-3)'}
                        opacity={root ? 1 : 0.8}
                      />
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fontSize={8}
                        fontWeight={root ? 700 : 500}
                        fill={root ? '#fff' : 'var(--l-paper)'}
                        fontFamily="monospace"
                      >
                        {NOTE_NAMES[note]}
                      </text>
                    </g>
                  );
                })
              )}
            </svg>
          </div>

          {/* Bottom controls */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border px-2.5 py-1 text-[10px]"
                style={{
                  borderColor: 'var(--l-rule)',
                  background: 'var(--l-card)',
                  color: 'var(--l-ink-3)',
                }}
              >
                Show notes
              </button>
              <button
                className="rounded-md border px-2.5 py-1 text-[10px]"
                style={{
                  borderColor: 'var(--l-gold-dim)',
                  background: 'var(--l-gold-tint)',
                  color: 'var(--l-gold-2)',
                }}
              >
                Quiz mode
              </button>
            </div>
            <div className="font-mono text-[9px]" style={{ color: 'var(--l-ink-4)' }}>
              Click any note to hear it · 5 positions available
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
