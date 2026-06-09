'use client';

import { useMemo, useState, type CSSProperties } from 'react';

import { Avatar } from '../primitives/atoms';
import { SONG_STATUS } from '../primitives/StatusPill';

import { Icon } from '../lib/icons';

import { formatLessonDate, formatLessonTime, LESSONS, LESSON_STATUS } from './data';
import { FilterChip, LessonStatusPill } from './LessonPrimitives';
import { btnGhost, btnPrimary, LI, selectSm } from './styles';
import type { LessonRole, LessonStatusKey } from './types';

type SortOrder = 'newest' | 'oldest';

type LessonListProps = {
  role?: LessonRole;
  onOpen?: (id: string) => void;
  onCreate?: () => void;
};

export const LessonList = ({ role = 'teacher', onOpen, onCreate }: LessonListProps) => {
  const [statusFilter, setStatusFilter] = useState<Set<LessonStatusKey>>(
    new Set<LessonStatusKey>(['scheduled', 'in_progress', 'completed', 'cancelled'])
  );
  const [yearFilter, setYearFilter] = useState<string>('2026');
  const [sort, setSort] = useState<SortOrder>('newest');

  const toggleStatus = (k: LessonStatusKey) => {
    const n = new Set(statusFilter);
    if (n.has(k)) n.delete(k);
    else n.add(k);
    setStatusFilter(n);
  };

  const rows = useMemo(() => {
    let r = LESSONS.filter((l) => statusFilter.has(l.status));
    r = r.filter((l) => String(new Date(l.scheduledAt).getFullYear()) === yearFilter);
    r.sort((a, b) =>
      sort === 'newest'
        ? new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        : new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
    return r;
  }, [statusFilter, yearFilter, sort]);

  const canCreate = role !== 'student';
  const showStudent = role !== 'student';
  const showTeacher = role !== 'teacher';

  const gridCols = `88px 2.3fr ${showStudent ? '1.3fr ' : ''}${
    showTeacher ? '1.3fr ' : ''
  }1fr 110px 120px 60px`;

  const headerCellStyle: CSSProperties = {
    fontFamily: 'var(--mono)',
    fontSize: 10,
    color: 'var(--ink-4)',
    textTransform: 'uppercase',
    letterSpacing: '.14em',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: '28px 32px 20px', background: 'var(--ivory)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                color: 'var(--ink-4)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '.16em',
                fontFamily: 'var(--mono)',
              }}
            >
              {role === 'student'
                ? 'Your lessons'
                : role === 'admin'
                  ? 'All studio lessons'
                  : 'Teaching'}
            </div>
            <h1
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--serif)',
                fontWeight: 400,
                fontSize: 34,
                letterSpacing: '-0.02em',
              }}
            >
              Lessons
            </h1>
            <div style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 6 }}>
              {rows.length} {rows.length === 1 ? 'lesson' : 'lessons'} · sorted by{' '}
              {sort === 'newest' ? 'newest first' : 'oldest first'}
            </div>
          </div>
          {canCreate && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={btnGhost}>
                <Icon d={LI.copy} size={12} /> Recurring…
              </button>
              <button onClick={onCreate} style={btnPrimary}>
                <Icon d={LI.plusSmall} size={12} stroke="var(--paper)" /> New lesson
              </button>
            </div>
          )}
        </div>

        {/* Filter row */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            padding: '10px 14px',
            background: 'var(--card)',
            border: '1px solid var(--rule)',
            borderRadius: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: 'var(--ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              fontFamily: 'var(--mono)',
              marginRight: 4,
            }}
          >
            Status
          </span>
          {(
            Object.entries(LESSON_STATUS) as Array<
              [LessonStatusKey, (typeof LESSON_STATUS)[LessonStatusKey]]
            >
          ).map(([k, s]) => (
            <FilterChip
              key={k}
              active={statusFilter.has(k)}
              onClick={() => toggleStatus(k)}
              color={s.color}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
              {s.label}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
                {LESSONS.filter((l) => l.status === k).length}
              </span>
            </FilterChip>
          ))}
          <div style={{ width: 1, height: 20, background: 'var(--rule)', margin: '0 6px' }} />
          <span
            style={{
              fontSize: 11,
              color: 'var(--ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              fontFamily: 'var(--mono)',
              marginRight: 4,
            }}
          >
            Year
          </span>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={selectSm}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <div style={{ flex: 1 }} />
          <button onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')} style={btnGhost}>
            <Icon d={LI.sort} size={12} />
            {sort === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 32px 40px' }}>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--rule)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {/* header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              gap: 16,
              padding: '12px 20px',
              borderBottom: '1px solid var(--rule)',
              background: 'var(--rule-2)',
              ...headerCellStyle,
            }}
          >
            <span>Date</span>
            <span>Lesson</span>
            {showStudent && <span>Student</span>}
            {showTeacher && <span>Teacher</span>}
            <span>Songs</span>
            <span>Time</span>
            <span>Status</span>
            <span />
          </div>
          {rows.map((l, idx) => {
            const d = formatLessonDate(l.scheduledAt);
            return (
              <div
                key={l.id}
                onClick={() => onOpen && onOpen(l.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridCols,
                  gap: 16,
                  padding: '16px 20px',
                  borderBottom: idx < rows.length - 1 ? '1px solid var(--rule)' : 'none',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background .12s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--rule-2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {/* date */}
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--gold-2)',
                      textTransform: 'uppercase',
                      letterSpacing: '.12em',
                      fontWeight: 500,
                    }}
                  >
                    {d.mon} {d.day}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.1em',
                      marginTop: 2,
                    }}
                  >
                    {d.wday} · {d.year}
                  </div>
                </div>
                {/* lesson title + number */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        padding: '2px 6px',
                        background: 'var(--rule-2)',
                        borderRadius: 4,
                      }}
                    >
                      #{l.number}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--serif)',
                        fontSize: 15,
                        fontWeight: 500,
                        fontStyle: l.title ? 'normal' : 'italic',
                        color: l.title ? 'var(--ink)' : 'var(--ink-4)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {l.title || 'Untitled lesson'}
                    </span>
                  </div>
                  {l.notes && (
                    <div
                      style={{
                        color: 'var(--ink-4)',
                        fontSize: 12,
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {l.notes}
                    </div>
                  )}
                </div>
                {/* student */}
                {showStudent && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Avatar s={l.student} size={24} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {l.student.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}
                      >
                        {l.student.level}
                      </div>
                    </div>
                  </div>
                )}
                {/* teacher (admin/student) */}
                {showTeacher && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: l.teacher.color,
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {l.teacher.avatar}
                    </div>
                    <span style={{ fontSize: 13 }}>{l.teacher.name}</span>
                  </div>
                )}
                {/* songs mini */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>
                    {l.songs.length}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                    {l.songs.length === 1 ? 'song' : 'songs'}
                  </span>
                  {l.songs.length > 0 && (
                    <span style={{ display: 'inline-flex', gap: 2, marginLeft: 2 }}>
                      {l.songs.slice(0, 4).map((s, i) => {
                        const pc = SONG_STATUS[s.progress].color;
                        return (
                          <span
                            key={i}
                            style={{ width: 4, height: 4, borderRadius: '50%', background: pc }}
                          />
                        );
                      })}
                    </span>
                  )}
                </div>
                {/* time */}
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)' }}>
                  {formatLessonTime(l.scheduledAt)}
                  <span style={{ color: 'var(--ink-4)' }}> · {l.duration}m</span>
                </div>
                {/* status */}
                <LessonStatusPill status={l.status} compact />
                {/* action */}
                <div style={{ textAlign: 'right' }}>
                  <Icon d={LI.chev} size={14} style={{ color: 'var(--ink-4)' }} />
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--ink-4)' }}>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 18,
                  fontStyle: 'italic',
                  marginBottom: 6,
                }}
              >
                Nothing here yet.
              </div>
              <div style={{ fontSize: 12 }}>Adjust filters or create a new lesson.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
