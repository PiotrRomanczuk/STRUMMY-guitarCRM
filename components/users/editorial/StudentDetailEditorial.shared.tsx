/**
 * Presentation helpers shared between StudentDetailEditorial (a Server
 * Component) and its client sub-components.
 *
 * They live here rather than in StudentDetailEditorial.tsx because importing
 * them from the client bundle dragged that module's server-only dependency
 * chain (student-detail-queries → lib/supabase/server → next/headers) into the
 * client graph, which fails the production build.
 */

export const formatMinutes = (m: number): string => {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export const Empty = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: '28px 24px',
      textAlign: 'center',
      color: 'var(--ink-4)',
      fontStyle: 'italic',
      fontFamily: 'var(--serif)',
      fontSize: 14,
    }}
  >
    {children}
  </div>
);
