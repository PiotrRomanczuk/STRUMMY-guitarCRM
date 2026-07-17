#!/usr/bin/env python3
"""Seed parsed WhatsApp lessons/songs onto a student in Supabase (local or remote).

Idempotent: songs dedup by title against the existing library; lessons dedup by
(student, title). Past-dated lessons are marked COMPLETED.

Usage:
  export SUPABASE_URL=http://192.168.1.75:54321
  export SUPABASE_SERVICE_ROLE_KEY=...
  python3 parse.py <chat.txt> > extracted.json
  python3 seed.py extracted.json --student <profile-uuid> --teacher <profile-uuid>
"""
import argparse, json, os, sys, urllib.parse, urllib.request, urllib.error


def make_client(base, key):
    H = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    def req(method, path, body=None, prefer=None):
        headers = dict(H)
        if prefer:
            headers["Prefer"] = prefer
        data = json.dumps(body).encode() if body is not None else None
        r = urllib.request.Request(base + path, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(r) as resp:
                txt = resp.read().decode()
                return json.loads(txt) if txt else None
        except urllib.error.HTTPError as e:
            print("  HTTP", e.code, e.read().decode()[:160], "on", method, path, file=sys.stderr)
            return None

    return req


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("extracted", help="JSON produced by parse.py")
    ap.add_argument("--student", required=True, help="student profile UUID")
    ap.add_argument("--teacher", required=True, help="teacher profile UUID")
    ap.add_argument("--base-url", default=os.environ.get("SUPABASE_URL"))
    ap.add_argument("--key", default=os.environ.get("SUPABASE_SERVICE_ROLE_KEY"))
    args = ap.parse_args()
    if not args.base_url or not args.key:
        ap.error("set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or pass --base-url/--key)")

    req = make_client(args.base_url.rstrip("/"), args.key)
    data = json.load(open(args.extracted, encoding="utf-8"))

    def clean(t):
        return t.strip().rstrip(".").strip()

    def find_song(title):
        rows = req("GET", "/rest/v1/songs?title=ilike." + urllib.parse.quote(title)
                   + "&select=id,title&deleted_at=is.null&limit=5") or []
        for r in rows:
            if r["title"].strip().lower() == title.strip().lower():
                return r["id"]
        return None

    def upsert_song(s):
        title = clean(s["title"])
        sid = find_song(title)
        if sid:
            return sid, False
        body = {"title": title, "level": "beginner"}
        if s.get("author"):
            body["author"] = s["author"]
        if s.get("tab_url"):
            body["ultimate_guitar_link"] = s["tab_url"]
        if s.get("notes"):
            body["notes"] = s["notes"]
        row = req("POST", "/rest/v1/songs", body, prefer="return=representation")
        return (row[0]["id"], True) if row else (None, False)

    def find_lesson(title):
        rows = req("GET", f"/rest/v1/lessons?student_id=eq.{args.student}&title=eq."
                   + urllib.parse.quote(title) + "&select=id") or []
        return rows[0]["id"] if rows else None

    new_songs = lessons_created = links = 0
    for L in data["lessons"]:
        date = L["date"]
        title = f"Guitar lesson — {date}"
        lid = find_lesson(title)
        if not lid:
            row = req("POST", "/rest/v1/lessons", {
                "teacher_id": args.teacher, "student_id": args.student,
                "status": "COMPLETED", "scheduled_at": f"{date}T15:00:00Z",
                "title": title, "notes": "Imported from WhatsApp lesson history.",
            }, prefer="return=representation")
            if not row:
                print(f"  ! lesson insert failed for {date}", file=sys.stderr)
                continue
            lid = row[0]["id"]
            lessons_created += 1
        for s in L["songs"]:
            sid, created = upsert_song(s)
            new_songs += int(created)
            if sid:
                req("POST", "/rest/v1/lesson_songs",
                    {"lesson_id": lid, "song_id": sid, "status": "to_learn"},
                    prefer="return=minimal")
                links += 1
        print(f"  {date}: lesson ok + {len(L['songs'])} songs")

    print(f"\nDone. lessons_created={lessons_created}, new_songs_added={new_songs}, song_links={links}")


if __name__ == "__main__":
    main()
