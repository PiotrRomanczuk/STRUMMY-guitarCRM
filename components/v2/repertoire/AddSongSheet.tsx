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
import { AddSongContent } from './AddSongSheet.Content';

interface AddSongSheetProps {
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Bottom sheet on mobile, dialog on desktop.
 * Two steps: search for a song, then configure (priority + notes).
 */
export function AddSongSheet({ studentId, open, onOpenChange }: AddSongSheetProps) {
  const mode = useLayoutMode();

  if (mode === 'mobile') {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Add Song to Repertoire</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-safe overflow-y-auto">
            <AddSongContent studentId={studentId} onClose={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Song to Repertoire</DialogTitle>
        </DialogHeader>
        <AddSongContent studentId={studentId} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export default AddSongSheet;
