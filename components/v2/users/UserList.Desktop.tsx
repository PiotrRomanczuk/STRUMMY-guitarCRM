'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { toast } from 'sonner';
import { fadeIn } from '@/lib/animations/variants';
import { useUsersList } from '@/components/users/hooks/useUsersList';
import { deleteUser } from '@/app/dashboard/actions';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPageHeader } from '@/components/v2/primitives/ListPageHeader';
import { DesktopUsersTable } from './UserList.DesktopTable';
import { UserDeleteDialog } from './UserList.DeleteDialog';
import type { UserProfile } from './types';
import { cn } from '@/lib/utils';

interface UserListDesktopProps {
  initialUsers?: UserProfile[];
}

export default function UserListDesktop({ initialUsers }: UserListDesktopProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | 'admin' | 'teacher' | 'student'>('');
  const [activeFilter] = useState<'' | 'true' | 'false'>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'' | 'active' | 'archived'>('');
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { users, loading, error, refetch } = useUsersList(
    search, roleFilter, activeFilter, studentStatusFilter, initialUsers
  );

  const handleConfirmDelete = async () => {
    if (!userToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      toast.success('User deleted');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-4"
    >
      <ListPageHeader
        title="Students"
        subtitle="Manage your students and their roles"
        action={{ label: 'New User', href: '/dashboard/users/new' }}
      />

      {/* Toolbar: search + filters in one compact row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 h-9"
        />

        <div className="h-5 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <Chip label="All Roles" active={!roleFilter} onClick={() => setRoleFilter('')} />
          <Chip label="Admin" active={roleFilter === 'admin'} onClick={() => setRoleFilter('admin')} />
          <Chip label="Teacher" active={roleFilter === 'teacher'} onClick={() => setRoleFilter('teacher')} />
          <Chip label="Student" active={roleFilter === 'student'} onClick={() => setRoleFilter('student')} />
        </div>

        <div className="h-5 w-px bg-border hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <Chip label="All Status" active={!studentStatusFilter} onClick={() => setStudentStatusFilter('')} />
          <Chip label="Active" active={studentStatusFilter === 'active'} onClick={() => setStudentStatusFilter('active')} />
          <Chip label="Archived" active={studentStatusFilter === 'archived'} onClick={() => setStudentStatusFilter('archived')} />
        </div>

        {!loading && !error && (
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {users.length} user{users.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">{error}</div>
      )}

      {users.length === 0 && !loading ? (
        <EmptyState
          icon={Users}
          title="No users found"
          message="Create a user to get started"
          actionLabel="Add User"
          actionHref="/dashboard/users/new"
        />
      ) : (
        <DesktopUsersTable
          users={users}
          onDelete={(id, email) => setUserToDelete({ id, email })}
        />
      )}

      <UserDeleteDialog
        user={userToDelete}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setUserToDelete(null)}
      />
    </motion.div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 px-3 rounded-full text-xs font-medium whitespace-nowrap',
        'transition-colors active:scale-95',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
