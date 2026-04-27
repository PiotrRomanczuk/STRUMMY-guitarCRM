import { canTransitionPostStatus } from './post-status';

describe('canTransitionPostStatus', () => {
  it('allows planned → scheduled', () => {
    expect(canTransitionPostStatus('planned', 'scheduled')).toBe(true);
  });

  it('allows scheduled → published', () => {
    expect(canTransitionPostStatus('scheduled', 'published')).toBe(true);
  });

  it('blocks planned → published (must schedule first)', () => {
    expect(canTransitionPostStatus('planned', 'published')).toBe(false);
  });

  it('allows published → archived but not the reverse to scheduled', () => {
    expect(canTransitionPostStatus('published', 'archived')).toBe(true);
    expect(canTransitionPostStatus('published', 'scheduled')).toBe(false);
  });

  it('allows failed → planned (re-queue)', () => {
    expect(canTransitionPostStatus('failed', 'planned')).toBe(true);
  });

  it('treats same → same as a no-op transition', () => {
    expect(canTransitionPostStatus('planned', 'planned')).toBe(true);
  });
});
