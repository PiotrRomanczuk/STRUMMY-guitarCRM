'use client';

import { useState } from 'react';
import Link from 'next/link';
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

interface UserListDesktopProps {
  initialUsers?: UserProfile[];
}

export default function UserListDesktop({ initialUsers }: UserListDesktopProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | 'admin' | 'teacher' | 'student'>('');
  const [activeFilter] = useState<'' | 'true' | 'false'>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'' | 'active' | 'archived'>('active');
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
      className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6"
    >
      <ListPageHeader
        title="Students"
        subtitle="Manage your students and their roles"
        action={{ label: 'New User', href: '/dashboard/users/new' }}
      />

      <div className="flex items-center gap-3">
        <Input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as '' | 'admin' | 'teacher' | 'student')}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <select
          value={studentStatusFilter}
          onChange={(e) => setStudentStatusFilter(e.target.value as '' | 'active' | 'archived')}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">{error}</div>
      )}

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
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
