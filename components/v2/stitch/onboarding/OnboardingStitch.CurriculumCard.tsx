import { Guitar } from 'lucide-react';

export function CurriculumCard() {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-5">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-amber-700 dark:text-amber-400">Customized Curriculum</h3>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
          Based on your selections, we&apos;ll generate a 12-week roadmap just for you.
        </p>
      </div>
      <div className="h-16 w-16 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
        <Guitar className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
    </div>
  );
}
