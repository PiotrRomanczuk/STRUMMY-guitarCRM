export interface EngagementInput {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

/**
 * Engagement rate as a percentage:
 *   (likes + comments + shares + saves) / views * 100
 * Returns null when views is 0 to avoid divide-by-zero noise on the UI.
 */
export function computeEngagementRate(input: EngagementInput): number | null {
  if (input.views <= 0) return null;
  const interactions = input.likes + input.comments + input.shares + input.saves;
  return Math.round((interactions / input.views) * 10000) / 100;
}
