'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StepStudentProps {
  students: Array<{ id: string; full_name: string | null; email: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function StepStudent({ students, selectedId, onSelect }: StepStudentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Select Student</h2>
      <p className="text-sm text-muted-foreground">
        Choose which student this assignment is for.
      </p>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="min-h-[44px] text-base">
          <SelectValue placeholder="Choose a student..." />
        </SelectTrigger>
        <SelectContent>
          {students.map((s) => (
            <SelectItem key={s.id} value={s.id} className="min-h-[44px]">
              {s.full_name || s.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
