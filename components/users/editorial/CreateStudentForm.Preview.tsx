'use client';

import { FormAvatar } from '@/components/_editorial/FormAvatar';

type Props = { name: string; inviteEmail: string };

/** Live-preview sidebar content for the "Add student" form. */
export const CreateStudentFormPreview = ({ name, inviteEmail }: Props) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <FormAvatar name={name || null} size={48} />
    <div>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 500 }}>
        {name || 'New student'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
        {inviteEmail || 'No invite email yet'}
      </div>
    </div>
  </div>
);
