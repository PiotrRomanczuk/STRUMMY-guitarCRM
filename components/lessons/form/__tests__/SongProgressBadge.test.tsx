import {
  getSongProgressHintClass,
  getProgressSortOrder,
} from '../SongProgressBadge';
import type { SongProgressEntry } from '@/app/actions/repertoire';

function makeProgress(overrides: Partial<SongProgressEntry> = {}): SongProgressEntry {
  return {
    current_status: 'started',
    last_practiced_at: null,
    total_practice_minutes: 0,
    self_rating: null,
    ...overrides,
  };
}

describe('getSongProgressHintClass', () => {
  it('returns empty string when no progress', () => {
    expect(getSongProgressHintClass(undefined)).toBe('');
  });

  it('returns opacity class for mastered songs', () => {
    const progress = makeProgress({ current_status: 'mastered' });
    expect(getSongProgressHintClass(progress)).toBe('opacity-60');
  });

  it('returns border class for in-progress songs', () => {
    const started = makeProgress({ current_status: 'started' });
    expect(getSongProgressHintClass(started)).toContain('border-l-2');

    const remembered = makeProgress({ current_status: 'remembered' });
    expect(getSongProgressHintClass(remembered)).toContain('border-l-2');

    const withAuthor = makeProgress({ current_status: 'with_author' });
    expect(getSongProgressHintClass(withAuthor)).toContain('border-l-2');
  });

  it('returns empty string for to_learn status', () => {
    const progress = makeProgress({ current_status: 'to_learn' });
    expect(getSongProgressHintClass(progress)).toBe('');
  });
});

describe('getProgressSortOrder', () => {
  it('returns 1 for undefined status (no repertoire entry)', () => {
    expect(getProgressSortOrder(undefined)).toBe(1);
  });

  it('returns 0 for in-progress statuses', () => {
    expect(getProgressSortOrder('started')).toBe(0);
    expect(getProgressSortOrder('remembered')).toBe(0);
    expect(getProgressSortOrder('with_author')).toBe(0);
  });

  it('returns 1 for to_learn', () => {
    expect(getProgressSortOrder('to_learn')).toBe(1);
  });

  it('returns 2 for mastered', () => {
    expect(getProgressSortOrder('mastered')).toBe(2);
  });

  it('returns 1 for unknown status', () => {
    expect(getProgressSortOrder('unknown_status')).toBe(1);
  });
});
