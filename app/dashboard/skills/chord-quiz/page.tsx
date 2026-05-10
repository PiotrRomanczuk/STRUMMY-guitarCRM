import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { ChordQuiz } from '@/components/skills/ChordQuiz';

export const metadata = {
  title: 'Chord Quiz · Strummy',
};

export default async function ChordQuizPage() {
  const { user } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/login');
  }
  return <ChordQuiz />;
}
