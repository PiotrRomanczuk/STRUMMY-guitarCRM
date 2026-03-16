'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { deleteAssignmentTemplate } from '@/app/actions/assignment-templates';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { toast } from 'sonner';
import type { AssignmentTemplate } from '@/schemas/AssignmentTemplateSchema';

interface TemplateListProps {
  templates: AssignmentTemplate[];
}

export function TemplateList({ templates }: TemplateListProps) {
  if (templates.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="px-4 space-y-4">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {templates.map((template) => (
          <motion.div key={template.id} variants={listItem}>
            <TemplateCard template={template} />
          </motion.div>
        ))}
      </motion.div>

      {/* FAB */}
      <Link
        href="/dashboard/assignments/templates/new"
        className={cn(
          'fixed right-4 z-40 rounded-full shadow-lg',
          'bg-primary text-primary-foreground',
          'w-14 h-14 flex items-center justify-center',
          'bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]',
          'active:scale-95 transition-transform'
        )}
        aria-label="Create template"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}

function TemplateCard({ template }: { template: AssignmentTemplate }) {
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = () => {
    if (!template.id) return;
    startTransition(async () => {
      try {
        await deleteAssignmentTemplate(template.id!);
        toast.success('Template deleted');
      } catch {
        toast.error('Failed to delete template');
      }
    });
  };

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border p-4 space-y-3',
        isDeleting && 'opacity-50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate">{template.title}</h3>
            {template.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="min-h-[44px] flex-1"
          asChild
        >
          <Link href={`/dashboard/assignments/new?templateId=${template.id}`}>
            <Send className="h-3.5 w-3.5 mr-1" />
            Assign
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="min-h-[44px] flex-1"
          asChild
        >
          <Link href={`/dashboard/assignments/templates/${template.id}`}>
            Edit
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Delete template"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">No templates yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Create reusable assignment templates to speed up your workflow.
      </p>
      <Button size="sm" asChild>
        <Link href="/dashboard/assignments/templates/new" className="gap-1">
          <Plus className="h-4 w-4" />
          Create Template
        </Link>
      </Button>
    </div>
  );
}

export default TemplateList;
