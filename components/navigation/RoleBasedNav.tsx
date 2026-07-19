'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  label: string;
  icon?: string;
  requiresRole?: 'admin' | 'teacher' | 'student';
}

function NavLink({ href, label, icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm whitespace-nowrap font-medium ${
        isActive
          ? 'bg-background text-primary shadow-md'
          : 'text-primary-foreground/90 hover:bg-primary/80 dark:hover:bg-primary/70'
      }`}
    >
      {icon && <span className="hidden sm:inline">{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}

export function RoleBasedNav({
  user,
  isAdmin,
  isTeacher,
  isStudent,
}: {
  user: { email?: string } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}) {
  if (!user) {
    return null;
  }

  const navItems: NavLinkProps[] = [{ href: '/', label: 'Home', icon: '🏠' }];

  // Admin navigation
  if (isAdmin || isTeacher) {
    navItems.push(
      { href: '/dashboard/songs', label: 'Songs', icon: '🎵' },
      { href: '/dashboard/lessons', label: 'Lessons', icon: '📚' },
      { href: '/dashboard/assignments', label: 'Assignments', icon: '📋' },
      { href: '/dashboard/users', label: 'Users', icon: '👥' }
    );
  } else if (isStudent) {
    navItems.push(
      { href: '/dashboard', label: 'Dashboard', icon: '👨‍🎓' },
      { href: '/dashboard/songs', label: 'My Songs', icon: '🎵' },
      { href: '/dashboard/lessons', label: 'My Lessons', icon: '📖' },
      { href: '/dashboard/assignments', label: 'My Assignments', icon: '📋' },
      { href: '/dashboard/repertoire', label: 'My Repertoire', icon: '📊' }
    );
  }

  // Everyone can access Settings
  // navItems.push({ href: '/dashboard/settings', label: 'Settings', icon: '⚙️' });

  return (
    <nav className="flex flex-row flex-wrap gap-1 md:gap-2">
      {navItems.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}
