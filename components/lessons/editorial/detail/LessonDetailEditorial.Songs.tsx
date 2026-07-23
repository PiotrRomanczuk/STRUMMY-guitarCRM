import Link from 'next/link';

import type { LessonDetail } from '@/lib/services/lesson-detail-queries';

import { Card, CardHeader } from './primitives';
import { LessonSongStepper } from './LessonDetailEditorial.SongStepper';

type SongRow = LessonDetail['songs'][number];

const SongEntry = ({
  song,
  lessonId,
  canEdit,
  isLast,
}: {
  song: SongRow;
  lessonId: string;
  canEdit: boolean;
  isLast: boolean;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr',
      gap: 12,
      padding: '14px 22px',
      borderBottom: isLast ? 'none' : '1px solid var(--rule)',
      alignItems: 'start',
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        background: 'linear-gradient(135deg, var(--gold-dim), var(--gold-2))',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--serif)',
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      {song.key ?? '·'}
    </div>
    <div style={{ minWidth: 0 }}>
      <Link
        href={`/dashboard/songs/${song.songId}`}
        className="ed-row"
        style={{
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'inherit',
          textDecoration: 'none',
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {song.title}
      </Link>
      {song.author && (
        <div
          style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}
        >
          {song.author}
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <LessonSongStepper
          lessonId={lessonId}
          songId={song.songId}
          initialStatus={song.status}
          readOnly={!canEdit}
        />
      </div>
    </div>
  </div>
);

export const LessonSongsCard = ({
  lesson,
  canEdit,
}: {
  lesson: LessonDetail;
  canEdit: boolean;
}) => (
  <Card>
    <CardHeader eyebrow="Repertoire" title={`Songs in this lesson · ${lesson.songs.length}`} />
    {lesson.songs.length === 0 ? (
      <div
        style={{
          padding: '32px 24px',
          textAlign: 'center',
          color: 'var(--ink-4)',
          fontStyle: 'italic',
          fontFamily: 'var(--serif)',
          fontSize: 14,
        }}
      >
        No songs attached to this lesson yet.
      </div>
    ) : (
      lesson.songs.map((song, i) => (
        <SongEntry
          key={song.songId}
          song={song}
          lessonId={lesson.id}
          canEdit={canEdit}
          isLast={i === lesson.songs.length - 1}
        />
      ))
    )}
  </Card>
);
