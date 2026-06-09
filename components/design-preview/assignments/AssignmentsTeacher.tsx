'use client';

import { useMemo, useState } from 'react';

import { Icon } from '../lib/icons';
import { SidebarNav } from '../shell/SidebarNav';
import { TopBar } from '../shell/TopBar';

import { AssignmentComposer } from './AssignmentComposer';
import { AssignmentRow } from './AssignmentRow';
import { ASSIGNMENTS } from './data';
import { Card, LI_EXTRA, btnPrimary } from './primitives';
import type { Assignment, AssignmentStatusKey } from './types';

type TeacherTab = 'open' | 'review' | 'done';

const TABS: { key: TeacherTab; matches: (a: Assignment) => boolean }[] = [
  { key: 'open', matches: (a) => a.status === 'open' || a.status === 'overdue' },
  { key: 'review', matches: (a) => a.status === 'submitted' },
  { key: 'done', matches: (a) => a.status === 'done' },
];

const countByStatus = (status: AssignmentStatusKey): number =>
  ASSIGNMENTS.filter((a) => a.status === status).length;

export const AssignmentsTeacher = ({
  width = 1440,
  height = 1024,
}: {
  width?: number;
  height?: number;
}) => {
  const [tab, setTab] = useState<TeacherTab>('open');

  const rows = useMemo(() => {
    const matcher = TABS.find((t) => t.key === tab)?.matches;
    return matcher ? ASSIGNMENTS.filter(matcher) : [];
  }, [tab]);

  const stats = {
    open: countByStatus('open') + countByStatus('overdue'),
    review: countByStatus('submitted'),
    done: countByStatus('done'),
    overdue: countByStatus('overdue'),
  };

  const tabLabels: Record<TeacherTab, string> = {
    open: `Open · ${stats.open}`,
    review: `To review · ${stats.review}`,
    done: `Reviewed · ${stats.done}`,
  };

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
      <SidebarNav active="assign" />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <TopBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 60px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--ink-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '.16em',
                }}
              >
                Teaching
              </div>
              <h1
                style={{
                  margin: '4px 0 0',
                  fontFamily: 'var(--serif)',
                  fontWeight: 400,
                  fontSize: 38,
                  letterSpacing: '-0.02em',
                }}
              >
                Assignments
              </h1>
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--ink-3)' }}>
                <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{stats.review}</strong>{' '}
                awaiting review ·{' '}
                <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{stats.open}</strong>{' '}
                open · {stats.overdue} overdue
              </div>
            </div>
            <div style={{ ...btnPrimary, padding: '10px 16px' }}>
              <Icon d={LI_EXTRA.plusSmall} size={12} stroke="var(--paper)" /> New assignment
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
            <Card>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--rule)' }}>
                {TABS.map(({ key }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '14px 22px',
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                        fontSize: 13,
                        color: active ? 'var(--ink)' : 'var(--ink-4)',
                        fontWeight: active ? 500 : 400,
                        borderBottom: active ? '2px solid var(--gold-2)' : '2px solid transparent',
                        marginBottom: -1,
                      }}
                    >
                      {tabLabels[key]}
                    </button>
                  );
                })}
              </div>
              <div>
                {rows.map((a, i) => (
                  <AssignmentRow key={a.id} a={a} isLast={i === rows.length - 1} />
                ))}
                {rows.length === 0 && (
                  <div
                    style={{
                      padding: '40px 22px',
                      textAlign: 'center',
                      color: 'var(--ink-4)',
                      fontStyle: 'italic',
                      fontFamily: 'var(--serif)',
                    }}
                  >
                    Nothing in this bucket right now.
                  </div>
                )}
              </div>
            </Card>

            <AssignmentComposer />
          </div>
        </div>
      </div>
    </div>
  );
};
