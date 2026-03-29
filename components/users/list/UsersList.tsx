'use client';

import { useState } from 'react';
import Link from 'next/link';
import UsersListFilters from './UsersListFilters';
import UsersListTable from './UsersListTable';
import { useUsersList } from '../hooks/useUsersList';
import { deleteUser } from '@/app/dashboard/actions';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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
import { TableSkeleton } from '@/components/ui/data-table';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  isAdmin: boolean;
  isTeacher: boolean | null;
  isStudent: boolean | null;
  isActive: boolean;
  isRegistered: boolean;
  studentStatus: 'active' | 'archived';
  avatar_url: string | null;
  created_at: string | null;
}

interface UsersListProps {
  initialUsers?: UserProfile[];
}

export default function UsersList({ initialUsers }: UsersListProps = {}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | 'admin' | 'teacher' | 'student'>('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'' | 'active' | 'archived'>('active');
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { users, loading, error, refetch } = useUsersList(search, roleFilter, activeFilter, studentStatusFilter, initialUsers);

  const handleDeleteClick = (userId: string, email: string) => {
    setUserToDelete({ id: userId, email });
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      toast.success('User deleted successfully');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const handleReset = () => {
    setSearch('');
    setRoleFilter('');
    setActiveFilter('');
    setStudentStatusFilter('active');
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        <Button asChild data-testid="create-user-button" className="w-full sm:w-auto">
          <Link href="/dashboard/users/new">
            <Plus className="mr-2 h-4 w-4 sm:h-4 sm:w-4" /> New User
          </Link>
        </Button>
      </div>

      <UsersListFilters
        search={search}
        roleFilter={roleFilter}
        activeFilter={activeFilter}
        studentStatusFilter={studentStatusFilter}
        onSearchChange={setSearch}
        onRoleFilterChange={setRoleFilter}
        onActiveFilterChange={setActiveFilter}
        onStudentStatusFilterChange={setStudentStatusFilter}
        onReset={handleReset}
      />

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && (
        <p className="text-sm text-muted-foreground">
          {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
      )}

      {loading ? (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <TableSkeleton columns={4} rows={5} />
        </div>
      ) : (
        <UsersListTable users={users} onDelete={handleDeleteClick} />
      )}

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              {userToDelete && (
                <span className="font-medium text-foreground"> {userToDelete.email} </span>
              )}
              and remove their data from our servers.
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
    </div>
  );
}
