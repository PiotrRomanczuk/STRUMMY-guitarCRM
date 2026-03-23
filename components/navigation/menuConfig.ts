import {
  Users,
  Music,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  Guitar,
  BarChart,
  FileText,
  GraduationCap,
  HeartPulse,
  CalendarDays,
  Sparkles,
  ListMusic,
  Bell,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export interface NotificationItem extends MenuItem {
  hasIndicator: boolean;
}

export const HOME_ITEM: MenuItem = {
  id: 'home',
  label: 'Home',
  icon: LayoutDashboard,
  path: '/dashboard',
};

export const NOTIFICATION_ITEM: NotificationItem = {
  id: 'notifications',
  label: 'Notifications',
  icon: Bell,
  path: '/dashboard/notifications',
  hasIndicator: true,
};

const DEMO_HIDDEN_ITEMS = ['skills', 'health', 'logs', 'cohorts', 'chord-analysis'];

function getTeacherGroups(isDemoAccount?: boolean): MenuGroup[] {
  const groups: MenuGroup[] = [
    {
      label: 'Teaching',
      items: [
        { id: 'lessons', label: 'Lessons', icon: BookOpen, path: '/dashboard/lessons' },
        { id: 'songs', label: 'Songs', icon: Music, path: '/dashboard/songs' },
        { id: 'assignments', label: 'Assignments', icon: ClipboardList, path: '/dashboard/assignments' },
        { id: 'theory', label: 'Theory', icon: GraduationCap, path: '/dashboard/theory' },
      ],
    },
    {
      label: 'Students',
      items: [
        { id: 'students', label: 'Students', icon: Users, path: '/dashboard/users' },
        { id: 'skills', label: 'Skills', icon: Zap, path: '/dashboard/skills' },
        { id: 'health', label: 'Health Monitor', icon: HeartPulse, path: '/dashboard/health' },
      ],
    },
    {
      label: 'Analytics',
      items: [
        { id: 'song-stats', label: 'Song Stats', icon: BarChart, path: '/dashboard/admin/stats/songs' },
        { id: 'lesson-stats', label: 'Lesson Stats', icon: BarChart, path: '/dashboard/admin/stats/lessons' },
        { id: 'chord-analysis', label: 'Chord Analysis', icon: ListMusic, path: '/dashboard/admin/stats/chord-analysis' },
        { id: 'cohorts', label: 'Cohorts', icon: Users, path: '/dashboard/cohorts' },
        { id: 'logs', label: 'Logs', icon: FileText, path: '/dashboard/logs' },
      ],
    },
    {
      label: 'Tools',
      items: [
        { id: 'calendar', label: 'Calendar', icon: CalendarDays, path: '/dashboard/calendar' },
        { id: 'fretboard', label: 'Fretboard', icon: Guitar, path: '/dashboard/fretboard' },
        { id: 'ai', label: 'AI Assistant', icon: Sparkles, path: '/dashboard/ai' },
      ],
    },
  ];

  if (isDemoAccount) {
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => !DEMO_HIDDEN_ITEMS.includes(item.id)),
      }))
      .filter((g) => g.items.length > 0);
  }

  return groups;
}

function getStudentGroups(): MenuGroup[] {
  return [
    {
      label: 'Learning',
      items: [
        { id: 'my-lessons', label: 'My Lessons', icon: BookOpen, path: '/dashboard/lessons' },
        { id: 'my-songs', label: 'My Songs', icon: Music, path: '/dashboard/songs' },
        { id: 'my-assignments', label: 'My Assignments', icon: ClipboardList, path: '/dashboard/assignments' },
        { id: 'theory', label: 'Theory', icon: GraduationCap, path: '/dashboard/theory' },
      ],
    },
    {
      label: 'Progress',
      items: [
        { id: 'my-stats', label: 'My Stats', icon: BarChart, path: '/dashboard/stats' },
        { id: 'repertoire', label: 'My Repertoire', icon: ListMusic, path: '/dashboard/repertoire' },
      ],
    },
  ];
}

interface RoleFlags {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isDemoAccount?: boolean;
}

export function getMenuGroups({ isAdmin, isTeacher, isStudent, isDemoAccount }: RoleFlags): MenuGroup[] {
  if (isAdmin || isTeacher) return getTeacherGroups(isDemoAccount);
  if (isStudent) return getStudentGroups();
  return [];
}
