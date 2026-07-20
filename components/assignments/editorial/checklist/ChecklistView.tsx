'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { toggleChecklistItemAction } from '@/app/actions/assignment-checklist';
import type { ChecklistItem } from '@/schemas/AssignmentSchema';
import { ChecklistProgress } from './ChecklistProgress';

type Props = {
  assignmentId: string;
  items: ChecklistItem[];
  canToggle: boolean;
};

/** Read/tick view of a checklist. Ticking routes through the server action
 * (student → SECURITY DEFINER RPC; teacher/admin → owned update). Optimistic
 * with rollback on error. */
export const ChecklistView = ({ assignmentId, items: initial, canToggle }: Props) => {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const toggle = (id: string, done: boolean) => {
    if (!canToggle || pending) return;
    const prev = items;
    setItems(items.map((i) => (i.id === id ? { ...i, done } : i)));
    setError('');
    startTransition(async () => {
      const res = await toggleChecklistItemAction(assignmentId, id, done);
      if ('error' in res) {
        setItems(prev);
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  if (items.length === 0) return null;
  const done = items.filter((i) => i.done).length;

  return (
    <div>
      <ChecklistProgress done={done} total={items.length} />
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {items.map((item) => (
          <li key={item.id}>
            {/* Whole row is the tap target (~44px min) — a bare 13px native
                checkbox is unusable on touch screens. */}
            <label
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '6px 8px',
                margin: '-2px -8px',
                borderRadius: 6,
                minHeight: 32,
                cursor: canToggle && !pending ? 'pointer' : 'default',
              }}
            >
              <input
                type="checkbox"
                checked={item.done}
                disabled={!canToggle || pending}
                onChange={(e) => toggle(item.id, e.target.checked)}
                style={{
                  marginTop: 3,
                  width: 16,
                  height: 16,
                  accentColor: 'var(--gold-2)',
                  cursor: 'inherit',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  color: item.done ? 'var(--ink-4)' : 'var(--ink)',
                  textDecoration: item.done ? 'line-through' : 'none',
                }}
              >
                {item.text}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {error && (
        <div
          style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8, fontFamily: 'var(--mono)' }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
