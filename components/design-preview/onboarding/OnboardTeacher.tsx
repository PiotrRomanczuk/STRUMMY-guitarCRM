import { OnboardShell } from './OnboardShell';
import { OnbHeader, OnbField, OnbInput, OnbNextBar } from './OnboardPrimitives';
import { ONB_TEACHER_STEPS, TEACH_TAGS, LESSON_LENGTHS, PREVIEW_TAGS } from './data';

type OnboardTeacherProps = {
  width?: number;
  height?: number;
};

export function OnboardTeacher({ width = 1280, height = 800 }: OnboardTeacherProps) {
  return (
    <OnboardShell
      role="Teacher"
      steps={ONB_TEACHER_STEPS}
      current={1}
      width={width}
      height={height}
    >
      <OnbHeader
        eyebrow="Step 2 of 5"
        title="Tell us about your studio."
        sub="This is how your students and their parents will see you. You can change these any time."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <OnbField label="Studio name" hint="public">
            <OnbInput defaultValue="Sarah Chen Guitar Studio" />
          </OnbField>
          <OnbField label="Tagline" hint="optional">
            <OnbInput
              placeholder="One line that captures what you do"
              defaultValue="Classical & fingerstyle in San Francisco"
            />
          </OnbField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <OnbField label="City">
              <OnbInput defaultValue="San Francisco, CA" />
            </OnbField>
            <OnbField label="Timezone">
              <OnbInput defaultValue="Pacific (UTC−7)" />
            </OnbField>
          </div>
          <OnbField label="What do you teach?" hint="pick all that apply">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TEACH_TAGS.map(({ label, on }) => (
                <span
                  key={label}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 99,
                    border: on ? '1px solid var(--gold-2)' : '1px solid var(--rule)',
                    background: on ? 'var(--gold-tint)' : 'var(--card)',
                    color: on ? 'var(--ink)' : 'var(--ink-3)',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: on ? 500 : 400,
                  }}
                >
                  {on && '✓ '}
                  {label}
                </span>
              ))}
            </div>
          </OnbField>
          <OnbField label="Default lesson length">
            <div style={{ display: 'flex', gap: 6 }}>
              {LESSON_LENGTHS.map((m, i) => (
                <span
                  key={m}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 8,
                    textAlign: 'center',
                    border: i === 1 ? '1.5px solid var(--gold-2)' : '1px solid var(--rule)',
                    background: i === 1 ? 'var(--gold-tint)' : 'var(--card)',
                    fontFamily: 'var(--mono)',
                    fontSize: 14,
                    cursor: 'pointer',
                    fontWeight: i === 1 ? 600 : 400,
                  }}
                >
                  {m} min
                </span>
              ))}
            </div>
          </OnbField>
        </div>

        {/* preview */}
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '.14em',
              marginBottom: 10,
            }}
          >
            Live preview
          </div>
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--rule)',
              borderRadius: 12,
              padding: '20px 22px',
              boxShadow: '0 12px 24px -16px rgba(0,0,0,.15)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: 'linear-gradient(135deg, var(--gold), var(--gold-2))',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontFamily: 'var(--serif)',
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              SC
            </div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              Sarah Chen Guitar Studio
            </div>
            <div
              style={{
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--ink-3)',
                marginTop: 4,
                fontFamily: 'var(--serif)',
              }}
            >
              “Classical & fingerstyle in San Francisco”
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
              {PREVIEW_TAGS.map((t) => (
                <span
                  key={t}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 99,
                    fontSize: 10,
                    fontFamily: 'var(--mono)',
                    background: 'var(--paper)',
                    border: '1px solid var(--rule)',
                    color: 'var(--ink-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '.1em',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px solid var(--rule)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    color: 'var(--ink-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '.12em',
                  }}
                >
                  Lesson
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 500, fontSize: 14 }}>
                  45 min
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    color: 'var(--ink-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '.12em',
                  }}
                >
                  City
                </div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>San Francisco</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OnbNextBar />
    </OnboardShell>
  );
}
