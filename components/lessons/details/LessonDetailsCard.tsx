import Link from 'next/link';
import { LessonWithProfiles } from '@/schemas/LessonSchema';
import SendEmailButton from '../actions/SendEmailButton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ArrowLeft, Play } from 'lucide-react';

type LessonDetail = LessonWithProfiles & {
  lesson_songs: {
    song: {
      id: string;
      title: string;
      author: string;
    } | null;
  }[];
};

interface LessonDetailsCardProps {
  lesson: LessonDetail;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (formData: FormData) => void;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return 'N/A';
  try {
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const date = new Date(`2000-01-01T${timeStr}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Invalid Time';
  }
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const isCompleted = status === 'COMPLETED';

  return (
    <Badge
      variant="secondary"
      className={
        isCompleted
          ? 'bg-success/15 text-success dark:bg-success/20'
          : 'bg-primary/15 text-primary dark:bg-primary/20'
      }
    >
      {status || 'SCHEDULED'}
    </Badge>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">{label}</h2>
      <p className="text-lg text-foreground">{value}</p>
    </div>
  );
}

function ActionButtons({
  lessonId,
  lessonStatus,
  canEdit,
  canDelete,
  onDelete,
}: {
  lessonId: string;
  lessonStatus: string | null | undefined;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (formData: FormData) => void;
}) {
  const isCancelled = lessonStatus === 'CANCELLED';
  const isCompleted = lessonStatus === 'COMPLETED';

  return (
    <div className="flex gap-3 mt-8 flex-wrap">
      {canEdit && !isCancelled && (
        <Button size="lg" className="gap-2" asChild data-testid="lesson-live-button">
          <Link href={`/dashboard/lessons/${lessonId}/live`}>
            <Play className="h-5 w-5" />
            {isCompleted ? 'Review Lesson' : 'Start Lesson'}
          </Link>
        </Button>
      )}

      {canEdit && (
        <Button asChild data-testid="lesson-edit-button">
          <Link href={`/dashboard/lessons/${lessonId}/edit`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      )}

      {canEdit && <SendEmailButton lessonId={lessonId} />}

      {canDelete && (
        <form action={onDelete} className="inline">
          <Button type="submit" variant="destructive" data-testid="lesson-delete-button">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </form>
      )}

      <Button variant="outline" asChild>
        <Link href="/dashboard/lessons">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>
    </div>
  );
}

function LessonHeader({ title, id, status }: { title?: string; id?: string; status?: string }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{title || 'Untitled'}</h1>
        <p className="text-muted-foreground">
          ID: <code className="bg-muted px-2 py-1 rounded text-sm">{id}</code>
        </p>
      </div>

      <div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function LessonInfoGrid({ lesson }: { lesson: LessonDetailsCardProps['lesson'] }) {
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Student</h2>
        {lesson.profile?.id ? (
          <Link href={`/dashboard/users/${lesson.profile.id}`} className="text-lg text-primary hover:underline">
            {lesson.profile.full_name || lesson.profile.email || 'Unknown'}
          </Link>
        ) : (
          <p className="text-lg text-foreground">Unknown</p>
        )}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Teacher</h2>
        {lesson.teacher_profile?.id ? (
          <Link href={`/dashboard/users/${lesson.teacher_profile.id}`} className="text-lg text-primary hover:underline">
            {lesson.teacher_profile.full_name || lesson.teacher_profile.email || 'Unknown'}
          </Link>
        ) : (
          <p className="text-lg text-foreground">Unknown</p>
        )}
      </div>
      <InfoItem label="Date" value={formatDate(displayDate)} />
      <InfoItem label="Time" value={formatTime(displayTime)} />
      <InfoItem
        label="Lesson #"
        value={lesson.lesson_teacher_number ? String(lesson.lesson_teacher_number) : 'N/A'}
      />
    </div>
  );
}

export function LessonDetailsCard({
  lesson,
  canEdit,
  canDelete,
  onDelete,
}: LessonDetailsCardProps) {
  return (
    <Card data-testid="lesson-detail" className="mb-6">
      <CardHeader className="pb-4">
        <LessonHeader
          title={lesson.title || undefined}
          id={lesson.id}
          status={lesson.status || undefined}
        />
      </CardHeader>

      <CardContent>
        <LessonInfoGrid lesson={lesson} />

        {lesson.notes && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Notes</h2>
            <p className="text-foreground whitespace-pre-wrap">{lesson.notes}</p>
          </div>
        )}

        <ActionButtons
          lessonId={lesson.id || ''}
          lessonStatus={lesson.status}
          canEdit={canEdit}
          canDelete={canDelete}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}
