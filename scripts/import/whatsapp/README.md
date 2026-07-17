# WhatsApp lesson-history importer

_created: 2026-07-17_

Turns a WhatsApp chat export from a guitar-lesson conversation into seeded
lessons + songs for a student. Heuristic (owner's): a teacher sharing a
song/tab marks a lesson — distinct dates on which songs were shared become
lessons, and the songs shared on a date are that lesson's repertoire.

## Steps

1. **Export the chat** from WhatsApp ("Export chat", without media) → unzip to get `_chat.txt`.

2. **Parse** it to structured JSON:

   ```bash
   python3 parse.py path/to/_chat.txt > extracted.json
   ```

   Recognizes Ultimate-Guitar / śpiewnik.wywrota links (→ title + artist) and
   free-text lines like `Where is my mind - 60 BPM` or `Alex G Runner - Capo 4 - Cadd9 G D`
   (→ title + capo/chords/BPM notes). Skips `image/video omitted`, deleted
   messages, plain YouTube links, and the app's own URL.

3. **Seed** onto a student (dedups songs against the existing library; idempotent):
   ```bash
   export SUPABASE_URL=http://192.168.1.75:54321          # LAN-direct local stack
   export SUPABASE_SERVICE_ROLE_KEY=...                    # from .env.local
   python3 seed.py extracted.json \
     --student <student-profile-uuid> \
     --teacher <teacher-profile-uuid>
   ```

Past-dated lessons are created as `COMPLETED`. Re-running is safe — existing
lessons (matched by title) and songs (matched by title) are reused.

## Notes

- Free-text titles are lightly cleaned (trailing punctuation stripped); messy
  entries like a bare `UG tab <id>` or Polish shorthand come through as-is —
  fix titles in the app afterward if needed.
- This is dev/seed tooling, not a user-facing feature. A productized version
  (teacher uploads an export → preview → import) would live behind the teacher
  UI, alongside the existing `tab-import` skill.
