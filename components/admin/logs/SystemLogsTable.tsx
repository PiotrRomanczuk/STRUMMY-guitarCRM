import type { SystemLogFilters, SystemLogRow } from '@/lib/services/system-logs-queries';

import { SystemLogsTableRow } from './SystemLogsTable.Row';

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--mono)',
  fontSize: 12,
  color: 'var(--ink)',
};

type Props = {
  rows: SystemLogRow[];
  filters: SystemLogFilters;
};

export const SystemLogsTable = ({ rows, filters }: Props) => (
  <div
    style={{
      background: 'var(--ivory)',
      color: 'var(--ink)',
      fontSize: 13,
      lineHeight: 1.4,
      minHeight: '100%',
      padding: '28px 32px 64px',
    }}
  >
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.16em',
        }}
      >
        Operator
      </div>
      <h1
        style={{
          margin: '4px 0 6px',
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          fontSize: 40,
          letterSpacing: '-0.02em',
          fontStyle: 'italic',
        }}
      >
        System logs
      </h1>
      <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{rows.length} shown, latest first</div>
    </div>

    <form
      method="get"
      style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}
    >
      <select name="level" defaultValue={filters.level ?? ''} style={selectStyle}>
        <option value="">All levels</option>
        <option value="debug">Debug</option>
        <option value="info">Info</option>
        <option value="warn">Warn</option>
        <option value="error">Error</option>
      </select>
      <input
        name="prefix"
        defaultValue={filters.prefix ?? ''}
        placeholder="Filter by prefix (e.g. cron:lesson-reminders)"
        style={{ ...selectStyle, fontFamily: 'var(--sans)', minWidth: 260 }}
      />
      <button
        type="submit"
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          border: 'none',
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--sans)',
        }}
      >
        Filter
      </button>
    </form>

    {rows.length === 0 ? (
      <div
        style={{
          padding: '22px 24px',
          fontFamily: 'var(--serif)',
          fontSize: 14,
          fontStyle: 'italic',
          color: 'var(--ink-4)',
          background: 'var(--card)',
          border: '1px solid var(--rule)',
          borderRadius: 10,
        }}
      >
        No log entries match these filters.
      </div>
    ) : (
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--rule)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
        data-testid="system-logs-list"
      >
        {rows.map((row, i) => (
          <SystemLogsTableRow key={row.id} row={row} isFirst={i === 0} />
        ))}
      </div>
    )}
  </div>
);
