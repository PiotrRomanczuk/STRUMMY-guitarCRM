const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const levelLabel = (level: string | null | undefined): string => {
  if (!level) return '';
  return LEVEL_LABELS[level] ?? level.charAt(0).toUpperCase() + level.slice(1);
};

export const msToClock = (ms: number | null): string => {
  if (ms == null || ms < 0) return '';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const monthYear = (iso: string | null): string => {
  if (!iso) return 'recently';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'recently';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export const minutesLabel = (totalMinutes: number): string => {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  return `${hours}h${totalMinutes % 60 > 0 ? ` ${totalMinutes % 60}m` : ''}`;
};

export const firstNameWithInitial = (fullName: string | null, fallback: string): string => {
  if (!fullName) return fallback;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return fallback;
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last[0]}.`;
};
