import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { LessonStatusEnum } from '@/schemas';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return withApiAuth(request, async () => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);

      const format = searchParams.get('format') || 'json';
      const userId = searchParams.get('userId');
      const status = searchParams.get('status');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const includeSongs = searchParams.get('includeSongs') === 'true';
      const includeProfiles = searchParams.get('includeProfiles') === 'true';

      // Build query
      let query = supabase.from('lessons').select(`
        *,
        ${
          includeProfiles
            ? 'profile:profiles!lessons_student_id_fkey(email, firstName, lastName),'
            : ''
        }
        ${
          includeProfiles
            ? 'teacher_profile:profiles!lessons_teacher_id_fkey(email, firstName, lastName),'
            : ''
        }
        ${includeSongs ? 'lesson_songs(song_id, status, songs(title, author, level, key))' : ''}
      `);

      if (userId) {
        query = query.or(`student_id.eq.${userId},teacher_id.eq.${userId}`);
      }

      if (status) {
        try {
          LessonStatusEnum.parse(status.toUpperCase());
          query = query.eq('status', status.toUpperCase());
        } catch {
          return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
        }
      }

      if (dateFrom) {
        query = query.gte('date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('date', dateTo);
      }

      query = query.order('created_at', { ascending: false });

      const { data: lessons, error } = await query;

      if (error) {
        logger.error('Error fetching lessons for export:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Type assertion for lessons data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lessonsData = lessons as any[];

      // Process data based on format
      let exportData;
      let contentType;
      let filename;

      switch (format.toLowerCase()) {
        case 'json':
          exportData = JSON.stringify(
            {
              exportDate: new Date().toISOString(),
              totalLessons: lessonsData?.length || 0,
              filters: {
                userId,
                status,
                dateFrom,
                dateTo,
                includeSongs,
                includeProfiles,
              },
              lessons: lessonsData || [],
            },
            null,
            2
          );
          contentType = 'application/json';
          filename = `lessons_export_${new Date().toISOString().split('T')[0]}.json`;
          break;

        case 'csv':
          if (!lessonsData || lessonsData.length === 0) {
            exportData = 'No lessons found';
          } else {
            const headers = [
              'ID',
              'Title',
              'Student ID',
              'Teacher ID',
              'Date',
              'Time',
              'Status',
              'Notes',
              'Created At',
              'Updated At',
            ];

            if (includeProfiles) {
              headers.push('Student Email', 'Student Name', 'Teacher Email', 'Teacher Name');
            }

            if (includeSongs) {
              headers.push('Songs Count');
            }

            const csvRows = [headers.join(',')];

            for (const lesson of lessonsData) {
              const row = [
                lesson.id,
                `"${lesson.title || ''}"`,
                lesson.student_id,
                lesson.teacher_id,
                lesson.date || '',
                lesson.time || '',
                lesson.status,
                `"${lesson.notes || ''}"`,
                lesson.created_at,
                lesson.updated_at,
              ];

              if (includeProfiles) {
                row.push(
                  `"${lesson.profile?.email || ''}"`,
                  `"${lesson.profile?.firstName || ''} ${lesson.profile?.lastName || ''}"`,
                  `"${lesson.teacher_profile?.email || ''}"`,
                  `"${lesson.teacher_profile?.firstName || ''} ${
                    lesson.teacher_profile?.lastName || ''
                  }"`
                );
              }

              if (includeSongs) {
                row.push(lesson.lesson_songs?.length || 0);
              }

              csvRows.push(row.join(','));
            }

            exportData = csvRows.join('\n');
          }
          contentType = 'text/csv';
          filename = `lessons_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        default:
          return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
      }

      // Return the export data
      return new NextResponse(exportData, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      logger.error('Error in lesson export API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
