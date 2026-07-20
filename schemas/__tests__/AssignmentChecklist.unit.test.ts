import {
  ChecklistItemSchema,
  ChecklistSchema,
  checklistProgress,
  type ChecklistItem,
} from '@/schemas/AssignmentSchema';

describe('ChecklistItemSchema', () => {
  it('accepts a valid item and defaults done to false', () => {
    const parsed = ChecklistItemSchema.parse({ id: 'x', text: 'Learn intro' });
    expect(parsed).toEqual({ id: 'x', text: 'Learn intro', done: false });
  });

  it('rejects empty text and empty id', () => {
    expect(ChecklistItemSchema.safeParse({ id: 'x', text: '' }).success).toBe(false);
    expect(ChecklistItemSchema.safeParse({ id: '', text: 'ok' }).success).toBe(false);
  });

  it('rejects text over 200 chars', () => {
    expect(ChecklistItemSchema.safeParse({ id: 'x', text: 'a'.repeat(201) }).success).toBe(false);
  });
});

describe('ChecklistSchema', () => {
  it('defaults to an empty array', () => {
    expect(ChecklistSchema.parse(undefined)).toEqual([]);
  });

  it('rejects more than 20 items', () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      id: `${i}`,
      text: `t${i}`,
      done: false,
    }));
    expect(ChecklistSchema.safeParse(items).success).toBe(false);
  });

  it('accepts exactly 20 items', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      text: `t${i}`,
      done: false,
    }));
    expect(ChecklistSchema.safeParse(items).success).toBe(true);
  });
});

describe('checklistProgress', () => {
  const items: ChecklistItem[] = [
    { id: 'a', text: 'one', done: true },
    { id: 'b', text: 'two', done: false },
    { id: 'c', text: 'three', done: false },
  ];

  it('computes done / total / pct', () => {
    expect(checklistProgress(items)).toEqual({ done: 1, total: 3, pct: 1 / 3 });
  });

  it('is 0 for an empty checklist', () => {
    expect(checklistProgress([])).toEqual({ done: 0, total: 0, pct: 0 });
  });
});
