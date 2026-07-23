'use client';

import { FormSection } from '@/components/_editorial/FormSection';

const fieldLabel: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--ink-4)',
  textTransform: 'uppercase',
  letterSpacing: '.12em',
  marginBottom: 6,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
  boxSizing: 'border-box',
};

type Props = {
  firstName: string;
  lastName: string;
  inviteEmail: string;
  phone: string;
  onFirstName: (v: string) => void;
  onLastName: (v: string) => void;
  onInviteEmail: (v: string) => void;
  onPhone: (v: string) => void;
};

/** Sections I (identity) + II (contact) of the "Add student" form. */
export const CreateStudentFormFields = ({
  firstName,
  lastName,
  inviteEmail,
  phone,
  onFirstName,
  onLastName,
  onInviteEmail,
  onPhone,
}: Props) => {
  const populatedIdentity = [firstName, lastName].filter((v) => v.trim()).length;
  const populatedContact = [inviteEmail, phone].filter((v) => v.trim()).length;

  return (
    <>
      <FormSection
        numeral="I · IDENTITY"
        title="Who they are"
        count={2}
        populated={populatedIdentity}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <div style={fieldLabel}>First name *</div>
            <input
              required
              value={firstName}
              onChange={(e) => onFirstName(e.target.value)}
              maxLength={120}
              style={input}
            />
          </div>
          <div>
            <div style={fieldLabel}>Last name *</div>
            <input
              required
              value={lastName}
              onChange={(e) => onLastName(e.target.value)}
              maxLength={120}
              style={input}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        numeral="II · CONTACT"
        title="Student contact"
        count={2}
        populated={populatedContact}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={fieldLabel}>
              Invite email *{' '}
              <span style={{ color: 'var(--ink-3)', textTransform: 'none', letterSpacing: 0 }}>
                — stored now, sent when you&apos;re ready
              </span>
            </div>
            <input
              required
              type="email"
              value={inviteEmail}
              onChange={(e) => onInviteEmail(e.target.value)}
              placeholder="student@email.com"
              style={input}
            />
          </div>

          <div>
            <div style={fieldLabel}>Phone</div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhone(e.target.value)}
              maxLength={50}
              style={input}
            />
          </div>
        </div>
      </FormSection>
    </>
  );
};
