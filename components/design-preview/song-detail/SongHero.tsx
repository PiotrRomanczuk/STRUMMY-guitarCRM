import { Icon } from '@/components/design-preview/lib/icons';

import { btnGhost, btnPrimary, LI } from './helpers';
import type { SongDetailData } from './types';

const SongMeta = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 9,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.16em',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 14,
        color: 'var(--ink-2)',
        fontWeight: 500,
        marginTop: 2,
      }}
    >
      {value}
    </div>
  </div>
);

export const SongHero = ({ s }: { s: SongDetailData }) => (
  <div style={{ padding: '24px 32px 0' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 18,
        fontSize: 12,
        color: 'var(--ink-4)',
        fontFamily: 'var(--mono)',
      }}
    >
      <span style={{ cursor: 'pointer' }}>Songs</span>
      <Icon d={LI.chev} size={10} />
      <span style={{ color: 'var(--ink-2)' }}>{s.title}</span>
      <div style={{ flex: 1 }} />
      <button style={btnGhost}>
        <Icon d={LI.copy} size={12} /> Duplicate
      </button>
      <button style={btnGhost}>
        <Icon d={LI.edit} size={12} /> Edit
      </button>
      <button style={btnPrimary}>
        <Icon d={LI.plusSmall} size={12} stroke="var(--paper)" /> Assign to student
      </button>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 28,
        alignItems: 'flex-end',
      }}
    >
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #b84a3a 0%, #c89523 60%, #6d4fa0 100%)',
          boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.2), 0 12px 24px -10px rgba(0,0,0,.3)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 160 160"
          width="160"
          height="160"
          style={{ position: 'absolute', inset: 0 }}
        >
          {[60, 50, 38, 26, 14].map((r) => (
            <circle
              key={r}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke="rgba(0,0,0,.18)"
              strokeWidth="1"
            />
          ))}
          <circle cx="80" cy="80" r="6" fill="rgba(0,0,0,.4)" />
        </svg>
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 12,
            color: '#fff',
            fontFamily: 'var(--serif)',
            fontSize: 11,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          {s.album}
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 6,
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          <span style={{ color: 'var(--gold-2)' }}>Song</span>
          <span>·</span>
          <span>{s.level}</span>
          <span>·</span>
          <span>{s.year}</span>
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 64,
            letterSpacing: '-0.03em',
            lineHeight: 0.95,
            fontStyle: 'italic',
          }}
        >
          {s.title}
        </h1>
        <div
          style={{
            marginTop: 8,
            fontSize: 18,
            color: 'var(--ink-3)',
            fontFamily: 'var(--serif)',
          }}
        >
          {s.author}
        </div>
        <div style={{ marginTop: 18, display: 'flex', gap: 20, alignItems: 'center' }}>
          <SongMeta label="Key" value={s.key} />
          <SongMeta label="Capo" value={`fret ${s.capo}`} />
          <SongMeta label="Tempo" value={`${s.tempo} BPM`} />
          <SongMeta label="Time" value={s.timeSig} />
          <SongMeta label="Length" value={s.duration} />
          <div
            style={{
              width: 1,
              height: 32,
              background: 'var(--rule)',
              margin: '0 4px',
            }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {s.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  padding: '4px 9px',
                  background: 'var(--paper)',
                  border: '1px solid var(--rule)',
                  borderRadius: 99,
                  color: 'var(--ink-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
