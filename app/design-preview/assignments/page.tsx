import { ArtboardStage } from '@/components/design-preview/shell/ArtboardStage';
import { AssignmentsStudent } from '@/components/design-preview/assignments/AssignmentsStudent';
import { AssignmentsTeacher } from '@/components/design-preview/assignments/AssignmentsTeacher';

export default function AssignmentsPreview() {
  return (
    <ArtboardStage
      title="Assignments"
      subtitle="Two ends of the same loop: teacher composes + reviews; student receives + submits. Status colour is shared between both views (Open / Submitted / Reviewed / Overdue)."
      artboards={[
        {
          label: 'Teacher · Assignment management · Desktop (1440 × 1024)',
          width: 1440,
          height: 1024,
          node: <AssignmentsTeacher width={1440} height={1024} />,
        },
        {
          label: 'Student · Assignment inbox + submit · Desktop (1440 × 1024)',
          width: 1440,
          height: 1024,
          node: <AssignmentsStudent width={1440} height={1024} />,
        },
      ]}
    />
  );
}
