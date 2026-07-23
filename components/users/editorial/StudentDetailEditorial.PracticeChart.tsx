import { weekMinutes, type PracticeDay } from '@/lib/services/student-health.helpers';
import { Card, formatMinutes } from './StudentDetailEditorial.shared';

const weekdayInitial = (date: string): string =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' });

const PracticeBar = ({
  day,
  peak,
  goalMin,
}: {
  day: PracticeDay;
  peak: number;
  goalMin: number;
}) => {
  const met = day.minutes >= goalMin && day.minutes > 0;
  return (
    <div
      title={`${day.date}: ${day.minutes} min`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
    >
      <div style={{ height: 72, display: 'flex', flexDirection: 'column-reverse', width: '100%' }}>
        <div
          style={{
            height: `${(day.minutes / peak) * 100}%`,
            background: day.minutes === 0 ? 'var(--rule)' : met ? 'var(--gold)' : 'var(--gold-2)',
            borderRadius: '3px 3px 0 0',
            minHeight: day.minutes === 0 ? 2 : 5,
          }}
        />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-5)' }}>
        {weekdayInitial(day.date)}
      </div>
    </div>
  );
};

type Props = { days: PracticeDay[]; goalMin: number };

/**
 * 14-day practice sparkbar with a goal line. Bars that hit the daily goal read
 * gold; below-goal days are dimmed; empty days are a faint rule tick.
 */
export const PracticeChart = ({ days, goalMin }: Props) => {
  const peak = Math.max(goalMin, ...days.map((d) => d.minutes), 1);
  const thisWeek = weekMinutes(days);

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '20px 24px 6px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--gold-2)',
              textTransform: 'uppercase',
              letterSpacing: '.14em',
              fontWeight: 500,
            }}
          >
            Practice minutes · last 14 days
          </div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginTop: 2 }}>
            {formatMinutes(thisWeek)}{' '}
            <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>this week</span>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
          Goal · {goalMin} min/day
        </div>
      </div>

      <div style={{ position: 'relative', padding: '10px 24px 16px' }}>
        {/* goal line */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: `calc(16px + ${(goalMin / peak) * 72}px)`,
            borderTop: '1px dashed var(--gold-dim)',
            zIndex: 1,
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${days.length}, 1fr)`,
            gap: 5,
            alignItems: 'end',
          }}
        >
          {days.map((day) => (
            <PracticeBar key={day.date} day={day} peak={peak} goalMin={goalMin} />
          ))}
        </div>
      </div>
    </Card>
  );
};
