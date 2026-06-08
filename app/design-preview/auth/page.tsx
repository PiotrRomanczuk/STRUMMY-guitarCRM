import { ArtboardStage } from '@/components/design-preview/shell/ArtboardStage';
import { AuthSignIn } from '@/components/design-preview/auth/AuthSignIn';
import { AuthMagicLinkSent } from '@/components/design-preview/auth/AuthMagicLinkSent';
import { AuthRoleSelect } from '@/components/design-preview/auth/AuthRoleSelect';

export default function AuthDesignPreview() {
  return (
    <ArtboardStage
      title="Authentication"
      subtitle="Sign in (email + magic link + SSO), magic link sent confirmation, role select."
      artboards={[
        {
          label: 'Sign in · email + magic link + SSO (1280 × 800)',
          width: 1280,
          height: 800,
          node: <AuthSignIn width={1280} height={800} />,
        },
        {
          label: 'Magic link sent · check your inbox (1280 × 800)',
          width: 1280,
          height: 800,
          node: <AuthMagicLinkSent width={1280} height={800} />,
        },
        {
          label: 'Role select · teacher · student · parent (1280 × 800)',
          width: 1280,
          height: 800,
          node: <AuthRoleSelect width={1280} height={800} />,
        },
      ]}
    />
  );
}
