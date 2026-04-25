'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ProfileV2Props } from './Profile';

export default function ProfileDesktop({
  formData,
  userEmail,
  validationErrors,
  saving,
  success,
  error,
  onChange,
  onBlur,
  onSubmit,
  onCancel,
}: ProfileV2Props) {
  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[.16em] text-muted-foreground">Account</p>
        <h1 className="font-serif font-normal text-[34px] tracking-[-0.02em] leading-none mt-1">Profile</h1>
        <p className="text-muted-foreground text-[13px] mt-1.5">
          Update your personal information
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-[10px] bg-destructive/10 border border-destructive/20 text-destructive text-sm" role="alert">
          {error.message}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-[10px] bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm" role="status">
          Profile updated successfully
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-card border border-border rounded-[10px] p-6 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="desktop-firstname" className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] font-medium">
              First Name
            </Label>
            <Input
              id="desktop-firstname"
              value={formData.firstname}
              onChange={(e) => onChange({ ...formData, firstname: e.target.value })}
              onBlur={() => onBlur('firstname')}
              placeholder="First name"
              className={cn(validationErrors.firstname && 'border-destructive')}
            />
            {validationErrors.firstname && (
              <p className="text-xs text-destructive">{validationErrors.firstname}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="desktop-lastname" className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] font-medium">
              Last Name
            </Label>
            <Input
              id="desktop-lastname"
              value={formData.lastname}
              onChange={(e) => onChange({ ...formData, lastname: e.target.value })}
              onBlur={() => onBlur('lastname')}
              placeholder="Last name"
              className={cn(validationErrors.lastname && 'border-destructive')}
            />
            {validationErrors.lastname && (
              <p className="text-xs text-destructive">{validationErrors.lastname}</p>
            )}
          </div>
        </div>

        {userEmail && (
          <div className="space-y-2">
            <Label className="font-mono text-[10px] text-muted-foreground uppercase tracking-[.14em] font-medium">Email</Label>
            <Input value={userEmail} disabled className="opacity-60" />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
