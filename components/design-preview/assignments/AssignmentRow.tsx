import { Avatar } from '../primitives/atoms';

import { AssignmentStatusPill } from './primitives';
import type { Assignment } from './types';

type AssignmentRowProps = {
  a: Assignment;
  isLast: boolean;
};

export const AssignmentRow = ({ a, isLast }: AssignmentRowProps) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr 100px 110px 120px',
      gap: 14,
      padding: '14px 22px',
      alignItems: 'center',
      borderBottom: isLast ? 'none' : '1px solid var(--rule)',
      cursor: 'pointer',
    }}
  >
    <Avatar s={a.student} size={32} />
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{a.student.name.split(' ')[0]}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>·</span>
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14 }}>
          {a.song}
        </span>
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--ink-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {a.task}
      </div>
    </div>
    <div>
      <div
        style={{
          height: 4,
          background: 'var(--rule)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${a.progress}%`,
            height: '100%',
            background: a.progress >= 100 ? 'var(--success)' : 'var(--gold-2)',
          }}
        />
      </div>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-4)',
          marginTop: 3,
        }}
      >
        {a.progress}% · last {a.lastPractice}
      </div>
    </div>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 12,
        color: a.status === 'overdue' ? 'var(--danger)' : 'var(--ink-3)',
      }}
    >
      Due {a.due.slice(5).replace('-', '/')}
    </div>
    <AssignmentStatusPill status={a.status} compact />
  </div>
);
