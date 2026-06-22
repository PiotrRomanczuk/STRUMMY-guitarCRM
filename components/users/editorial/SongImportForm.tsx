'use client';

import { useCallback, useState, useTransition } from 'react';

import { importCsvSongs } from '@/app/actions/import-csv-songs';
import type { CsvSongImportResult, CsvSongRow } from '@/schemas/CsvSongImportSchema';

type Props = { studentId: string; studentName: string };

const fieldLabel: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--ink-4)',
  textTransform: 'uppercase',
  letterSpacing: '.12em',
  marginBottom: 6,
};

const MATCH_COLOUR: Record<string, string> = {
  matched: 'var(--success)',
  low_confidence: 'var(--warn)',
  new: 'var(--info)',
};

function toEuropeanDate(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}.${m}.${y}`;
  }
  return trimmed;
}

function parseLine(line: string): CsvSongRow | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const parts = trimmed.split(',').map((p) => p.trim());

  if (parts.length === 1) return { title: parts[0], author: '', date: '' };

  const lastPart = parts[parts.length - 1];
  const isDate = /^\d{2}\.\d{2}\.\d{4}$/.test(lastPart) || /^\d{4}-\d{2}-\d{2}$/.test(lastPart);

  if (isDate) {
    const date = toEuropeanDate(lastPart);
    if (parts.length === 2) return { title: parts[0], author: '', date };
    return { title: parts[0], author: parts.slice(1, -1).join(', '), date };
  }

  if (parts.length === 2) return { title: parts[0], author: parts[1], date: '' };
  return { title: parts[0], author: parts.slice(1).join(', '), date: '' };
}

export const SongImportForm = ({ studentId, studentName }: Props) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<CsvSongImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const rows = text
    .split('\n')
    .map(parseLine)
    .filter((r): r is CsvSongRow => r !== null);

  const handleImport = useCallback(() => {
    if (rows.length === 0) return;
    setResult(null);
    startTransition(async () => {
      const res = await importCsvSongs({
        studentId,
        rows,
        validateOnly: false,
        repertoireOnly: false,
      });
      setResult(res);
    });
  }, [rows, studentId]);

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        minHeight: '100%',
        padding: '28px 32px 64px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <a
          href={`/dashboard/users/${studentId}`}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← {studentName}
        </a>
        <h1
          style={{
            margin: '12px 0 4px',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          Import songs
        </h1>
        <p
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            marginBottom: 24,
          }}
        >
          One song per line. Format: <strong>Title, DD.MM.YYYY</strong> or{' '}
          <strong>Title, YYYY-MM-DD</strong> — songs with a date create lessons; without a date go
          directly to repertoire. Author is optional: <strong>Title, Author, Date</strong>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={fieldLabel}>Song list</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              placeholder={
                'Wonderwall, 22.01.2026\nHotel California, Eagles, 29.01.2026\nBlackbird'
              }
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--rule)',
                borderRadius: 8,
                background: 'var(--paper)',
                fontFamily: 'var(--mono)',
                fontSize: 13,
                color: 'var(--ink)',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {rows.length > 0 && !result && (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--rule)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--rule)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--ink-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                }}
              >
                Preview — {rows.length} song{rows.length !== 1 ? 's' : ''}
              </div>
              {rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 110px',
                    gap: 12,
                    padding: '10px 20px',
                    borderBottom: i < rows.length - 1 ? '1px solid var(--rule)' : 'none',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14 }}>
                      {r.title}
                    </div>
                    {r.author && (
                      <div
                        style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}
                      >
                        {r.author}
                      </div>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                    {r.date || 'Repertoire only'}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                    }}
                  >
                    {r.date ? 'Lesson' : 'Repertoire'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {result && (
            <div
              style={{
                background: result.success ? 'var(--card)' : '#fff3f3',
                border: `1px solid ${result.success ? 'var(--rule)' : 'var(--danger)'}`,
                borderRadius: 10,
                padding: '20px 24px',
              }}
            >
              {result.error ? (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--danger)' }}>
                  {result.error}
                </div>
              ) : (
                <>
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: 'var(--success)',
                      textTransform: 'uppercase',
                      letterSpacing: '.12em',
                      marginBottom: 12,
                    }}
                  >
                    ✓ Import complete
                  </div>
                  {result.summary && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 16,
                        marginBottom: 16,
                      }}
                    >
                      {[
                        ['Lessons created', result.summary.lessonsCreated],
                        ['Songs matched', result.summary.songsMatched],
                        ['Songs created', result.summary.songsCreated],
                        ['Repertoire added', result.summary.repertoireAdded],
                        ['Errors', result.summary.errors],
                      ].map(([label, val]) => (
                        <div key={String(label)}>
                          <div
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 10,
                              color: 'var(--ink-4)',
                              textTransform: 'uppercase',
                              letterSpacing: '.1em',
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--serif)',
                              fontSize: 28,
                              fontWeight: 500,
                              marginTop: 2,
                              color:
                                label === 'Errors' && Number(val) > 0 ? 'var(--danger)' : 'inherit',
                            }}
                          >
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {result.results && result.results.length > 0 && (
                    <div
                      style={{
                        border: '1px solid var(--rule)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        fontSize: 12,
                      }}
                    >
                      {result.results.map((r, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 100px 80px',
                            gap: 10,
                            padding: '8px 14px',
                            borderBottom:
                              i < (result.results?.length ?? 0) - 1
                                ? '1px solid var(--rule)'
                                : 'none',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                              {r.title}
                            </span>
                            {r.error && (
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontFamily: 'var(--mono)',
                                  fontSize: 10,
                                  color: 'var(--danger)',
                                }}
                              >
                                {r.error}
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 10,
                              color: MATCH_COLOUR[r.matchStatus] ?? 'var(--ink-4)',
                              textTransform: 'uppercase',
                              letterSpacing: '.06em',
                            }}
                          >
                            {r.matchStatus}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--mono)',
                              fontSize: 10,
                              color: r.success ? 'var(--success)' : 'var(--danger)',
                              textTransform: 'uppercase',
                              letterSpacing: '.06em',
                            }}
                          >
                            {r.success ? '✓ ok' : '✗ fail'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 16 }}>
                    <a
                      href={`/dashboard/users/${studentId}`}
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 11,
                        color: 'var(--gold-2)',
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '.1em',
                      }}
                    >
                      View student profile →
                    </a>
                  </div>
                </>
              )}
            </div>
          )}

          {!result && rows.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <a
                href={`/dashboard/users/${studentId}`}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--rule)',
                  background: 'transparent',
                  color: 'var(--ink)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Cancel
              </a>
              <button
                type="button"
                onClick={handleImport}
                disabled={isPending}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: isPending ? 'var(--ink-4)' : 'var(--ink)',
                  color: 'var(--paper)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: isPending ? 'wait' : 'pointer',
                  fontFamily: 'var(--sans)',
                }}
              >
                {isPending
                  ? 'Importing…'
                  : `Import ${rows.length} song${rows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
