'use client';

import { formStyles as s } from '@/components/_editorial/form-styles';
import type { SongOption } from '@/lib/services/lesson-form-data';

type Props = {
  songs: SongOption[];
  songIds: string[];
  notes: string;
  onSongIds: (v: string[]) => void;
  onNotes: (v: string) => void;
};

/** Section III — repertoire (multi-select) + lesson notes. */
export const LessonFormFieldsSongsNotes = ({
  songs,
  songIds,
  notes,
  onSongIds,
  onNotes,
}: Props) => (
  <>
    <div style={s.field}>
      <label style={s.label} htmlFor="lesson-songs">
        Repertoire
      </label>
      <select
        id="lesson-songs"
        multiple
        style={{ ...s.input, minHeight: 120 }}
        value={songIds}
        onChange={(e) => onSongIds(Array.from(e.target.selectedOptions, (o) => o.value))}
      >
        {songs.map((song) => (
          <option key={song.id} value={song.id}>
            {song.title}
            {song.author ? ` — ${song.author}` : ''}
          </option>
        ))}
      </select>
      <span style={s.hint}>Hold ⌘/Ctrl to select multiple songs.</span>
    </div>

    <div style={{ ...s.field, marginBottom: 0 }}>
      <label style={s.label} htmlFor="lesson-notes">
        Notes
      </label>
      <textarea
        id="lesson-notes"
        style={s.textarea}
        value={notes}
        placeholder="What did you cover, what to practise…"
        onChange={(e) => onNotes(e.target.value)}
      />
    </div>
  </>
);
