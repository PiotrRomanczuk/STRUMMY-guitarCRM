import { Card, CardHeader } from './primitives';

const PLANNED = [
  { title: 'Tablature', detail: 'Fret-by-fret notation per section.' },
  { title: 'Sections & form', detail: 'Intro · verse · chorus arrangement with bar counts.' },
  {
    title: 'Lyrics with chord positions',
    detail: 'Aligned chord changes above the lyric line.',
  },
  { title: 'Assign as homework', detail: 'Pick students, set a due date, pick submission type.' },
];

export const ComingSoonCard = () => (
  <Card>
    <CardHeader eyebrow="On the way" title="More on this view" />
    <div
      style={{
        padding: '0 24px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {PLANNED.map((item) => (
        <div
          key={item.title}
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            gap: 18,
            padding: '10px 0',
            borderTop: '1px solid var(--rule-2)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: '-0.01em',
              }}
            >
              {item.title}
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                letterSpacing: '.12em',
                marginTop: 2,
              }}
            >
              Planned
            </div>
          </div>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 14,
              color: 'var(--ink-3)',
              fontStyle: 'italic',
              alignSelf: 'center',
            }}
          >
            {item.detail}
          </div>
        </div>
      ))}
    </div>
  </Card>
);
