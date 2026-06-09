import { Card, CardHeader } from './helpers';
import type { LyricChord } from './types';

const LyricLine = ({ chords, text }: { chords: LyricChord[]; text: string }) => (
  <div style={{ position: 'relative', height: 48, marginBottom: 6 }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18 }}>
      {chords.map((c) => (
        <span
          key={`${c.c}-${c.pos}`}
          style={{
            position: 'absolute',
            left: `${c.pos}ch`,
            fontFamily: 'var(--serif)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--gold-2)',
          }}
        >
          {c.c}
        </span>
      ))}
    </div>
    <div style={{ position: 'absolute', top: 20, left: 0, right: 0 }}>{text}</div>
  </div>
);

const VERSE_1: { chords: LyricChord[]; text: string }[] = [
  {
    chords: [
      { c: 'Bm', pos: 0 },
      { c: 'F#7', pos: 18 },
    ],
    text: 'On a dark desert highway, cool wind in my hair',
  },
  {
    chords: [
      { c: 'A', pos: 0 },
      { c: 'E', pos: 18 },
    ],
    text: 'Warm smell of colitas, rising up through the air',
  },
  {
    chords: [
      { c: 'G', pos: 0 },
      { c: 'D', pos: 18 },
    ],
    text: 'Up ahead in the distance, I saw a shimmering light',
  },
  {
    chords: [
      { c: 'Em', pos: 0 },
      { c: 'F#7', pos: 14 },
    ],
    text: 'My head grew heavy and my sight grew dim',
  },
];

export const SongLyricsView = () => (
  <Card>
    <CardHeader eyebrow="Lyrics + chord positioning" title="Verse 1" />
    <div
      style={{
        padding: '0 24px 28px',
        fontFamily: 'var(--mono)',
        fontSize: 13,
        lineHeight: 2.4,
        color: 'var(--ink-2)',
      }}
    >
      {VERSE_1.map((line, i) => (
        <LyricLine key={i} chords={line.chords} text={line.text} />
      ))}
      <div
        style={{
          marginTop: 18,
          padding: '12px 16px',
          fontFamily: 'var(--sans)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--ink-4)',
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 8,
        }}
      >
        Lyrics shown with permission · licensed via LyricFind. Chord positions auto-aligned from
        teacher input.
      </div>
    </div>
  </Card>
);
