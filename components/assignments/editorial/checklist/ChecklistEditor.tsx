'use client';

import { formStyles as s } from '@/components/_editorial/form-styles';
import type { ChecklistItem } from '@/schemas/AssignmentSchema';

const MAX_ITEMS = 20;

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `c-${Math.random().toString(36).slice(2)}`;

type Props = {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  disabled?: boolean;
};

const iconButton: React.CSSProperties = {
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--card)',
  color: 'var(--ink-3)',
  width: 30,
  height: 30,
  cursor: 'pointer',
  fontSize: 13,
  flexShrink: 0,
};

/** Teacher-facing checklist authoring: add / edit / reorder / remove sub-tasks. */
export const ChecklistEditor = ({ items, onChange, disabled }: Props) => {
  const setText = (id: string, text: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const add = () => {
    if (items.length >= MAX_ITEMS) return;
    onChange([...items, { id: newId(), text: '', done: false }]);
  };
  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    onChange(copy);
  };

  return (
    <div style={s.field}>
      <label style={s.label}>Checklist (optional)</label>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, index) => (
            <div key={item.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                style={{ ...s.input, flex: 1 }}
                value={item.text}
                placeholder={`Step ${index + 1} — e.g. Learn the intro riff`}
                onChange={(e) => setText(item.id, e.target.value)}
                disabled={disabled}
                aria-label={`Checklist item ${index + 1}`}
              />
              <button
                type="button"
                style={iconButton}
                onClick={() => move(index, -1)}
                disabled={disabled || index === 0}
                aria-label="Move item up"
              >
                ↑
              </button>
              <button
                type="button"
                style={iconButton}
                onClick={() => move(index, 1)}
                disabled={disabled || index === items.length - 1}
                aria-label="Move item down"
              >
                ↓
              </button>
              <button
                type="button"
                style={{ ...iconButton, color: 'var(--danger)' }}
                onClick={() => remove(item.id)}
                disabled={disabled}
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={add}
        disabled={disabled || items.length >= MAX_ITEMS}
        style={{
          ...s.cancel,
          marginTop: items.length > 0 ? 10 : 4,
          alignSelf: 'flex-start',
          cursor: items.length >= MAX_ITEMS ? 'not-allowed' : 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
      >
        {items.length >= MAX_ITEMS ? 'Max 20 items' : '+ Add checklist item'}
      </button>
    </div>
  );
};
