'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import { getMenuGroups } from '@/components/navigation/menuConfig';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';

interface MobileMoreMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

export function MobileMoreMenuV2({
  open, onOpenChange, isAdmin, isTeacher, isStudent,
}: MobileMoreMenuProps) {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const groups = getMenuGroups({ isAdmin, isTeacher, isStudent });

  // Close the menu whenever the route changes (covers browser back/forward,
  // programmatic navigation, and any other navigation besides link clicks).
  useEffect(() => {
    if (prevPathnameRef.current !== pathname && open) {
      onOpenChange(false);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, open, onOpenChange]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  };

  const isActive = (path: string) =>
    pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-[#1c1b1b]">
        <DrawerHeader className="pb-1">
          <DrawerTitle className="text-base font-semibold">Menu</DrawerTitle>
        </DrawerHeader>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="px-4 pb-6 overflow-y-auto space-y-5"
        >
          {groups.map((group) => (
            <motion.div key={group.label} variants={listItem}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#d5c4ad] px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => onOpenChange(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium',
                        'transition-colors min-h-[44px]',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-[#d5c4ad] hover:text-primary hover:bg-[#353534]',
                      )}
                    >
                      <item.icon className={cn('w-5 h-5 shrink-0', active && 'text-primary')} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ))}

          <motion.div variants={listItem} className="pt-2 border-t border-[#504534]">
            <button
              onClick={handleSignOut}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium w-full',
                'min-h-[44px] text-destructive hover:bg-destructive/10 transition-colors',
              )}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </motion.div>
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
}
