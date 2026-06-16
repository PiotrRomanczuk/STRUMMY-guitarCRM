import { RepertoireCard } from './RepertoireCard';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';

interface RepertoireEditorialProps {
  entries: StudentRepertoireWithSong[];
  /** True when the viewer owns this repertoire (student self-edit notes/difficulty). */
  canEdit: boolean;
}

/**
 * Editorial repertoire surface (spec 05). Lists repertoire entries with status
 * + practice stats; a student may edit own notes/difficulty inline.
 */
export function RepertoireEditorial({ entries, canEdit }: RepertoireEditorialProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Repertoire</h1>
        <p className="text-sm text-muted-foreground">
          {entries.length} song{entries.length === 1 ? '' : 's'} in your repertoire
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Your repertoire is empty. Songs appear here as your teacher assigns them.
        </p>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry) => (
            <RepertoireCard key={entry.id} entry={entry} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
