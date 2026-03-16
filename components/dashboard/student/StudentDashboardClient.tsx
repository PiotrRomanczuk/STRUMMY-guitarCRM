'use client';

import { motion } from 'framer-motion';
import { StudentDashboardData } from '@/app/actions/student/dashboard';
import { RecentActivity } from '@/components/dashboard/student/RecentActivity';
import { SongLibrary } from '@/components/songs/student/SongLibrary';
import { AssignmentList } from '@/components/assignments/student/AssignmentList';
import { DashboardStatsGrid } from '@/components/dashboard/DashboardStatsGrid';
import { NextLessonCard } from '@/components/dashboard/student/NextLessonCard';
import { LastLessonCard } from '@/components/dashboard/student/LastLessonCard';
import { ProgressChart } from '@/components/dashboard/student/ProgressChart';
import { PracticeTimerCard } from '@/components/dashboard/student/PracticeTimerCard';
import { PracticeToday } from '@/components/dashboard/student/PracticeToday';
import type { PracticeTodaySong } from '@/components/dashboard/student/PracticeToday';
import { SongOfTheWeekCard } from '@/components/song-of-the-week';
import type { SongOfTheWeekWithSong } from '@/types/SongOfTheWeek';
import { listItem } from '@/lib/animations';

interface StudentDashboardClientProps {
  data: StudentDashboardData;
  email?: string;
  sotw?: SongOfTheWeekWithSong | null;
  sotwInRepertoire?: boolean;
}

export function StudentDashboardClient({ data, sotw, sotwInRepertoire = false }: StudentDashboardClientProps) {
  // Transform data for components
  const activities = [
    ...(data.lastLesson
      ? [
          {
            id: 'lesson-' + data.lastLesson.id,
            type: 'lesson_completed' as const,
            message: `Completed lesson: ${data.lastLesson.title || 'Untitled'}`,
            time: new Date(data.lastLesson.scheduled_at).toLocaleDateString(),
          },
        ]
      : []),
    ...data.recentSongs.map((song) => ({
      id: 'song-' + song.id,
      type: 'song_added' as const,
      message: `Added song: ${song.title}`,
      time: new Date(song.last_played).toLocaleDateString(),
    })),
  ].slice(0, 5);

  // Create weekly chart data based on student's data
  const chartData = [
    {
      name: 'Mon',
      lessons: data.stats.completedLessons > 0 ? 1 : 0,
      assignments: data.assignments.length > 0 ? 1 : 0,
    },
    {
      name: 'Tue',
      lessons: data.stats.completedLessons > 1 ? 1 : 0,
      assignments: data.assignments.length > 1 ? 1 : 0,
    },
    {
      name: 'Wed',
      lessons: data.stats.completedLessons > 2 ? 1 : 0,
      assignments: data.assignments.length > 2 ? 2 : 0,
    },
    { name: 'Thu', lessons: 0, assignments: data.assignments.length > 3 ? 1 : 0 },
    {
      name: 'Fri',
      lessons: data.stats.completedLessons > 3 ? 2 : 0,
      assignments: data.assignments.length > 4 ? 2 : 0,
    },
    {
      name: 'Sat',
      lessons: data.stats.completedLessons > 4 ? 3 : 0,
      assignments: Math.min(data.assignments.length, 3),
    },
    {
      name: 'Sun',
      lessons: data.stats.completedLessons > 5 ? 2 : 0,
      assignments: Math.min(data.assignments.length, 2),
    },
  ];

  const songs = data.recentSongs.map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    difficulty: 'Medium' as const, // Mocked
    duration: '3:45', // Mocked
    studentsLearning: 12, // Mocked
  }));

  const assignments = data.assignments.map((a) => ({
    id: a.id,
    title: a.title,
    studentName: 'You', // Mocked
    dueDate: a.due_date || 'No due date',
    status: (a.status === 'completed'
      ? 'completed'
      : a.status === 'overdue'
      ? 'overdue'
      : 'pending') as 'pending' | 'completed' | 'overdue',
  }));

  // Defaults to 'started' since the dashboard action doesn't fetch individual song statuses
  const practiceSongs: PracticeTodaySong[] = data.recentSongs.map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    status: 'started' as const,
    lastLessonDate: s.last_played,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <motion.div
        variants={listItem}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2"
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back, {data.studentName || 'Student'}!
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {data.stats.completedLessons > 0
            ? `You've completed ${data.stats.completedLessons} lesson${
                data.stats.completedLessons === 1 ? '' : 's'
              }. Keep up the great work!`
            : "Here's what's happening with your guitar journey."}
        </p>
      </motion.div>

      {/* Song of the Week - featured spotlight */}
      {sotw && (
        <motion.div variants={listItem} initial="hidden" animate="visible">
          <SongOfTheWeekCard
            sotw={sotw}
            sotwInRepertoire={sotwInRepertoire}
            isStudent
          />
        </motion.div>
      )}

      {/* Practice focus - first thing students see after greeting */}
      <PracticeToday songs={practiceSongs} />

      {/* API-driven stats */}
      <DashboardStatsGrid />

      <NextLessonCard lesson={data.nextLesson} />

      {data.lastLesson && (
        <LastLessonCard lesson={data.lastLesson} />
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <ProgressChart data={chartData} />
          <SongLibrary songs={songs} />
        </div>
        <div className="space-y-6 sm:space-y-8">
          <PracticeTimerCard songs={data.allSongs} />
          <RecentActivity activities={activities} />
          <AssignmentList assignments={assignments} />
        </div>
      </div>
    </div>
  );
}
