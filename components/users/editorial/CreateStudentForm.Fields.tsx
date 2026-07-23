'use client';

import { StudentFieldsBilling } from './StudentFields.Billing';
import { StudentFieldsContact } from './StudentFields.Contact';
import { StudentFieldsIdentity } from './StudentFields.Identity';
import { StudentFieldsSchedule } from './StudentFields.Schedule';
import type { StudentSectionProps } from './StudentFields.shared';

/** Sections I–IV of the "Add student" form (Identity / Contact / Schedule / Billing). */
export const CreateStudentFormFields = ({ values, onChange, errors }: StudentSectionProps) => (
  <>
    <StudentFieldsIdentity values={values} onChange={onChange} errors={errors} />
    <StudentFieldsContact values={values} onChange={onChange} errors={errors} />
    <StudentFieldsSchedule values={values} onChange={onChange} errors={errors} />
    <StudentFieldsBilling values={values} onChange={onChange} errors={errors} />
  </>
);
