import Link from 'next/link';
import { Calendar, Clock, User, Hash } from 'lucide-react';
import { formatLessonDate, formatLessonTime } from './lesson.helpers';

interface DetailsCardProps {
  displayDate: string | null;
  displayTime: string | null;
  studentName: string;
  teacherName: string;
  lessonNumber: number | null;
  studentId?: string;
  teacherId?: string;
}

export function DetailsCard({
  displayDate,
  displayTime,
  studentName,
  teacherName,
  lessonNumber,
  studentId,
  teacherId,
}: DetailsCardProps) {
  return (
    <div className="bg-card rounded-xl p-6 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Details
      </h3>
      <MetaRow icon={<Calendar />} label="Date" value={formatLessonDate(displayDate)} />
      {displayTime && (
        <MetaRow icon={<Clock />} label="Time" value={formatLessonTime(displayTime)} />
      )}
      <MetaRow
        icon={<User />}
        label="Student"
        value={studentName}
        href={studentId ? `/dashboard/users/${studentId}` : undefined}
      />
      <MetaRow
        icon={<User />}
        label="Teacher"
        value={teacherName}
        href={teacherId ? `/dashboard/users/${teacherId}` : undefined}
      />
      {lessonNumber && (
        <MetaRow icon={<Hash />} label="Lesson #" value={String(lessonNumber)} />
      )}
    </div>
  );
}

function MetaRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:h-4 [&_svg]:w-4 text-primary/60">{icon}</span>
        <span className="text-sm">{label}</span>
      </span>
      {href ? (
        <Link href={href} className="text-sm font-semibold text-primary hover:underline">
          {value}
        </Link>
      ) : (
        <span className="text-sm font-semibold text-foreground">{value}</span>
      )}
    </div>
  );
}
