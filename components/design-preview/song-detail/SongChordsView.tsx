import { ChordGrid } from './ChordGrid';
import { btnGhost, Card, CardHeader } from './helpers';
import type { SongDetailData } from './types';

export const SongChordsView = ({ s }: { s: SongDetailData }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <Card>
      <CardHeader
        eyebrow="Voicings"
        title={
          <>
            Chords in <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{s.title}</em>
          </>
        }
        action={<span style={btnGhost}>Print sheet</span>}
      />
      <div
        style={{
          padding: '0 24px 22px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 14,
        }}
      >
        {s.chords.map((c) => (
          <div
            key={c}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              padding: '10px 4px',
              border: '1px solid var(--rule)',
              borderRadius: 8,
              background: 'var(--paper)',
            }}
          >
            <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 500 }}>{c}</div>
            <ChordGrid name={c} size={56} />
          </div>
        ))}
      </div>
    </Card>

    <Card>
      <CardHeader eyebrow="Form" title="Sections & progressions" />
      <div
        style={{
          padding: '0 24px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {s.sections.map((sec, i) => (
          <div
            key={sec.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: 18,
              padding: '12px 0',
              borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
              borderBottom: '1px solid var(--rule)',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                }}
              >
                {sec.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--ink-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                  marginTop: 2,
                }}
              >
                {sec.bars} bars
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {sec.chords.map((c, ci) => (
                <div
                  key={`${sec.name}-${ci}`}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '8px 10px',
                    background: ci % 4 === 0 ? 'var(--gold-tint)' : 'var(--paper)',
                    border: '1px solid var(--rule)',
                    borderRadius: 6,
                    color: 'var(--ink-2)',
                    minWidth: 38,
                    textAlign: 'center',
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  </div>
);
