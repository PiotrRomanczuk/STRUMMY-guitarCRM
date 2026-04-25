import Link from 'next/link';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListPageHeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

interface ListPageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  action?: ListPageHeaderAction;
  extraActions?: React.ReactNode;
}

export function ListPageHeader({
  title,
  subtitle,
  count,
  countLabel = 'total',
  action,
  extraActions,
}: ListPageHeaderProps) {
  const Icon = action?.icon ?? Plus;

  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="font-serif font-normal text-[34px] tracking-[-0.02em] leading-none">{title}</h1>
        {subtitle ? (
          <div className="text-muted-foreground text-[13px] mt-1.5">{subtitle}</div>
        ) : count !== undefined ? (
          <div className="text-muted-foreground text-[13px] mt-1.5">
            {count} {countLabel}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {extraActions}
        {action && (
          action.href ? (
            <Button asChild className="gap-2 bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/10">
              <Link href={action.href}><Icon className="h-4 w-4" />{action.label}</Link>
            </Button>
          ) : (
            <Button onClick={action.onClick} className="gap-2 bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/10">
              <Icon className="h-4 w-4" />{action.label}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
