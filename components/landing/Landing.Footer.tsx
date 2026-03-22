import Link from 'next/link';
import { Github, Linkedin } from 'lucide-react';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: 'https://github.com/PiotrRomanczuk/guitar-crm/releases' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Portfolio', href: 'https://romanczuk.vercel.app' },
      { label: 'Contact', href: 'mailto:p.romanczuk@gmail.com' },
    ],
  },
];

const socials = [
  { label: 'GitHub', href: 'https://github.com/PiotrRomanczuk/guitar-crm', icon: Github },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/piotr-romanczuk/', icon: Linkedin },
];

export function LandingFooter() {
  return (
    <footer className="bg-[hsl(30_20%_7%)] dark:bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-primary">
              Strummy
            </Link>
            <p className="text-sm text-[hsl(36_30%_60%)] dark:text-muted-foreground mt-2 leading-relaxed">
              Your guitar teaching studio, beautifully organized.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white/80 mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-sm text-[hsl(36_30%_60%)] dark:text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[hsl(36_30%_60%)] dark:text-muted-foreground">
            &copy; {new Date().getFullYear()} Strummy. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(36_30%_60%)] dark:text-muted-foreground hover:text-primary transition-colors"
                aria-label={s.label}
              >
                <s.icon size={18} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
