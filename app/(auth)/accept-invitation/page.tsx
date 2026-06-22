import { AuthLayout, AuthHeader } from '@/components/auth';
import AcceptInvitationForm from '@/components/auth/AcceptInvitationForm';

export default function AcceptInvitationPage() {
  return (
    <AuthLayout>
      <AuthHeader
        title="Accept Your Invitation"
        subtitle="Set up your password to get started with Strummy."
      />
      <AcceptInvitationForm />
    </AuthLayout>
  );
}
