import { Lightbulb } from 'lucide-react';

export function WorkspaceTip() {
  return (
    <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-5 py-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Lightbulb className="h-4 w-4 text-[#f2b127]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
          Workspace Tip
        </span>
      </div>
      <p className="text-sm text-amber-800 dark:text-amber-300">
        Prepare your chord sheets before starting the session.
      </p>
    </div>
  );
}
