'use client';

import { motion } from 'framer-motion';
import { tapScale } from '@/lib/animations/variants';
import { Calendar, Mail, User, Clock, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getHealthStatusColor, type HealthStatus } from '@/lib/utils/studentHealth';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export interface HealthCardStudent {
  id: string;
  name: string;
  email: string;
  healthScore: number;
  healthStatus: HealthStatus;
  lastLesson: Date | null;
  lessonsThisMonth: number;
  overdueAssignments: number;
  recommendedAction: string;
}

interface HealthCardProps {
  student: HealthCardStudent;
  onSendMessage?: (studentId: string) => void;
}

/**
 * v2 student health card for mobile.
 * Shows health score, status, recent activity, and quick actions.
 */
export function HealthCard({ student, onSendMessage }: HealthCardProps) {
  const healthColors = getHealthStatusColor(student.healthStatus);

  return (
    <motion.div
      {...tapScale}
      className="bg-card rounded-xl border border-border p-4 space-y-3 active:bg-muted/50 transition-colors"
    >
      {/* Row 1: Name + Health score */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{student.name}</p>
          <p className="text-xs text-muted-foreground truncate">{student.email}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`w-3 h-3 rounded-full ${healthColors.bg} ${healthColors.border} border`}
            aria-label={`Health: ${student.healthStatus.replace('_', ' ')}`}
          />
          <span className={`text-lg font-bold ${healthColors.text}`}>
            {student.healthScore}
          </span>
        </div>
      </div>

      {/* Row 2: Activity stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {student.lastLesson
            ? formatDistanceToNow(new Date(student.lastLesson), { addSuffix: true })
            : 'Never'}
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {student.lessonsThisMonth}/mo
        </span>
        {student.overdueAssignments > 0 && (
          <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
            {student.overdueAssignments} overdue
          </Badge>
        )}
      </div>

      {/* Row 3: Recommendation */}
      <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
        {student.recommendedAction}
      </p>

      {/* Row 4: Actions -- icon-only below 390px, icon+label above */}
      <div className="flex items-center gap-1 pt-1 border-t border-border">
        <Link href={`/dashboard/lessons?student=${student.id}`} className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full min-h-[44px] text-xs gap-1.5"
            aria-label={`Schedule lesson for ${student.name}`}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="hidden min-[400px]:inline">Schedule</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 min-h-[44px] text-xs gap-1.5"
          onClick={() => onSendMessage?.(student.id)}
          aria-label={`Message ${student.name}`}
        >
          <Mail className="h-4 w-4 shrink-0" />
          <span className="hidden min-[400px]:inline">Message</span>
        </Button>
        <Link href={`/dashboard/users/${student.id}`} className="flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full min-h-[44px] text-xs gap-1.5"
            aria-label={`View ${student.name}'s profile`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="hidden min-[400px]:inline">Profile</span>
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
