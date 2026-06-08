'use client';

import { useState } from 'react';
import { OnboardShell } from './OnboardShell';
import { OnbHeader, OnbField, OnbNextBar } from './OnboardPrimitives';
import { ONB_STUDENT_STEPS, LEVEL_OPTIONS, GOAL_OPTIONS, PRACTICE_TARGETS } from './data';
import type { LevelKey } from './types';

type OnboardStudentProps = {
  width?: number;
  height?: number;
};

export function OnboardStudent({ width = 1280, height = 800 }: OnboardStudentProps) {
  const [level, setLevel] = useState<LevelKey>('intermediate');
  const [goals, setGoals] = useState<Set<string>>(new Set(['fingerstyle', 'classics']));

  const toggle = (k: string) => {
    setGoals((g) => {
      const n = new Set(g);
      if (n.has(k)) {
        n.delete(k);
      } else {
        n.add(k);
      }
      return n;
    });
  };

  return (
    <OnboardShell
      role="Student"
      steps={ONB_STUDENT_STEPS}
      current={1}
      width={width}
      height={height}
    >
      <OnbHeader
        eyebrow="Step 2 of 4"
        title="Where are you with guitar?"
        sub="Be honest — this just helps us recommend the right pieces and pace. There’s no wrong answer."
      />

      <OnbField label="Your current level">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {LEVEL_OPTIONS.map((opt) => {
            const on = level === opt.k;
            return (
              <div
                key={opt.k}
                onClick={() => setLevel(opt.k)}
                style={{
                  padding: '14px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  border: on ? '1.5px solid var(--gold-2)' : '1px solid var(--rule)',
                  background: on ? 'var(--gold-tint)' : 'var(--card)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 16,
                    fontWeight: 500,
                    marginBottom: 4,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {opt.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.5 }}>
                  {opt.sub}
                </div>
                {on && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: 'var(--gold-2)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </OnbField>

      <OnbField label="What do you want to do with guitar?" hint="pick any that resonate">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GOAL_OPTIONS.map(({ k, label }) => {
            const on = goals.has(k);
            return (
              <span
                key={k}
                onClick={() => toggle(k)}
                style={{
                  padding: '9px 14px',
                  borderRadius: 99,
                  border: on ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
                  background: on ? 'var(--gold-tint)' : 'var(--card)',
                  color: on ? 'var(--ink)' : 'var(--ink-3)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: on ? 500 : 400,
                }}
              >
                {on && '✓ '}
                {label}
              </span>
            );
          })}
        </div>
      </OnbField>

      <OnbField label="Daily practice target">
        <div style={{ display: 'flex', gap: 6 }}>
          {PRACTICE_TARGETS.map((m, i) => (
            <span
              key={m}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: 8,
                textAlign: 'center',
                border: i === 2 ? '1.5px solid var(--gold-2)' : '1px solid var(--rule)',
                background: i === 2 ? 'var(--gold-tint)' : 'var(--card)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 500, lineHeight: 1 }}
              >
                {m}
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--ink-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                  marginTop: 4,
                }}
              >
                min/day
              </div>
            </span>
          ))}
        </div>
      </OnbField>

      <div
        style={{
          marginTop: 14,
          padding: '12px 14px',
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--ink-3)',
          lineHeight: 1.55,
        }}
      >
        <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--gold-2)' }}>
          Based on your answers
        </span>{' '}
        — your first lesson will focus on fingerpicking fundamentals (PIMA drill) and your first
        repertoire song will be <em style={{ fontStyle: 'italic' }}>“Blackbird”</em> by The Beatles.
      </div>

      <OnbNextBar back="Back" next="Schedule lessons" />
    </OnboardShell>
  );
}
