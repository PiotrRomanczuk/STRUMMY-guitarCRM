'use client';

import { Settings, LogOut, Guitar, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { DatabaseStatus } from '@/components/debug/DatabaseStatus';
import {
  HOME_ITEM,
  NOTIFICATION_ITEM,
  getMenuGroups,
  type MenuItem,
  type MenuGroup,
} from './menuConfig';

interface SidebarProps {
  user: { email?: string } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isDemoAccount?: boolean;
}

export function Sidebar({ user, isAdmin, isTeacher, isStudent, isDemoAccount }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  };

  if (!user) return null;

  const menuGroups = getMenuGroups({ isAdmin, isTeacher, isStudent, isDemoAccount });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-30">
        <SidebarContent
          menuGroups={menuGroups}
          pathname={pathname}
          setIsOpen={setIsOpen}
          handleSignOut={handleSignOut}
          isAdmin={isAdmin}
          isTeacher={isTeacher}
          isStudent={isStudent}
        />
      </aside>

      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent
              menuGroups={menuGroups}
              pathname={pathname}
              setIsOpen={setIsOpen}
              handleSignOut={handleSignOut}
              isAdmin={isAdmin}
              isTeacher={isTeacher}
              isStudent={isStudent}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

const FOOTER_LINK =
  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors';

interface SidebarContentProps {
  menuGroups: MenuGroup[];
  pathname: string;
  setIsOpen: (open: boolean) => void;
  handleSignOut: () => void;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

function SidebarContent(props: SidebarContentProps) {
  const { menuGroups, pathname, setIsOpen, handleSignOut, isAdmin, isTeacher, isStudent } = props;
  let animIndex = 0;
  const close = () => setIsOpen(false);
  const roleLabel = isAdmin ? 'Admin' : isTeacher ? 'Teacher' : isStudent ? 'Student' : 'User';

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Guitar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">GuitarStudio</h1>
            <p className="text-xs text-muted-foreground">{roleLabel} Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <NavItem item={HOME_ITEM} pathname={pathname} setIsOpen={setIsOpen} index={animIndex++} />
        {menuGroups.map((group) => (
          <div key={group.label} className="mt-4">
            <p className="px-4 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.id} item={item} pathname={pathname} setIsOpen={setIsOpen} index={animIndex++} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <div className="px-4 py-2">
          <DatabaseStatus variant="inline" className="w-full justify-center" />
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-medium text-muted-foreground">Theme</span>
          <ModeToggle />
        </div>
        <Link href={NOTIFICATION_ITEM.path} onClick={close} className={FOOTER_LINK}>
          <div className="relative">
            <NOTIFICATION_ITEM.icon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive" />
          </div>
          {NOTIFICATION_ITEM.label}
        </Link>
        <Link href="/dashboard/settings" onClick={close} className={FOOTER_LINK}>
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </button>
      </div>
    </div>
  );
}

interface NavItemProps {
  item: MenuItem;
  pathname: string;
  setIsOpen: (open: boolean) => void;
  index: number;
}

function NavItem({ item, pathname, setIsOpen, index }: NavItemProps) {
  const isActive =
    pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));

  return (
    <Link
      href={item.path}
      onClick={() => setIsOpen(false)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
        'opacity-0 animate-fade-in',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
    >
      <item.icon className="w-5 h-5" />
      {item.label}
    </Link>
  );
}
