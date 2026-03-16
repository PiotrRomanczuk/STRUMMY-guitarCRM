import Link from 'next/link';
import { Library, Clock, BarChart3, ListTodo, Timer } from 'lucide-react';

interface QuickLinksProps {
  totalAssignments: number;
}

export function QuickLinks({ totalAssignments }: QuickLinksProps) {
  const links = [
    { href: '/dashboard/songs', icon: Library, label: 'All Songs' },
    { href: '/dashboard/lessons', icon: Clock, label: 'Lessons' },
    { href: '/dashboard/stats', icon: BarChart3, label: 'Stats' },
    {
      href: '/dashboard/assignments',
      icon: ListTodo,
      label: `Tasks${totalAssignments > 0 ? ` (${totalAssignments})` : ''}`,
    },
    { href: '/dashboard/practice', icon: Timer, label: 'Practice' },
  ];

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
        Quick Links
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-1.5 rounded-xl
                       bg-card border border-border px-4 py-3
                       min-w-[76px] shrink-0 active:bg-muted/50
                       transition-colors min-h-[44px]"
          >
            <link.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-[11px] font-medium text-foreground whitespace-nowrap">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
