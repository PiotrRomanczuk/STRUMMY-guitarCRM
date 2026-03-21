import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    

    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: song, error } = await supabase
      .from("songs")
      .select("id, title, author, level, key, chords, audio_files, gallery_images, cover_image_url, youtube_url, ultimate_guitar_link, spotify_link_url, tiktok_short_url, lyrics_with_chords, short_title, notes, category, capo_fret, strumming_pattern, tempo, time_signature, duration_ms, release_year, search_vector, deleted_at, created_at, updated_at")
      .eq("id", id)
      .single();

    

    if (error || !song) {
      
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    
    return NextResponse.json(song);
  } catch (error) {
    logger.error(`Error in song API:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
