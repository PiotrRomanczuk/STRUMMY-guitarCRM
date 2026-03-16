import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  getDisplayName,
  getInitials,
  getRoleDisplay,
  hasRealName,
} from './types';
import type { UserProfile } from './types';

export function UserCard({ user }: { user: UserProfile }) {
  return (
    <Link
      href={`/dashboard/users/${user.id}`}
      className="block bg-card rounded-xl border border-border p-4
                 active:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm truncate ${
              hasRealName(user) ? 'font-medium' : 'text-muted-foreground italic'
            }`}
          >
            {getDisplayName(user)}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user.email || '(no email)'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`h-2 w-2 rounded-full ${
              user.isActive ? 'bg-green-500' : 'bg-muted-foreground/40'
            }`}
          />
          <StatusBadge user={user} />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border bg-muted text-muted-foreground border-border">
          {getRoleDisplay(user)}
        </span>
        {user.studentStatus === 'archived' && (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
            Archived
          </span>
        )}
      </div>
    </Link>
  );
}

function StatusBadge({ user }: { user: UserProfile }) {
  if (!user.isRegistered) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border bg-muted text-muted-foreground border-border">
        Unregistered
      </span>
    );
  }
  return null;
}

export function UserListEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-1">No students found</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Add your first student to start tracking their progress.
      </p>
      <Button asChild size="sm">
        <Link href="/dashboard/users/new">
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Link>
      </Button>
    </div>
  );
}
