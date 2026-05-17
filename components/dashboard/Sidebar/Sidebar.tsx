import Link from 'next/link';
import { SidebarNavItem } from './Sidebar.NavItem';
import { getNavItemsForRole, type RoleFlags } from './sidebar.helpers';

export type SidebarProps = RoleFlags;

/**
 * Persistent desktop dashboard sidebar (Server Component).
 * Hidden below the `md` breakpoint — pair with `<SidebarMobileSheet>` for
 * mobile navigation.
 */
export function Sidebar(props: SidebarProps) {
  const items = getNavItemsForRole(props);
  return (
    <aside
      data-testid="dashboard-sidebar"
      aria-label="Dashboard navigation"
      className="bg-background hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r"
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          Strummy
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => (
          <SidebarNavItem key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}
