import { ArtboardStage } from '@/components/design-preview/shell/ArtboardStage';
import { OnboardTeacher } from '@/components/design-preview/onboarding/OnboardTeacher';
import { OnboardStudent } from '@/components/design-preview/onboarding/OnboardStudent';

export default function OnboardingPreview() {
  return (
    <ArtboardStage
      title="Onboarding"
      subtitle="Teacher studio setup, student goals + level — multi-step wizards with a left rail of progress and a single-pane content area."
      artboards={[
        {
          label: 'Teacher · Step 2 of 5 — Studio info (1280 × 800)',
          width: 1280,
          height: 800,
          node: <OnboardTeacher width={1280} height={800} />,
        },
        {
          label: 'Student · Step 2 of 4 — Level + goals (1280 × 800)',
          width: 1280,
          height: 800,
          node: <OnboardStudent width={1280} height={800} />,
        },
      ]}
    />
  );
}
