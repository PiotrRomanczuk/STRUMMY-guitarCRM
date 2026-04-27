#!/usr/bin/env tsx

/**
 * Import @JustMeAndGuitars content plan from the May 2026 XLSX into Strummy.
 *
 * Usage:
 *   npx tsx scripts/database/seeding/import-content-plan.ts            # local DB
 *   npx tsx scripts/database/seeding/import-content-plan.ts --remote   # remote DB
 *   npx tsx scripts/database/seeding/import-content-plan.ts --dry-run  # parse only
 *
 * Idempotent: re-running upserts the same songs, hashtag sets, and posts
 * (natural key (song_id, platform, scheduled_at) for posts).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import {
  type SongDbRow,
  type CalendarRow,
  type PerformanceRow,
  type HashtagRow,
  statusToPriorityBucket,
  statusToProductionStatus,
  calendarStatusToPostStatus,
  parseShortDate,
  parseTimeOfDay,
  combineDateTime,
  pickPlatform,
  splitHashtags,
  normalizeArtist,
  normalizeTitle,
} from './import-content-plan.parser';

config({ path: path.join(process.cwd(), '.env.local') });

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const PLAN_YEAR = 2026;
const XLSX_PATH = path.join(process.cwd(), 'data', 'JustMeAndGuitar_ENHANCED_Plan_May2026.xlsx');

function getClient(useRemote: boolean): SupabaseClient {
  if (useRemote) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error(
        '❌ Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'
      );
      process.exit(1);
    }
    console.log('📍 Targeting REMOTE database\n');
    return createClient(url, key);
  }
  console.log('📍 Targeting LOCAL database\n');
  return createClient(LOCAL_URL, LOCAL_SERVICE_KEY);
}

function readSheet<T>(wb: XLSX.WorkBook, sheetName: string, headerRow: number): T[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: headerRow,
    defval: null,
  });
  return json as T[];
}

function parseSongs(wb: XLSX.WorkBook): SongDbRow[] {
  const raw = readSheet<Record<string, unknown>>(wb, '🎸 Song Database', 1);
  return raw
    .filter((r) => r['SONG'] && r['ARTIST'])
    .map((r) => ({
      num: typeof r['#'] === 'number' ? (r['#'] as number) : null,
      title: String(r['SONG']),
      artist: String(r['ARTIST']),
      genre: r['GENRE'] ? String(r['GENRE']) : null,
      difficulty: r['DIFFICULTY'] ? String(r['DIFFICULTY']) : null,
      technique: r['TECHNIQUE'] ? String(r['TECHNIQUE']) : null,
      status: r['STATUS'] ? String(r['STATUS']) : null,
      priority: r['PRIORITY'] ? String(r['PRIORITY']) : null,
      notes: r['NOTES'] ? String(r['NOTES']) : null,
    }));
}

function parseCalendar(wb: XLSX.WorkBook): CalendarRow[] {
  const raw = readSheet<Record<string, unknown>>(wb, '📅 May Calendar', 2);
  return raw
    .filter((r) => r['DATE'] && r['VIDEO'])
    .map((r) => ({
      date: String(r['DATE']),
      day: String(r['DAY'] ?? ''),
      time: r['TIME'] ? String(r['TIME']) : null,
      song: String(r['VIDEO']),
      hook: r['HOOK (1st 3 sec)'] ? String(r['HOOK (1st 3 sec)']) : null,
      hashtags: r['HASHTAGS'] ? String(r['HASHTAGS']) : null,
      story1: r['STORY 1'] ? String(r['STORY 1']) : null,
      story2: r['STORY 2'] ? String(r['STORY 2']) : null,
      story3: r['STORY 3'] ? String(r['STORY 3']) : null,
      status: r['STATUS'] ? String(r['STATUS']) : null,
      views: typeof r['VIEWS'] === 'number' ? (r['VIEWS'] as number) : null,
      caption: r['CAPTION'] ? String(r['CAPTION']) : null,
    }));
}

function parsePerformance(wb: XLSX.WorkBook): PerformanceRow[] {
  const raw = readSheet<Record<string, unknown>>(wb, '📊 Performance Tracker', 1);
  return raw
    .filter((r) => r['SONG'])
    .map((r) => ({
      date: String(r['DATE'] ?? ''),
      song: String(r['SONG']),
      views: Number(r['VIEWS'] ?? 0) || 0,
      likes: Number(r['LIKES'] ?? 0) || 0,
      comments: Number(r['COMMENTS'] ?? 0) || 0,
      shares: Number(r['SHARES'] ?? 0) || 0,
      saves: Number(r['SAVES'] ?? 0) || 0,
    }));
}

function parseHashtagStrategy(wb: XLSX.WorkBook): HashtagRow[] {
  const raw = readSheet<Record<string, unknown>>(wb, '# Hashtag Strategy', 2);
  return raw
    .filter((r) => r['HASHTAG'])
    .map((r) => ({
      hashtag: String(r['HASHTAG']),
      type: r['TYPE'] ? String(r['TYPE']) : null,
      size: r['SIZE'] ? String(r['SIZE']) : null,
      whenToUse: r['WHEN TO USE'] ? String(r['WHEN TO USE']) : null,
    }));
}

interface Counters {
  songsCreated: number;
  songsUpdated: number;
  recordingStubs: number;
  hashtagSets: number;
  posts: number;
  metrics: number;
}

async function findSongId(
  supabase: SupabaseClient,
  title: string,
  artist: string
): Promise<string | null> {
  const tn = normalizeTitle(title);
  const an = normalizeArtist(artist);
  const { data } = await supabase
    .from('songs')
    .select('id, title, author')
    .ilike('title', `%${title.split(/\s+/)[0]}%`)
    .limit(40);
  if (!data) return null;
  for (const row of data) {
    if (normalizeTitle(row.title ?? '') === tn && normalizeArtist(row.author ?? '') === an) {
      return row.id as string;
    }
  }
  return null;
}

async function upsertSongs(
  supabase: SupabaseClient,
  songs: SongDbRow[],
  dryRun: boolean,
  c: Counters
): Promise<Map<string, string>> {
  const titleArtistToId = new Map<string, string>();

  for (const s of songs) {
    const key = `${normalizeTitle(s.title)}|${normalizeArtist(s.artist)}`;
    const existingId = await findSongId(supabase, s.title, s.artist);
    const bucket = statusToPriorityBucket(s.status);
    if (existingId) {
      titleArtistToId.set(key, existingId);
      if (!dryRun && bucket) {
        const { error } = await supabase
          .from('songs')
          .update({ priority_bucket: bucket })
          .eq('id', existingId);
        if (error) console.warn(`⚠️ Failed to update bucket for ${s.title}: ${error.message}`);
      }
      c.songsUpdated++;
      continue;
    }
    if (dryRun) {
      console.log(`  [dry] would create song: ${s.title} - ${s.artist}`);
      c.songsCreated++;
      continue;
    }
    const { data, error } = await supabase
      .from('songs')
      .insert({
        title: s.title,
        author: s.artist,
        priority_bucket: bucket,
        category: s.genre,
      })
      .select('id')
      .single();
    if (error) {
      console.warn(`⚠️ Failed to insert ${s.title}: ${error.message}`);
      continue;
    }
    if (data) titleArtistToId.set(key, data.id as string);
    c.songsCreated++;
  }
  return titleArtistToId;
}

async function upsertHashtagSets(
  supabase: SupabaseClient,
  rows: HashtagRow[],
  dryRun: boolean,
  c: Counters
): Promise<Map<string, string>> {
  // Group by TYPE bucket (CORE/SPECIFIC/TRENDING/etc.)
  const byType = new Map<string, string[]>();
  for (const row of rows) {
    const type = (row.type ?? 'OTHER').toLowerCase();
    const list = byType.get(type) ?? [];
    list.push(row.hashtag);
    byType.set(type, list);
  }

  const idByName = new Map<string, string>();
  for (const [name, hashtags] of byType) {
    if (dryRun) {
      console.log(`  [dry] would upsert hashtag set "${name}" (${hashtags.length} tags)`);
      c.hashtagSets++;
      continue;
    }
    const { data: existing } = await supabase
      .from('hashtag_sets')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    if (existing) {
      await supabase
        .from('hashtag_sets')
        .update({ hashtags, is_active: true })
        .eq('id', existing.id);
      idByName.set(name, existing.id as string);
    } else {
      const { data, error } = await supabase
        .from('hashtag_sets')
        .insert({ name, hashtags, is_active: true })
        .select('id')
        .single();
      if (error) {
        console.warn(`⚠️ Failed hashtag set ${name}: ${error.message}`);
        continue;
      }
      if (data) idByName.set(name, data.id as string);
    }
    c.hashtagSets++;
  }
  return idByName;
}

async function ensureRecordingStub(
  supabase: SupabaseClient,
  songId: string,
  song: SongDbRow,
  uploadedBy: string,
  dryRun: boolean
): Promise<string | null> {
  if (dryRun) return null;
  const { data: existing } = await supabase
    .from('song_videos')
    .select('id')
    .eq('song_id', songId)
    .order('display_order', { ascending: true })
    .limit(1);
  if (existing && existing.length > 0) {
    await supabase
      .from('song_videos')
      .update({ production_status: statusToProductionStatus(song.status) })
      .eq('id', existing[0].id);
    return existing[0].id as string;
  }
  const { data, error } = await supabase
    .from('song_videos')
    .insert({
      song_id: songId,
      uploaded_by: uploadedBy,
      google_drive_file_id: `placeholder-${songId}`,
      title: song.title,
      filename: `${song.title}.placeholder`,
      mime_type: 'video/mp4',
      production_status: statusToProductionStatus(song.status),
      video_type: 'short',
    })
    .select('id')
    .single();
  if (error) {
    console.warn(`⚠️ Failed recording stub for ${song.title}: ${error.message}`);
    return null;
  }
  return data?.id ?? null;
}

async function upsertPosts(
  supabase: SupabaseClient,
  rows: CalendarRow[],
  songIdMap: Map<string, string>,
  performance: PerformanceRow[],
  dryRun: boolean,
  c: Counters
): Promise<void> {
  // Build a lookup table for performance numbers (by song name)
  const perfBySong = new Map<string, PerformanceRow>();
  for (const p of performance) {
    perfBySong.set(normalizeTitle(p.song), p);
  }

  for (const row of rows) {
    const dateOnly = parseShortDate(row.date, PLAN_YEAR);
    if (!dateOnly) continue;
    const time = parseTimeOfDay(row.time);
    const scheduledAt = combineDateTime(dateOnly, time);

    // Find song id — try fuzzy by first word match
    let songId: string | null = null;
    for (const [key, id] of songIdMap.entries()) {
      const [titlePart] = key.split('|');
      if (titlePart && normalizeTitle(row.song).includes(titlePart.split(' ')[0])) {
        songId = id;
        break;
      }
    }
    if (!songId) {
      const found = await findSongId(supabase, row.song.split(/[–-]/)[0].trim(), '');
      songId = found;
    }
    if (!songId) {
      console.warn(`⚠️ No song match for "${row.song}", skipping post`);
      continue;
    }

    const platform = pickPlatform(row.song);
    const status = calendarStatusToPostStatus(row.status);
    const stories = {
      morning: row.story1 ?? undefined,
      afternoon: row.story2 ?? undefined,
      evening: row.story3 ?? undefined,
    };
    const extraHashtags = splitHashtags(row.hashtags);
    const perf = perfBySong.get(normalizeTitle(row.song));

    if (dryRun) {
      console.log(`  [dry] would upsert post ${row.date} ${platform} → ${row.song}`);
      c.posts++;
      if (perf) c.metrics++;
      continue;
    }

    const payload = {
      song_id: songId,
      platform,
      status,
      scheduled_at: scheduledAt,
      hook: row.hook,
      caption: row.caption,
      extra_hashtags: extraHashtags,
      stories,
      ...(perf && {
        views_count: perf.views,
        likes_count: perf.likes,
        comments_count: perf.comments,
        shares_count: perf.shares,
        saves_count: perf.saves,
        metrics_updated_at: new Date().toISOString(),
      }),
    };

    const { data: existing } = await supabase
      .from('content_posts')
      .select('id')
      .eq('song_id', songId)
      .eq('platform', platform)
      .eq('scheduled_at', scheduledAt)
      .maybeSingle();
    let postId: string | null = null;
    if (existing) {
      await supabase.from('content_posts').update(payload).eq('id', existing.id);
      postId = existing.id as string;
    } else {
      const { data, error } = await supabase
        .from('content_posts')
        .insert(payload)
        .select('id')
        .single();
      if (error) {
        console.warn(`⚠️ Failed post ${row.date} ${row.song}: ${error.message}`);
        continue;
      }
      postId = data?.id ?? null;
    }
    c.posts++;

    if (postId && perf) {
      await supabase.from('content_post_metrics').insert({
        post_id: postId,
        captured_at: new Date().toISOString(),
        views_count: perf.views,
        likes_count: perf.likes,
        comments_count: perf.comments,
        shares_count: perf.shares,
        saves_count: perf.saves,
      });
      c.metrics++;
    }
  }
}

async function pickFirstAdminId(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true)
    .limit(1)
    .maybeSingle();
  if (!data) {
    console.error('❌ No admin profile found — cannot create song_videos rows');
    process.exit(1);
  }
  return data.id as string;
}

async function main() {
  console.log('🎬 CONTENT PLAN IMPORTER');
  console.log('========================\n');

  const args = process.argv.slice(2);
  const useRemote = args.includes('--remote');
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`❌ XLSX not found at ${XLSX_PATH}`);
    console.error('   Place the file at data/JustMeAndGuitar_ENHANCED_Plan_May2026.xlsx');
    process.exit(1);
  }

  const wb = XLSX.readFile(XLSX_PATH);
  const songs = parseSongs(wb);
  const calendar = parseCalendar(wb);
  const performance = parsePerformance(wb);
  const hashtags = parseHashtagStrategy(wb);

  console.log(
    `📦 Parsed: ${songs.length} songs / ${calendar.length} calendar / ` +
      `${performance.length} perf / ${hashtags.length} hashtags\n`
  );

  const supabase = getClient(useRemote);
  const counters: Counters = {
    songsCreated: 0,
    songsUpdated: 0,
    recordingStubs: 0,
    hashtagSets: 0,
    posts: 0,
    metrics: 0,
  };

  const songIdMap = await upsertSongs(supabase, songs, dryRun, counters);
  await upsertHashtagSets(supabase, hashtags, dryRun, counters);

  if (!dryRun) {
    const adminId = await pickFirstAdminId(supabase);
    for (const s of songs) {
      const key = `${normalizeTitle(s.title)}|${normalizeArtist(s.artist)}`;
      const songId = songIdMap.get(key);
      if (!songId) continue;
      const stubId = await ensureRecordingStub(supabase, songId, s, adminId, dryRun);
      if (stubId) counters.recordingStubs++;
    }
  }

  await upsertPosts(supabase, calendar, songIdMap, performance, dryRun, counters);

  console.log('\n📊 Summary:');
  console.log(`   songs created:    ${counters.songsCreated}`);
  console.log(`   songs updated:    ${counters.songsUpdated}`);
  console.log(`   recording stubs:  ${counters.recordingStubs}`);
  console.log(`   hashtag sets:     ${counters.hashtagSets}`);
  console.log(`   posts:            ${counters.posts}`);
  console.log(`   metric snapshots: ${counters.metrics}`);
  console.log(dryRun ? '\n✅ Dry run complete' : '\n✅ Import complete');
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
