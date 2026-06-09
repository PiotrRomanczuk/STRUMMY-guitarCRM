import { Fragment } from 'react';

import { btnGhost, Card, CardHeader } from './helpers';
import { INTRO_TAB_MEASURES, STRING_LABELS } from './data';

export const SongTabView = () => (
  <Card>
    <CardHeader
      eyebrow="Tablature"
      title="Intro · arpeggiated figure"
      action={<span style={btnGhost}>Export PDF</span>}
    />
    <div style={{ padding: '0 24px 28px', overflow: 'auto' }}>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 13,
          lineHeight: 1.8,
          color: 'var(--ink-2)',
        }}
      >
        {STRING_LABELS.map((str, si) => (
          <div key={str} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 14, color: 'var(--ink-4)' }}>{str}</span>
            <span style={{ color: 'var(--ink-4)' }}>│</span>
            {INTRO_TAB_MEASURES.map((m, mi) => {
              const hit = m[si] !== '—';
              return (
                <Fragment key={`${str}-${mi}`}>
                  <span
                    style={{
                      minWidth: 32,
                      textAlign: 'center',
                      color: hit ? 'var(--gold-2)' : 'var(--ink-5)',
                      fontWeight: hit ? 600 : 400,
                    }}
                  >
                    {hit ? `—${m[si]}—` : '———'}
                  </span>
                  <span style={{ color: 'var(--ink-5)' }}>│</span>
                </Fragment>
              );
            })}
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 10,
            fontSize: 10,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          <span style={{ width: 14 }} />
          <span style={{ width: 6 }} />
          {INTRO_TAB_MEASURES.map((_, i) => (
            <Fragment key={i}>
              <span style={{ minWidth: 32, textAlign: 'center' }}>m. {i + 1}</span>
              <span style={{ width: 6 }} />
            </Fragment>
          ))}
        </div>
      </div>
      <div
        style={{
          marginTop: 18,
          padding: '12px 14px',
          background: 'var(--paper)',
          border: '1px dashed var(--rule)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--ink-3)',
          fontStyle: 'italic',
        }}
      >
        ↳ Travis-pick the bass-string thumb pattern under the melody. Right-hand fingering: P-I-M-A
        throughout.
      </div>
    </div>
  </Card>
);
