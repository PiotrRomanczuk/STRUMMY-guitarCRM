'use client';

import { motion } from 'framer-motion';
import { User, Mail, AtSign, FileText, Save } from 'lucide-react';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ProfileV2Props } from './Profile';

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ icon, label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {icon}
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}

export function ProfileMobile({
  formData,
  userEmail,
  validationErrors,
  saving,
  success,
  error,
  onChange,
  onBlur,
  onSubmit,
}: ProfileV2Props) {
  return (
    <MobilePageShell title="Edit Profile" showBack>
      <motion.form
        onSubmit={onSubmit}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* Status messages */}
        {error && (
          <motion.div
            variants={listItem}
            className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
            role="alert"
          >
            {error.message}
          </motion.div>
        )}
        {success && (
          <motion.div
            variants={listItem}
            className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm"
            role="status"
          >
            Profile updated successfully
          </motion.div>
        )}

        {/* Form fields in a card */}
        <motion.div
          variants={listItem}
          className="bg-card rounded-xl border border-border p-4 space-y-4"
        >
          <Field
            icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}
            label="First Name"
            error={validationErrors.firstname}
          >
            <Input
              value={formData.firstname}
              onChange={(e) => onChange({ ...formData, firstname: e.target.value })}
              onBlur={() => onBlur('firstname')}
              placeholder="Your first name"
              className={cn(
                'min-h-[44px] text-base',
                validationErrors.firstname && 'border-destructive'
              )}
            />
          </Field>

          <Field
            icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Last Name"
            error={validationErrors.lastname}
          >
            <Input
              value={formData.lastname}
              onChange={(e) => onChange({ ...formData, lastname: e.target.value })}
              onBlur={() => onBlur('lastname')}
              placeholder="Your last name"
              className={cn(
                'min-h-[44px] text-base',
                validationErrors.lastname && 'border-destructive'
              )}
            />
          </Field>

          <Field
            icon={<AtSign className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Username"
            error={validationErrors.username}
          >
            <Input
              value={formData.username ?? ''}
              onChange={(e) => onChange({ ...formData, username: e.target.value })}
              onBlur={() => onBlur('username')}
              placeholder="@username"
              className={cn(
                'min-h-[44px] text-base',
                validationErrors.username && 'border-destructive'
              )}
            />
          </Field>

          {userEmail && (
            <Field
              icon={<Mail className="h-3.5 w-3.5 text-muted-foreground" />}
              label="Email"
            >
              <Input
                value={userEmail}
                disabled
                className="min-h-[44px] text-base opacity-60"
              />
            </Field>
          )}

          <Field
            icon={<FileText className="h-3.5 w-3.5 text-muted-foreground" />}
            label="Bio"
            error={validationErrors.bio}
          >
            <Textarea
              value={formData.bio ?? ''}
              onChange={(e) => onChange({ ...formData, bio: e.target.value })}
              onBlur={() => onBlur('bio')}
              placeholder="Tell students about yourself..."
              rows={3}
              className={cn(
                'text-base resize-none',
                validationErrors.bio && 'border-destructive'
              )}
            />
          </Field>
        </motion.div>

        {/* Submit button */}
        <motion.div variants={listItem}>
          <Button
            type="submit"
            disabled={saving}
            className="w-full min-h-[44px]"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </motion.div>
      </motion.form>
    </MobilePageShell>
  );
}
