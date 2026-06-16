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
import { ModeToggle } from '@/components/ui/mode-toggle';
import { roleChipsLabel, teachingGroupLabel } from '@/lib/roles/roleLabel';
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
        teaching: [
          { id: 'home', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
          { id: 'lessons', label: 'Lessons', icon: BookOpen, path: '/dashboard/lessons' },
          { id: 'songs', label: 'Songs', icon: Music, path: '/dashboard/songs' },
          {
            id: 'assignments',
            label: 'Assignments',
            icon: ClipboardList,
            path: '/dashboard/assignments',
          },
          { id: 'theory', label: 'Theory', icon: GraduationCap, path: '/dashboard/theory' },
        ],
        students: [{ id: 'users', label: 'Students', icon: Users, path: '/dashboard/users' }],
        analytics: [
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
        ],
        tools: [
          { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/dashboard/calendar' },
          // Content/Production is reached via the song-detail Production tab
          // (decision D-10) — no standalone Content nav entry.
          { id: 'fretboard', label: 'Fretboard', icon: Grid3X3, path: '/dashboard/fretboard' },
          { id: 'ai', label: 'AI Assistant', icon: Sparkles, path: '/dashboard/ai' },
        ],
        admin: isAdmin
          ? [
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
              { id: 'skills', label: 'Skills', icon: Zap, path: '/dashboard/skills' },
              { id: 'cohorts', label: 'Cohorts', icon: Users, path: '/dashboard/cohorts' },
              { id: 'logs', label: 'Logs', icon: FileText, path: '/dashboard/logs' },
              { id: 'health', label: 'Health', icon: Activity, path: '/dashboard/health' },
              {
                id: 'ai-history',
                label: 'AI History',
                icon: Sparkles,
                path: '/dashboard/ai/history',
              },
            ]
          : [],
      };
    }
    // Student view
    return {
      teaching: [
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
        { id: 'theory', label: 'Theory', icon: GraduationCap, path: '/dashboard/theory' },
      ],
      tools: [
        { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/dashboard/calendar' },
        { id: 'fretboard', label: 'Fretboard', icon: Grid3X3, path: '/dashboard/fretboard' },
      ],
      analytics: [{ id: 'my-stats', label: 'My Stats', icon: BarChart, path: '/dashboard/stats' }],
      students: [],
      admin: [],
    };
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) =>
    pathname === path || (path !== '/dashboard' && pathname?.startsWith(path));

  return (
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2">
              <SidebarMenuButton size="lg" asChild className="flex-1">
                <Link href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-[inset_0_-1px_0_rgba(0,0,0,.15)]">
                    <Guitar className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-serif text-base font-semibold tracking-[-0.01em]">
                      Strummy
                    </span>
                    <span className="truncate font-mono text-[10px] uppercase tracking-[.1em] text-muted-foreground">
                      {roleChipsLabel(isAdmin, isTeacher, isStudent)}
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
        {/* Teaching */}
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[.14em] font-medium">
            {teachingGroupLabel(isAdmin, isTeacher, isStudent)}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.teaching.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                    className="relative data-[active=true]:font-medium"
                  >
                    <Link href={item.path}>
                      {isActive(item.path) && (
                        <span className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary" />
                      )}
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Students */}
        {menuItems.students.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[.14em] font-medium">
              Students
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.students.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                      className="relative data-[active=true]:font-medium"
                    >
                      <Link href={item.path}>
                        {isActive(item.path) && (
                          <span className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary" />
                        )}
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Analytics */}
        {menuItems.analytics.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[.14em] font-medium">
              Analytics
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.analytics.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                      className="relative data-[active=true]:font-medium"
                    >
                      <Link href={item.path}>
                        {isActive(item.path) && (
                          <span className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary" />
                        )}
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Tools */}
        {menuItems.tools.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[.14em] font-medium">
              Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.tools.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                      className="relative data-[active=true]:font-medium"
                    >
                      <Link href={item.path}>
                        {isActive(item.path) && (
                          <span className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary" />
                        )}
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin */}
        {menuItems.admin && menuItems.admin.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[.14em] font-medium">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.admin.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.path)}
                        tooltip={item.label}
                        className="relative data-[active=true]:font-medium"
                      >
                        <Link href={item.path}>
                          {isActive(item.path) && (
                            <span className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary" />
                          )}
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2">
              <FontSwitcherDropdown />
              <ModeToggle />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
              >
                <LogOut className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
