export type PricingTier = {
  name: string;
  description: string;
  price: string;
  period: string;
  cta: { label: string; href: string };
  features: string[];
  highlighted?: boolean;
};

// Strummy has no billing integration yet — these tiers describe the intended
// shape, and the section is labelled as planned pricing. Every feature listed
// is one that exists in the product today; nothing aspirational is sold here.
// The `?plan=` query param was dropped because sign-up never read it.
export const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    description: 'Everything you need to run lessons',
    price: 'Free',
    period: 'While in development',
    cta: { label: 'Start now', href: '/sign-up' },
    features: [
      'Lesson scheduling and history',
      'Song library with chords and tabs',
      'Student portal and practice logging',
    ],
  },
  {
    name: 'Pro',
    description: 'For teachers running a full studio',
    price: '$19',
    period: 'per month · planned',
    cta: { label: 'Try the demo', href: '/sign-in?demo=true' },
    features: [
      'Everything in Starter',
      'AI lesson notes and assignment drafting',
      'Google Calendar two-way sync',
      'Repertoire tracking and assignments',
    ],
    highlighted: true,
  },
  {
    name: 'Studio',
    description: 'For multi-teacher studios',
    price: '$39',
    period: 'per month · planned',
    cta: { label: 'Try the demo', href: '/sign-in?demo=true' },
    features: [
      'Everything in Pro',
      'Multiple teachers, isolated rosters',
      'Studio-wide analytics',
      'Automated reminders and digests',
    ],
  },
];
