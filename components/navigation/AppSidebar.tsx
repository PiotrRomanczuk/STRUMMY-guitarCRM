'use client';

import {
  Users,
  Music,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Guitar,
  BarChart,
  FileText,
  Music2,
  Activity,
  Calendar,
  Sparkles,
  Video,
  Grid3X3,
  GraduationCap,
  Zap,
  Clapperboard,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import { createClient } from '@/lib/supabase/client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { FontSwitcherDropdown } from './FontSwitcherDropdown';

interface AppSidebarProps {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

export function AppSidebar({ isAdmin, isTeacher, isStudent }: AppSidebarProps) {
  const pathname = usePathname();
  const posthog = usePostHog();

  const handleSignOut = async () => {
    posthog.reset();
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  };

  const getMenuItems = () => {
    if (isAdmin || isTeacher) {
      return {
        main: [
          { id: 'home', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
          { id: 'songs', label: 'Songs', icon: Music, path: '/dashboard/songs' },
          { id: 'lessons', label: 'Lessons', icon: BookOpen, path: '/dashboard/lessons' },
          {
            id: 'assignments',
            label: 'Assignments',
            icon: ClipboardList,
            path: '/dashboard/assignments',
          },
          { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/dashboard/calendar' },
          {
            id: 'content',
            label: 'Content',
            icon: Clapperboard,
            path: '/dashboard/content/calendar',
          },
          { id: 'users', label: 'Users', icon: Users, path: '/dashboard/users' },
          { id: 'skills', label: 'Skills', icon: Zap, path: '/dashboard/skills' },
          { id: 'theory', label: 'Theory', icon: GraduationCap, path: '/dashboard/theory' },
          { id: 'fretboard', label: 'Fretboard', icon: Grid3X3, path: '/dashboard/fretboard' },
        ],
        admin: [
          {
            id: 'spotify-matches',
            label: 'Spotify Matches',
            icon: Music2,
            path: '/dashboard/admin/spotify-matches',
          },
          {
            id: 'drive-videos',
            label: 'Drive Videos',
            icon: Video,
            path: '/dashboard/admin/drive-videos',
          },
          {
            id: 'song-stats',
            label: 'Song Stats',
            icon: BarChart,
            path: '/dashboard/admin/stats/songs',
          },
          {
            id: 'lesson-stats',
            label: 'Lesson Stats',
            icon: BarChart,
            path: '/dashboard/admin/stats/lessons',
          },
          { id: 'cohorts', label: 'Cohorts', icon: Users, path: '/dashboard/cohorts' },
          { id: 'logs', label: 'Logs', icon: FileText, path: '/dashboard/logs' },
          { id: 'health', label: 'Health', icon: Activity, path: '/dashboard/health' },
          { id: 'ai-history', label: 'AI History', icon: Sparkles, path: '/dashboard/ai/history' },
        ],
      };
    } else if (isStudent) {
      return {
        main: [
          { id: 'home', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
          { id: 'my-songs', label: 'My Songs', icon: Music, path: '/dashboard/songs' },
          { id: 'repertoire', label: 'Repertoire', icon: Guitar, path: '/dashboard/repertoire' },
          { id: 'my-lessons', label: 'My Lessons', icon: BookOpen, path: '/dashboard/lessons' },
          {
            id: 'my-assignments',
            label: 'My Assignments',
            icon: ClipboardList,
            path: '/dashboard/assignments',
          },
          { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/dashboard/calendar' },
          { id: 'theory', label: 'Theory', icon: GraduationCap, path: '/dashboard/theory' },
          { id: 'fretboard', label: 'Fretboard', icon: Grid3X3, path: '/dashboard/fretboard' },
        ],
        student: [{ id: 'my-stats', label: 'My Stats', icon: BarChart, path: '/dashboard/stats' }],
      };
    }
    return { main: [], admin: [] };
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2">
              <SidebarMenuButton size="lg" asChild className="flex-1">
                <Link href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Guitar className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">GuitarStudio</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {isAdmin ? 'Admin' : isTeacher ? 'Teacher' : isStudent ? 'Student' : 'User'}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
              <SidebarTrigger className="ml-auto" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.main.map((item) => {
                const isActive =
                  pathname === item.path ||
                  (item.path !== '/dashboard' && pathname?.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.path}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Tools */}
        {menuItems.admin && menuItems.admin.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>
                {isAdmin || isTeacher ? 'Admin Tools' : 'Statistics'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.admin.map((item) => {
                    const isActive =
                      pathname === item.path ||
                      (item.path !== '/dashboard' && pathname?.startsWith(item.path));
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link href={item.path}>
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Student Stats */}
        {menuItems.student && menuItems.student.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Statistics</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.student.map((item) => {
                    const isActive =
                      pathname === item.path ||
                      (item.path !== '/dashboard' && pathname?.startsWith(item.path));
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                          <Link href={item.path}>
                            <item.icon className="size-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2">
              <FontSwitcherDropdown />
              <ModeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex-1 justify-start"
              >
                <LogOut className="size-4 mr-2" />
                <span>Sign Out</span>
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
