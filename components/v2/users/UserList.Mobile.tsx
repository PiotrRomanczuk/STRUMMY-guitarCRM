'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { FloatingActionButton } from '@/components/v2/primitives/FloatingActionButton';
import { SwipeableListItem } from '@/components/v2/primitives/SwipeableListItem';
import { useUsersList } from '@/components/users/hooks/useUsersList';
import { deleteUser } from '@/app/dashboard/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserListSkeleton } from './UserList.Skeleton';
import { UserListFilters } from './UserList.Filters';
import { UserCard, UserListEmptyState } from './UserList.MobileCards';
import { getDisplayName } from './types';
import type { UserProfile } from './types';

interface UserListMobileProps {
  initialUsers?: UserProfile[];
}

export function UserListMobile({ initialUsers }: UserListMobileProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    '' | 'admin' | 'teacher' | 'student'
  >('');
  const [activeFilter] = useState<'' | 'true' | 'false'>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<
    '' | 'active' | 'archived'
  >('active');
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { users, loading, error, refetch } = useUsersList(
    search,
    roleFilter,
    activeFilter,
    studentStatusFilter,
    initialUsers
  );

  const handleDeleteRequest = useCallback((user: UserProfile) => {
    setDeleteTarget(user);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      toast.success('User deleted');
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete user'
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, isDeleting, refetch]);

  return (
    <MobilePageShell
      title="Students"
      subtitle={
        !loading && !error ? `${users.length} student${users.length !== 1 ? 's' : ''}` : undefined
      }
      showBack={false}
      fab={
        <FloatingActionButton
          onClick={() => router.push('/dashboard/users/new')}
          label="Add new user"
        />
      }
    >
      <UserListFilters
        search={search}
        roleFilter={roleFilter}
        studentStatusFilter={studentStatusFilter}
        onSearchChange={setSearch}
        onRoleFilterChange={setRoleFilter}
        onStudentStatusFilterChange={setStudentStatusFilter}
      />

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <UserListSkeleton />
      ) : users.length === 0 ? (
        <UserListEmptyState />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {users.map((user) => (
            <motion.div key={user.id} variants={listItem}>
              <SwipeableListItem
                onEdit={() => router.push(`/dashboard/users/${user.id}/edit`)}
                onDelete={() => handleDeleteRequest(user)}
              >
                <UserCard user={user} />
              </SwipeableListItem>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deleteTarget ? getDisplayName(deleteTarget) : ''}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobilePageShell>
  );
}
