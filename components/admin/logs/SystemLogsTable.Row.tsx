import type { SystemLogRow } from '@/lib/services/system-logs-queries';

const levelColor: Record<SystemLogRow['level'], string> = {
  debug: 'var(--ink-4)',
  info: 'var(--ink-3)',
  warn: '#a15c00',
  error: 'var(--danger)',
};

const formatTimestamp = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

const rowDetails = (row: SystemLogRow): string | null => {
  const parts: string[] = [];
  if (row.requestId) parts.push(`requestId: ${row.requestId}`);
  if (row.userId) parts.push(`userId: ${row.userId}`);
  if (row.context && Object.keys(row.context).length > 0) {
    parts.push(`context: ${JSON.stringify(row.context, null, 2)}`);
  }
  if (row.error) {
    parts.push(
      `error: ${row.error.type ?? 'Error'}: ${row.error.message ?? ''}` +
        (row.error.stack ? `\n${row.error.stack}` : '')
    );
  }
  return parts.length > 0 ? parts.join('\n\n') : null;
};

type Props = {
  row: SystemLogRow;
  isFirst: boolean;
};

export const SystemLogsTableRow = ({ row, isFirst }: Props) => {
  const details = rowDetails(row);
  return (
    <div
      data-testid={`system-log-${row.id}`}
      style={{
        padding: '12px 22px',
        borderTop: isFirst ? 'none' : '1px solid var(--rule)',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            color: levelColor[row.level],
            minWidth: 44,
          }}
        >
          {row.level}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
          {formatTimestamp(row.occurredAt)}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
          {row.prefix}
        </span>
      </div>
      <div style={{ marginTop: 4, fontFamily: 'var(--sans)', fontSize: 13 }}>{row.message}</div>
      {details && (
        <details style={{ marginTop: 6 }}>
          <summary
            style={{
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              color: 'var(--ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
            }}
          >
            Details
          </summary>
          <pre
            style={{
              marginTop: 6,
              padding: '10px 12px',
              background: 'var(--paper)',
              border: '1px solid var(--rule)',
              borderRadius: 6,
              fontFamily: 'var(--mono)',
              fontSize: 11,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {details}
          </pre>
        </details>
      )}
    </div>
  );
};
