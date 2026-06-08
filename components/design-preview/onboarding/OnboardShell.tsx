import type { ReactNode } from 'react';
import type { OnboardStep, OnboardRole } from './types';

type OnboardShellProps = {
  steps: OnboardStep[];
  current: number;
  role: OnboardRole;
  children: ReactNode;
  width?: number;
  height?: number;
};

export function OnboardShell({
  steps,
  current,
  role,
  children,
  width = 1280,
  height = 800,
}: OnboardShellProps) {
  return (
    <div
      style={{
        width,
        height,
        background: 'var(--ivory)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        fontFamily: 'var(--sans)',
        color: 'var(--ink)',
      }}
    >
      {/* left rail */}
      <div
        style={{
          background: 'var(--paper)',
          borderRight: '1px solid var(--rule)',
          padding: '36px 28px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 19c0-3 2-5 4-6s2-4 5-4 5 3 5 3-2 2-5 2-3 2-5 3-4 2-4 2z" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 19,
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              Strummy
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                letterSpacing: '.14em',
              }}
            >
              {role} setup
            </div>
          </div>
        </div>

        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 28,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            marginBottom: 4,
          }}
        >
          Let’s get you <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>set up</em>.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-4)', lineHeight: 1.55, marginBottom: 28 }}>
          Three minutes. We’ll have you teaching in no time.
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <div
                key={s.title}
                style={{ display: 'flex', gap: 14, padding: '10px 0', position: 'relative' }}
              >
                {i < steps.length - 1 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: 11,
                      top: 34,
                      bottom: -10,
                      width: 2,
                      background: done ? 'var(--gold-2)' : 'var(--rule)',
                    }}
                  />
                )}
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: done ? 'var(--gold-2)' : active ? 'var(--ink)' : 'var(--card)',
                    border: done || active ? 'none' : '1.5px solid var(--rule)',
                    color: done || active ? '#fff' : 'var(--ink-4)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    fontWeight: 600,
                    flex: '0 0 24px',
                    zIndex: 1,
                  }}
                >
                  {done ? '✓' : i + 1}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      color: active ? 'var(--ink)' : done ? 'var(--ink-3)' : 'var(--ink-4)',
                    }}
                  >
                    {s.title}
                  </div>
                  {s.sub && (
                    <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>{s.sub}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--mono)' }}>
          Step {current + 1} of {steps.length} · ~{Math.max(1, (steps.length - current) * 60)}s left
        </div>
      </div>

      {/* right content */}
      <div
        style={{
          padding: '56px 64px 40px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
}
