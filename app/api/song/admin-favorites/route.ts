import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Song } from "@/components/songs/types";

export async function GET() {
  const supabase = await createClient();

  // Require authenticated user and use session user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  if (profileError) {
    return NextResponse.json(
      { error: "Error fetching user profile" },
      { status: 500 },
    );
  }
  if (!profile?.is_admin) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 },
    );
  }
  const { data, error } = await supabase
    .from("user_favorites")
    .select("song:song_id(*), profiles!inner(isAdmin, user_id)")
    .eq("user_id", userId)
    .eq("profiles.isAdmin", true);
  if (error) {
    logger.error("Error fetching admin favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite songs" },
      { status: 500 },
    );
  }
  const songs = data?.map((fav: unknown) => (fav as { song: Song }).song) || [];
  return NextResponse.json(songs);
}
