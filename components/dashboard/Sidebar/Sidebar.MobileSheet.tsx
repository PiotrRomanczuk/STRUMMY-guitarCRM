'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Guitar, MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarBody } from './Sidebar.Body';
import { SidebarFooter } from './Sidebar.Footer';
import type { RoleFlags } from './sidebar.helpers';

interface SidebarMobileSheetProps {
  roles: RoleFlags;
  email: string;
  fullName?: string | null;
  roleLabel: string;
}

export function SidebarMobileSheet({ roles, email, fullName, roleLabel }: SidebarMobileSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handleNavigate = useCallback(() => setIsOpen(false), []);
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          data-testid="sidebar-mobile-trigger"
          className="md:hidden"
        >
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-sidebar flex w-72 flex-col p-0"
        data-testid="sidebar-mobile"
      >
        <SheetHeader className="border-b p-0">
          <SheetTitle asChild>
            <Link
              href="/dashboard"
              onClick={handleNavigate}
              className="flex h-14 items-center gap-2.5 px-4"
            >
              <div className="from-primary to-primary/80 grid size-8 place-items-center rounded-lg bg-gradient-to-br text-[#422c00]">
                <Guitar className="size-4" />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate font-serif text-base leading-tight font-semibold tracking-[-0.01em]">
                  Strummy
                </p>
                <p className="text-muted-foreground truncate font-mono text-[10px] uppercase tracking-[0.1em]">
                  {roleLabel}
                </p>
              </div>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <SidebarBody roles={roles} onNavigate={handleNavigate} />
        <SidebarFooter email={email} fullName={fullName} roleLabel={roleLabel} />
      </SheetContent>
    </Sheet>
  );
}
