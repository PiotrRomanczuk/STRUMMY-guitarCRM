'use client';

import { useCallback, useState } from 'react';
import { MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SidebarNavItem } from './Sidebar.NavItem';
import type { NavItem } from './sidebar.helpers';

interface SidebarMobileSheetProps {
  items: NavItem[];
}

export function SidebarMobileSheet({ items }: SidebarMobileSheetProps) {
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
      <SheetContent side="left" className="w-72 p-0" data-testid="sidebar-mobile">
        <SheetHeader className="border-b">
          <SheetTitle>Strummy</SheetTitle>
        </SheetHeader>
        <nav aria-label="Dashboard navigation (mobile)" className="flex flex-col gap-1 p-3">
          {items.map((item) => (
            <SidebarNavItem key={item.href} item={item} onNavigate={handleNavigate} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
