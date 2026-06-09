'use client';

import { useMemo, useState } from 'react';

import { SidebarNav } from '../shell/SidebarNav';
import { TopBar } from '../shell/TopBar';

import { ASSIGNMENTS } from './data';
import { AssignmentStatusPill } from './primitives';
import { StudentAssignmentDetail } from './StudentAssignmentDetail';
import type { Assignment } from './types';

const STUDENT_ID = 's1';
const INITIAL_OPEN_ID = 'A-021';

const StudentAssignmentListItem = ({
  a,
  isOpen,
  onSelect,
}: {
  a: Assignment;
  isOpen: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    style={{
      width: '100%',
      textAlign: 'left',
      padding: '14px 22px',
      borderTop: '1px solid var(--rule)',
      background: isOpen ? 'var(--card)' : 'transparent',
      border: 'none',
      cursor: 'pointer',
      position: 'relative',
      font: 'inherit',
      color: 'inherit',
    }}
  >
    {isOpen && (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: 'var(--gold-2)',
        }}
      />
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <AssignmentStatusPill status={a.status} compact />
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: a.status === 'overdue' ? 'var(--danger)' : 'var(--ink-4)',
          marginLeft: 'auto',
        }}
      >
        {a.status === 'done' ? `✓ ${a.submitted}` : `Due ${a.due.slice(5).replace('-', '/')}`}
      </span>
    </div>
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontStyle: 'italic',
        fontSize: 15,
        fontWeight: 500,
        marginBottom: 2,
      }}
    >
      {a.song}
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
    <div
      style={{
        marginTop: 8,
        height: 3,
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
  </button>
);

export const AssignmentsStudent = ({
  width = 1440,
  height = 1024,
}: {
  width?: number;
  height?: number;
}) => {
  const mine = useMemo(() => ASSIGNMENTS.filter((a) => a.student.id === STUDENT_ID), []);
  const [openId, setOpenId] = useState<string>(INITIAL_OPEN_ID);
  const cur = mine.find((a) => a.id === openId) ?? mine[0];
  const activeCount = mine.filter((a) => a.status !== 'done').length;

  if (!cur) return null;

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        background: 'var(--ivory)',
        color: 'var(--ink)',
        fontSize: 13,
        lineHeight: 1.4,
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <SidebarNav active="assign" roleLabel="Student" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar />
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
          }}
        >
          <div
            style={{
              borderRight: '1px solid var(--rule)',
              overflow: 'auto',
              background: 'var(--paper)',
            }}
          >
            <div style={{ padding: '22px 22px 14px' }}>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--ink-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '.14em',
                }}
              >
                From your teacher
              </div>
              <h1
                style={{
                  margin: '4px 0 6px',
                  fontFamily: 'var(--serif)',
                  fontWeight: 400,
                  fontSize: 26,
                  letterSpacing: '-0.02em',
                }}
              >
                Assignments
              </h1>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{activeCount} active</div>
            </div>
            {mine.map((a) => (
              <StudentAssignmentListItem
                key={a.id}
                a={a}
                isOpen={a.id === openId}
                onSelect={() => setOpenId(a.id)}
              />
            ))}
          </div>
          <StudentAssignmentDetail cur={cur} />
        </div>
      </div>
    </div>
  );
};
