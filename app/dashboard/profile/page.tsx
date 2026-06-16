import { redirect } from 'next/navigation';

// The single self-edit surface lives at /dashboard/settings (spec 10).
export default function ProfilePage() {
  redirect('/dashboard/settings');
}
