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
    <div className="space-y-3">
      <h2 className="text-muted-foreground text-[10px] font-black uppercase tracking-widest px-1">
        Quick Links
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2"
           style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-2 rounded-[10px]
                       bg-card px-4 py-3
                       min-w-[76px] shrink-0 active:bg-muted
                       transition-colors min-h-[44px]"
          >
            <link.icon className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-bold text-foreground whitespace-nowrap">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
