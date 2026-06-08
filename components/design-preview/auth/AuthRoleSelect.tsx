'use client';

import { useState } from 'react';
import { Icon } from '@/components/design-preview/lib/icons';
import { AuthBg, AuthCard } from './AuthFrame';
import { AUTH_ROLE_OPTIONS } from './data';
import type { AuthRoleKey } from './types';

type Props = {
  width?: number;
  height?: number;
};

const continueLabel = (role: AuthRoleKey): string => {
  if (role === 'teacher') return 'a teacher';
  if (role === 'student') return 'a student';
  return 'a parent';
};

export const AuthRoleSelect = ({ width = 1280, height = 800 }: Props) => {
  const [role, setRole] = useState<AuthRoleKey>('teacher');

  return (
    <AuthBg width={width} height={height}>
      <AuthCard width={520}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
            marginBottom: 6,
          }}
        >
          One last thing
        </div>
        <h1
          style={{
            margin: '0 0 8px',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 30,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          How will you use <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>Strummy</em>?
        </h1>
        <p style={{ margin: '0 0 22px', fontSize: 13, color: 'var(--ink-4)', lineHeight: 1.55 }}>
          Pick the role that best matches you. You can switch later, or add more if needed.
        </p>

        {AUTH_ROLE_OPTIONS.map((opt) => {
          const selected = role === opt.k;
          return (
            <div
              key={opt.k}
              onClick={() => setRole(opt.k)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 16px',
                marginBottom: 8,
                border: selected ? '1.5px solid var(--gold-2)' : '1px solid var(--rule)',
                background: selected ? 'var(--gold-tint)' : 'var(--paper)',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  flex: '0 0 36px',
                  background: selected ? 'var(--gold-2)' : 'var(--card)',
                  border: selected ? 'none' : '1px solid var(--rule)',
                  display: 'grid',
                  placeItems: 'center',
                  color: selected ? '#fff' : 'var(--ink-3)',
                }}
              >
                <Icon d={opt.icon} size={18} stroke={selected ? '#fff' : 'var(--ink-3)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 16,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    marginBottom: 2,
                  }}
                >
                  {opt.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  {opt.sub}
                </div>
              </div>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: selected ? '5px solid var(--gold-2)' : '1.5px solid var(--rule)',
                  marginTop: 8,
                  background: selected ? 'var(--card)' : 'transparent',
                }}
              />
            </div>
          );
        })}

        <button
          style={{
            marginTop: 14,
            width: '100%',
            padding: '13px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Continue as {continueLabel(role)}
        </button>
      </AuthCard>
    </AuthBg>
  );
};
