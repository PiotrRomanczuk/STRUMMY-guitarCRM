export type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

// Every href below must resolve. Marketing placeholders (/blog, /careers,
// /contact, /changelog, /about, /community, /connect) were removed rather than
// stubbed — a 404 from the footer reads worse than a shorter footer.
export const footerColumns: FooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/#capabilities' },
      { label: 'How it works', href: '/#workflow' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    heading: 'Get started',
    links: [
      { label: 'Try the live demo', href: '/sign-in?demo=true' },
      { label: 'Create an account', href: '/sign-up' },
      { label: 'Sign in', href: '/sign-in' },
      { label: 'Source on GitHub', href: 'https://github.com/PiotrRomanczuk/strummy' },
    ],
  },
];

export const footerSocial = [
  { label: 'GitHub', href: 'https://github.com/PiotrRomanczuk/strummy' },
];
