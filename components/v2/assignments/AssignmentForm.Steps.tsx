'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StudentPicker } from '@/components/v2/lessons/LessonForm.Pickers';

interface StepStudentProps {
  students: Array<{ id: string; full_name: string | null; email: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function StepStudent({ students, selectedId, onSelect }: StepStudentProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = students.find((s) => s.id === selectedId);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Select Student</h2>
      <p className="text-sm text-muted-foreground">
        Choose which student this assignment is for.
      </p>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="w-full flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg border border-border bg-card text-left active:bg-muted/50 transition-colors"
      >
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className={selected ? 'text-sm font-medium' : 'text-sm text-muted-foreground'}>
          {selected ? selected.full_name || selected.email : 'Choose a student...'}
        </span>
      </button>
      <StudentPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        students={students}
        onSelect={(s) => onSelect(s.id)}
      />
    </div>
  );
}

interface StepContentProps {
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}

export function StepContent({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: StepContentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Assignment Details</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm">
            Title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Practice fingerpicking pattern"
            className="mt-1 min-h-[44px] text-base"
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="description" className="text-sm">
            Description (optional)
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Detailed instructions for the student..."
            rows={4}
            className="mt-1 text-base"
            maxLength={2000}
          />
        </div>
      </div>
    </div>
  );
}

interface StepScheduleProps {
  dueDate: string;
  onDueDateChange: (v: string) => void;
}

export function StepSchedule({ dueDate, onDueDateChange }: StepScheduleProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Schedule</h2>
      <p className="text-sm text-muted-foreground">
        Set a due date to help your student stay on track.
      </p>
      <div>
        <Label htmlFor="due_date" className="text-sm">
          Due Date (optional)
        </Label>
        <Input
          id="due_date"
          type="date"
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          className="mt-1 min-h-[44px] text-base"
        />
      </div>
    </div>
  );
}
