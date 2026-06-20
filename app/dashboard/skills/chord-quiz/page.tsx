import { getDueChordIds } from '@/app/actions/chord-srs';
import { ChordQuiz } from '@/components/skills/ChordQuiz';

export default async function Page() {
  const result = await getDueChordIds();
  const dueChordIds = 'chordIds' in result ? result.chordIds : [];

  return <ChordQuiz dueChordIds={dueChordIds} />;
}
