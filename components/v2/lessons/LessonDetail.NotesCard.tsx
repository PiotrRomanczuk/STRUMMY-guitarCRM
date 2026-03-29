import { FileText } from 'lucide-react';

interface NotesCardProps {
  notes: string | null;
}

export function NotesCard({ notes }: NotesCardProps) {
  return (
    <div className="bg-card rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-4 w-4 text-primary/60" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Notes
        </h3>
      </div>
      {notes ? (
        <p className="text-sm text-foreground whitespace-pre-wrap">{notes}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">No notes for this lesson.</p>
      )}
    </div>
  );
}
