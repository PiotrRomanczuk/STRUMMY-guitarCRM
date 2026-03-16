import Link from 'next/link';
import { LessonWithProfiles } from '@/schemas/LessonSchema';
import SendEmailButton from './SendEmailButton';

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
    // If it's a full ISO string (from scheduled_at), extract time
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // If it's just a time string (HH:mm:ss)
    const date = new Date(`2000-01-01T${timeStr}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Invalid Time';
  }
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const isCompleted = status === 'COMPLETED';
  const className = isCompleted
    ? 'bg-green-100 dark:bg-green-900/30 text-green-800'
    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800';

  return (
    <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${className}`}>
      {status || 'SCHEDULED'}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">{label}</h2>
      <p className="text-lg text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function ActionButtons({
  lessonId,
  canEdit,
  canDelete,
  onDelete,
}: {
  lessonId: string;
  canEdit: boolean;
  canDelete: boolean;
  onDelete: (formData: FormData) => void;
}) {
  return (
    <div className="flex gap-3 mt-8 flex-wrap">
      {canEdit && (
        <Link
          href={`/dashboard/lessons/${lessonId}/edit`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          data-testid="lesson-edit-button"
        >
          Edit
        </Link>
      )}

      {canEdit && <SendEmailButton lessonId={lessonId} />}

      {canDelete && (
        <form action={onDelete} className="inline">
          <button
            type="submit"
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
            data-testid="lesson-delete-button"
          >
            Delete
          </button>
        </form>
      )}

      <Link
        href="/dashboard/lessons"
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
      >
        Back
      </Link>
    </div>
  );
}

function LessonHeader({ title, id, status }: { title?: string; id?: string; status?: string }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {title || 'Untitled'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{id}</code>
        </p>
      </div>

      <div>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function LessonInfoGrid({ lesson }: { lesson: LessonDetailsCardProps['lesson'] }) {
  // Fallback to scheduled_at if date/start_time are missing (for imported lessons)
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <InfoItem
        label="Student"
        value={lesson.profile?.full_name || lesson.profile?.email || 'Unknown'}
      />
      <InfoItem
        label="Teacher"
        value={lesson.teacher_profile?.full_name || lesson.teacher_profile?.email || 'Unknown'}
      />
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
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6"
      data-testid="lesson-detail"
    >
      <LessonHeader
        title={lesson.title || undefined}
        id={lesson.id}
        status={lesson.status || undefined}
      />

      <LessonInfoGrid lesson={lesson} />

      {lesson.notes && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase mb-2">Notes</h2>
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{lesson.notes}</p>
        </div>
      )}

      <ActionButtons
        lessonId={lesson.id || ''}
        canEdit={canEdit}
        canDelete={canDelete}
        onDelete={onDelete}
      />
    </div>
  );
}
