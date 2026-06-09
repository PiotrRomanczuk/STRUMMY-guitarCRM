import { ArtboardStage } from '@/components/design-preview/shell/ArtboardStage';
import { SongDetail } from '@/components/design-preview/song-detail/SongDetail';

export default function SongDetailPreview() {
  return (
    <ArtboardStage
      title="Song · Repertoire detail"
      subtitle="Single-song view with hero, audio strip, switchable chord/tab/lyric body, and an assign + usage sidebar. Mounted with Hotel California to exercise voicings, sections, and student-mastery distribution."
      artboards={[
        {
          label: 'Hotel California · Chords view · Desktop (1440 × 1300)',
          width: 1440,
          height: 1300,
          node: <SongDetail width={1440} height={1300} />,
        },
      ]}
    />
  );
}
