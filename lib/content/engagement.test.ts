import { computeEngagementRate } from './engagement';

describe('computeEngagementRate', () => {
  it('returns null when views is zero', () => {
    expect(
      computeEngagementRate({ views: 0, likes: 5, comments: 1, shares: 0, saves: 0 })
    ).toBeNull();
  });

  it('returns 0 when there are views but no interactions', () => {
    expect(computeEngagementRate({ views: 100, likes: 0, comments: 0, shares: 0, saves: 0 })).toBe(
      0
    );
  });

  it('computes (likes + comments + shares + saves) / views * 100, 2 decimals', () => {
    // 5 + 2 + 1 + 1 = 9 / 200 = 4.5%
    expect(computeEngagementRate({ views: 200, likes: 5, comments: 2, shares: 1, saves: 1 })).toBe(
      4.5
    );
  });

  it('rounds to two decimals', () => {
    // 1/3 = 33.33%
    expect(computeEngagementRate({ views: 3, likes: 1, comments: 0, shares: 0, saves: 0 })).toBe(
      33.33
    );
  });
});
