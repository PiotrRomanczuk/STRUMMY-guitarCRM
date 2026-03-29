'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RecentActivity } from '@/components/dashboard/admin/RecentActivity';
import { DashboardCalendarWidget } from '@/components/dashboard/calendar/DashboardCalendarWidget';
import { PotentialUsersList } from '@/components/dashboard/admin/PotentialUsersList';
import { BearerTokenDisplay } from '@/components/dashboard/BearerTokenDisplay';
import { NotificationsAlertsSection } from '@/components/dashboard/NotificationsAlertsSection';
import { HealthSummaryWidget } from '@/components/dashboard/health/HealthSummaryWidget';
import { GlobalSearch } from '@/components/dashboard/GlobalSearch';
import { AuditLogSection } from '@/components/dashboard/admin/AuditLogSection';
import { ServicesStatusWidget } from '@/components/dashboard/admin/ServicesStatusWidget';
import { SongOfTheWeekCard } from '@/components/song-of-the-week';
import type { SongOfTheWeekWithSong } from '@/types/SongOfTheWeek';
import { staggerContainer } from '@/lib/animations';
import { Users, BookOpen, Music, Shield, Activity, FileText } from 'lucide-react';
import Link from 'next/link';

interface RecentUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface AdminDashboardClientProps {
  stats: {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    activeStudents: number;
    totalSongs: number;
    totalLessons: number;
    recentUsers: RecentUser[];
  };
  user: { id: string; email?: string };
  profile: { full_name?: string } | null;
  viewMode?: 'admin' | 'teacher';
  sotw?: SongOfTheWeekWithSong | null;
}

export function AdminDashboardClient({
  stats,
  user,
  profile,
  viewMode,
  sotw,
}: AdminDashboardClientProps) {
  return (
    <div className="w-full max-w-full overflow-x-hidden min-w-0">
      <div className="space-y-6 sm:space-y-8 lg:space-y-10 w-full max-w-full">
        {/* Header */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Admin <span className="text-primary">Control Center</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-sm sm:text-base text-muted-foreground">
                System-wide oversight for {profile?.full_name || user?.email}
              </p>
              {viewMode === 'admin' && (
                <Link
                  href="/dashboard"
                  className="text-xs text-primary hover:underline flex items-center gap-1 ml-2"
                >
                  <Users className="h-3 w-3" />
                  Teacher View
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch />
          </div>
        </motion.section>

        {/* System Notifications & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <NotificationsAlertsSection />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <HealthSummaryWidget />
            <ServicesStatusWidget />
          </div>
        </div>

        {/* Global Stats */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">System Metrics</h2>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              variant="gradient"
              href="/dashboard/users"
              delay={100}
            />
            <StatsCard
              title="Active Teachers"
              value={stats.totalTeachers}
              icon={Shield}
              variant="gradient"
              delay={150}
              iconColor="text-indigo-500"
              iconBgColor="bg-indigo-500/10"
            />
            <StatsCard
              title="Active Students"
              value={stats.activeStudents}
              description={`of ${stats.totalStudents} total`}
              icon={Users}
              variant="gradient"
              delay={200}
              iconColor="text-emerald-500"
              iconBgColor="bg-emerald-500/10"
            />
            <StatsCard
              title="Total Songs"
              value={stats.totalSongs}
              icon={Music}
              variant="gradient"
              href="/dashboard/songs"
              delay={250}
              iconColor="text-amber-500"
              iconBgColor="bg-amber-500/10"
            />
            <StatsCard
              title="Total Lessons"
              value={stats.totalLessons}
              icon={BookOpen}
              variant="gradient"
              delay={300}
              iconColor="text-rose-500"
              iconBgColor="bg-rose-500/10"
            />
          </div>
        </section>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Audit Logs */}
          <div className="lg:col-span-2">
            <AuditLogSection />
          </div>

          {/* Quick Admin Actions */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Administrative Actions</CardTitle>
              <CardDescription>Direct access to system modules</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              <AdminActionLink href="/dashboard/users" icon={Users} label="User Management" />
              <AdminActionLink href="/dashboard/songs" icon={Music} label="Song Library" />
              <AdminActionLink href="/dashboard/logs" icon={FileText} label="Activity Logs" />
            </CardContent>
          </Card>
        </div>

        {/* Song of the Week Management */}
        <SongOfTheWeekCard sotw={sotw ?? null} isAdmin />

        {/* Lower Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity recentUsers={stats.recentUsers} />
          <PotentialUsersList />
        </div>

        {/* Calendar Widget */}
        <DashboardCalendarWidget />

        {/* Bottom Sections */}
        <div className="pb-10">
          <BearerTokenDisplay />
        </div>
      </div>
    </div>
  );
}

function AdminActionLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-medium group-hover:text-primary transition-colors">
          {label}
        </span>
      </div>
      <Shield className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
