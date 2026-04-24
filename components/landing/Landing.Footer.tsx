'use client';

const FOOTER_COLS = [
  { title: 'Product', items: ['Features', 'How it works', 'Changelog', 'Roadmap'] },
  { title: 'Studio', items: ['For teachers', 'Founder story', 'Contact'] },
  { title: 'Legal', items: ['Privacy', 'Terms', 'Beta notice'] },
];

const SOCIAL = [
  {
    label: 'GH',
    d: 'M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z',
  },
  {
    label: 'IN',
    d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',
  },
];

export function LandingFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--l-rule)', background: 'var(--l-paper)' }}>
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 md:px-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12 lg:px-24">
        {/* Brand col */}
        <div>
          <div className="mb-2.5 font-serif text-[26px] font-medium tracking-[-0.02em]">
            Strummy
            <span
              className="ml-0.5 inline-block h-[5px] w-[5px] rounded-full align-middle"
              style={{ background: 'var(--l-gold)' }}
            />
          </div>
          <p
            className="max-w-[300px] text-[13px] leading-relaxed"
            style={{ color: 'var(--l-ink-3)' }}
          >
            A quieter kind of studio software. Built in Brooklyn by a working guitar teacher.
          </p>
          <div className="mt-4 flex gap-2.5">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full"
                style={{ border: '1px solid var(--l-rule)', color: 'var(--l-ink-3)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <div
              className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--l-ink-4)' }}
            >
              {col.title}
            </div>
            <div className="flex flex-col gap-2">
              {col.items.map((it) => (
                <a
                  key={it}
                  className="cursor-pointer text-[13px] no-underline"
                  style={{ color: 'var(--l-ink-2)' }}
                >
                  {it}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2.5 border-t px-6 py-5 md:px-12 lg:px-24"
        style={{ borderColor: 'var(--l-rule)' }}
      >
        <div className="font-mono text-[11px]" style={{ color: 'var(--l-ink-4)' }}>
          &copy; 2026 Strummy &middot; Public beta
        </div>
        <div className="font-mono text-[11px]" style={{ color: 'var(--l-ink-4)' }}>
          strummy.app
        </div>
      </div>
    </footer>
  );
}
