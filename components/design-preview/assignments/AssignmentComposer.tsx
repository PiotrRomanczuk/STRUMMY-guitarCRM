import { Icon } from '../lib/icons';
import { STUDENTS } from '../lib/mock-data';
import { Avatar } from '../primitives/atoms';

import { AsgField, Card, CardHeader, LI_EXTRA, asgInput, btnPrimary } from './primitives';

export const AssignmentComposer = () => (
  <Card>
    <CardHeader eyebrow="Quick assign" title="New assignment" />
    <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <AsgField label="To students">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {STUDENTS.slice(0, 2).map((s) => (
            <span
              key={s.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px 4px 4px',
                background: 'var(--paper)',
                border: '1px solid var(--rule)',
                borderRadius: 99,
                fontSize: 12,
              }}
            >
              <Avatar s={s} size={18} />
              {s.name.split(' ')[0]}
              <Icon d={LI_EXTRA.close} size={10} style={{ color: 'var(--ink-4)' }} />
            </span>
          ))}
          <button
            style={{
              padding: '4px 10px',
              borderRadius: 99,
              border: '1px dashed var(--rule)',
              background: 'transparent',
              fontSize: 12,
              color: 'var(--ink-4)',
            }}
          >
            + Add
          </button>
        </div>
      </AsgField>

      <AsgField label="Song / drill">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            border: '1px solid var(--rule)',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: 'linear-gradient(135deg, var(--gold-dim), var(--gold-2))',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontFamily: 'var(--serif)',
              fontSize: 10,
              fontWeight: 500,
            }}
          >
            G
          </div>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic' }}>
            Blackbird
          </span>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--ink-4)',
              marginLeft: 'auto',
            }}
          >
            The Beatles
          </span>
        </div>
      </AsgField>

      <AsgField label="Task description">
        <textarea
          defaultValue="Bars 1–8 from memory, alternating bass clean at 60 BPM. Submit 3 takes."
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--rule)',
            borderRadius: 6,
            background: 'var(--paper)',
            fontFamily: 'var(--sans)',
            fontSize: 13,
            lineHeight: 1.5,
            minHeight: 72,
            resize: 'vertical',
            color: 'var(--ink)',
          }}
        />
      </AsgField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <AsgField label="Due">
          <input defaultValue="2026-04-30" style={asgInput} />
        </AsgField>
        <AsgField label="Daily target">
          <select defaultValue="10" style={{ ...asgInput, cursor: 'pointer' }}>
            <option>5 min/day</option>
            <option>10 min/day</option>
            <option>15 min/day</option>
            <option>20 min/day</option>
          </select>
        </AsgField>
      </div>

      <AsgField label="Submission type">
        <div style={{ display: 'flex', gap: 6 }}>
          {['Self-report', 'Audio recording', 'Video', 'Note'].map((t, i) => (
            <span
              key={t}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 12,
                background: i === 1 ? 'var(--ink)' : 'var(--paper)',
                color: i === 1 ? 'var(--paper)' : 'var(--ink-3)',
                border: '1px solid',
                borderColor: i === 1 ? 'var(--ink)' : 'var(--rule)',
                cursor: 'pointer',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </AsgField>

      <button style={{ ...btnPrimary, justifyContent: 'center', padding: '12px', marginTop: 6 }}>
        Send assignment
      </button>
    </div>
  </Card>
);
