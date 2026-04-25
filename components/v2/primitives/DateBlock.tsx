'use client';

import { cn } from '@/lib/utils';

interface DateBlockProps {
  date: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CONFIG = {
  sm: { w: 'w-14', flex: 'flex-[0_0_56px]', day: 'text-[22px]', mon: 'text-[9px]', wday: 'text-[9px]', padMon: 'py-[3px]', padDay: 'py-[4px] pb-[2px]', padWday: 'pb-[4px]' },
  md: { w: 'w-16', flex: 'flex-[0_0_64px]', day: 'text-[26px]', mon: 'text-[10px]', wday: 'text-[9px]', padMon: 'py-[3px]', padDay: 'py-[4px] pb-[2px]', padWday: 'pb-[5px]' },
  lg: { w: 'w-[72px]', flex: 'flex-[0_0_72px]', day: 'text-[30px]', mon: 'text-[10px]', wday: 'text-[10px]', padMon: 'py-1', padDay: 'pt-[6px] pb-[2px]', padWday: 'pb-[6px]' },
} as const;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DateBlock({ date, size = 'md', className }: DateBlockProps) {
  if (!date) {
    return (
      <div className={cn(SIZE_CONFIG[size].w, SIZE_CONFIG[size].flex, 'text-center border border-border rounded-lg overflow-hidden bg-card', className)}>
        <div className="bg-muted font-mono text-muted-foreground uppercase tracking-[.14em] font-medium py-[3px] text-[9px]">---</div>
        <div className={cn('font-serif font-medium leading-none', SIZE_CONFIG[size].day, SIZE_CONFIG[size].padDay)}>-</div>
        <div className="font-mono text-muted-foreground uppercase tracking-[.12em] pb-1 text-[9px]">---</div>
      </div>
    );
  }

  const d = new Date(date);
  const mon = MONTHS[d.getMonth()];
  const day = d.getDate();
  const wday = WEEKDAYS[d.getDay()];
  const s = SIZE_CONFIG[size];

  return (
    <div className={cn(s.w, s.flex, 'text-center border border-border rounded-lg overflow-hidden bg-card', className)}>
      <div className={cn('bg-muted font-mono uppercase tracking-[.14em] font-medium text-primary', s.mon, s.padMon)}>
        {mon}
      </div>
      <div className={cn('font-serif font-medium leading-none', s.day, s.padDay)}>
        {day}
      </div>
      <div className={cn('font-mono text-muted-foreground uppercase tracking-[.12em]', s.wday, s.padWday)}>
        {wday}
      </div>
    </div>
  );
}
