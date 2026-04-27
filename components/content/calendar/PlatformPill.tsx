import type { ContentPlatform, ContentPostStatus } from '@/types/ContentPost';
import { cn } from '@/lib/utils';

const PLATFORM_LABEL: Record<ContentPlatform, string> = {
  tiktok: 'TT',
  instagram: 'IG',
  youtube_shorts: 'YT',
};

const STATUS_BG: Record<ContentPostStatus, string> = {
  planned: 'bg-muted text-muted-foreground',
  scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  archived: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  failed: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
};

interface Props {
  platform: ContentPlatform;
  status: ContentPostStatus;
  title?: string;
  onClick?: () => void;
}

export default function PlatformPill({ platform, status, title, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors hover:opacity-80',
        STATUS_BG[status]
      )}
    >
      <span>{PLATFORM_LABEL[platform]}</span>
      {title && <span className="hidden md:inline truncate max-w-[80px]">{title}</span>}
    </button>
  );
}
