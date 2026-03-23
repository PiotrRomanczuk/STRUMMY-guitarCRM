'use client';

import { useLayoutMode } from '@/hooks/use-is-widescreen';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PracticeLogForm } from './PracticeLogForm';

interface PracticeLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom drawer on mobile, dialog on desktop.
 * Wraps the PracticeLogForm with responsive container.
 */
export function PracticeLogSheet({ open, onOpenChange }: PracticeLogSheetProps) {
  const mode = useLayoutMode();

  if (mode === 'mobile') {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Log Practice Session</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-safe overflow-y-auto">
            <PracticeLogForm onClose={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Log Practice Session</DialogTitle>
        </DialogHeader>
        <PracticeLogForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
