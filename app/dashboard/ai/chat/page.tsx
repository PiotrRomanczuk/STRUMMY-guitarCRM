import { redirect } from 'next/navigation';

import { AIAssistant } from '@/components/ai/chat';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';

export const metadata = {
  title: 'AI Chat',
};

export default async function AIChatPage() {
  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/ai/chat');
  }
  if (!isAdmin && !isTeacher) {
    redirect('/dashboard');
  }

  return (
    <div className="h-[calc(100svh-56px)] p-4">
      <AIAssistant />
    </div>
  );
}
