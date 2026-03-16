'use client';

import { motion } from 'framer-motion';
import { UserPlus, Mail, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface InviteData {
  firstName: string;
  email: string;
}

export function InfoStep({
  data,
  onChange,
  canProceed,
  onNext,
}: {
  data: InviteData;
  onChange: (data: InviteData) => void;
  canProceed: boolean;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center py-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Add a new student</h2>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Enter their name to get started. Email is optional.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-name">Student Name *</Label>
          <Input
            id="invite-name"
            value={data.firstName}
            onChange={(e) => onChange({ ...data, firstName: e.target.value })}
            placeholder="e.g. John"
            className="min-h-[44px] text-base"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-email">
            Email{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="invite-email"
            type="email"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            placeholder="student@example.com"
            className="min-h-[44px] text-base"
          />
          <p className="text-xs text-muted-foreground">
            Without email, a shadow profile is created (no login access).
          </p>
        </div>
      </div>

      <div className="sticky bottom-0 pt-4 pb-safe bg-background">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="w-full min-h-[44px]"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export function ConfirmStep({
  data,
  loading,
  onBack,
  onSubmit,
}: {
  data: InviteData;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center py-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">Confirm details</h2>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <DetailRow label="Name" value={data.firstName} />
        <DetailRow
          label="Email"
          value={data.email || 'No email (shadow user)'}
        />
        <DetailRow label="Role" value="Student" />
        <DetailRow
          label="Status"
          value={data.email ? 'Active' : 'Shadow (no login)'}
        />
      </div>

      <div className="sticky bottom-0 pt-4 pb-safe bg-background flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="flex-1 min-h-[44px]"
        >
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 min-h-[44px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Add Student'
          )}
        </Button>
      </div>
    </motion.div>
  );
}

export function SuccessStep({
  name,
  onAddAnother,
  onDone,
}: {
  name: string;
  onAddAnother: () => void;
  onDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-12 space-y-6"
    >
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
        <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">Student Added</h2>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-foreground">{name}</span> has been
          added to your students.
        </p>
      </div>

      <div className="w-full flex flex-col gap-3 pt-4">
        <Button
          onClick={onAddAnother}
          variant="outline"
          className="w-full min-h-[44px]"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Another Student
        </Button>
        <Button onClick={onDone} className="w-full min-h-[44px]">
          Done
        </Button>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
