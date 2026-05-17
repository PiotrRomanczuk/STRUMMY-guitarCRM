import Link from 'next/link';
import { Guitar } from 'lucide-react';
import { SidebarBody } from './Sidebar.Body';
import { SidebarFooter } from './Sidebar.Footer';
import { getRoleLabel, type RoleFlags } from './sidebar.helpers';

export interface SidebarProps extends RoleFlags {
  email: string;
  fullName?: string | null;
}

/**
 * Desktop dashboard sidebar — Classic Wide (design 8.1).
 * Hidden below the `md` breakpoint — pair with `<SidebarMobileSheet>` for mobile.
 */
export function Sidebar({ email, fullName, ...roles }: SidebarProps) {
  const roleLabel = getRoleLabel(roles);

  return (
    <aside
      data-testid="dashboard-sidebar"
      aria-label="Dashboard navigation"
      className="bg-sidebar hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r"
    >
      <Link
        href="/dashboard"
        className="hover:bg-muted/40 flex h-14 items-center gap-2.5 border-b px-4 transition-colors"
      >
        <div className="from-primary to-primary/80 grid size-8 place-items-center rounded-lg bg-gradient-to-br text-[#422c00] shadow-[inset_0_-1px_0_rgba(0,0,0,.15)]">
          <Guitar className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-serif text-base leading-tight font-semibold tracking-[-0.01em]">
            Strummy
          </p>
          <p className="text-muted-foreground truncate font-mono text-[10px] uppercase tracking-[0.1em]">
            {roleLabel}
          </p>
        </div>
      </Link>
      <SidebarBody roles={roles} />
      <SidebarFooter email={email} fullName={fullName} roleLabel={roleLabel} />
    </aside>
  );
}
