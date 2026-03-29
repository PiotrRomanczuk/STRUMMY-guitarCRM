'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ExportButton } from '@/components/users/actions/ExportButton';
import { CsvSongImportButton } from '@/components/users/import';
import {
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Sparkles,
  Users,
  User,
  Mail,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ParentProfile } from '@/types/ParentProfile';

interface UserDetailProps {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    is_admin: boolean;
    is_teacher: boolean;
    is_student: boolean;
    is_shadow: boolean | null;
    is_parent: boolean;
    avatar_url: string | null;
    notes: string | null;
    created_at?: string | null;
  };
  parentProfile?: ParentProfile | null;
  linkedStudents?: ParentProfile[];
}

const ROLE_STYLES: Record<string, string> = {
  Admin: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  Teacher: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Student: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Parent: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

export default function UserDetail({
  user,
  parentProfile,
  linkedStudents = [],
}: UserDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/dashboard/users');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error deleting user'
      );
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const roles = [
    user.is_admin && 'Admin',
    user.is_teacher && 'Teacher',
    user.is_student && 'Student',
    user.is_parent && 'Parent',
  ].filter(Boolean) as string[];

  const isRegistered = !user.is_shadow;
  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
          <div className="px-6 pt-6 pb-5">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <Avatar className="h-20 w-20 border-3 border-background shadow-xl ring-2 ring-primary/10 shrink-0">
                <AvatarImage src={user.avatar_url || ''} />
                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Name, meta, badges */}
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-2xl font-bold text-foreground truncate">
                  {user.full_name || 'User Profile'}
                </h1>

                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {user.email}
                  </span>
                  {memberSince && (
                    <span className="hidden sm:flex items-center gap-1 shrink-0">
                      <Calendar className="h-3.5 w-3.5" />
                      Since {memberSince}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <Badge
                    variant="outline"
                    className={
                      isRegistered
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-[11px]'
                        : 'bg-muted text-muted-foreground border-border text-[11px]'
                    }
                  >
                    {isRegistered ? 'Registered' : 'Unregistered'}
                  </Badge>
                  {roles.map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className={`text-[11px] ${ROLE_STYLES[role] || ''}`}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {user.is_student && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <CsvSongImportButton studentId={user.id} />
                    <ExportButton
                      userId={user.id}
                      userName={user.full_name || user.email}
                    />
                  </div>
                )}

                <Link href="/dashboard/ai">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">AI Suggestions</span>
                  </Button>
                </Link>

                <Link href={`/dashboard/users/${user.id}/edit`}>
                  <Button size="sm" className="gap-1.5 text-xs shadow-sm">
                    <Edit className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit Profile</span>
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Bottom section: notes + parent */}
          <div className="border-t bg-card/50 px-6 py-4">
            <div className="flex gap-6">
              {/* Notes */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Teacher Notes
                  </span>
                  <Link
                    href={`/dashboard/users/${user.id}/edit`}
                    className="text-[10px] text-primary hover:text-primary/80 font-medium"
                  >
                    Edit
                  </Link>
                </div>
                <Link href={`/dashboard/users/${user.id}/edit`}>
                  {user.notes ? (
                    <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed hover:text-foreground transition-colors">
                      {user.notes}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 py-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors group">
                      <FileText className="h-4 w-4 group-hover:text-primary transition-colors" />
                      <span className="text-xs">
                        Click to add private notes...
                      </span>
                    </div>
                  )}
                </Link>
              </div>

              {/* Parent (if exists) */}
              {parentProfile && (
                <div className="shrink-0 border-l pl-6">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Parent / Guardian
                  </span>
                  <Link
                    href={`/dashboard/users/${parentProfile.id}`}
                    className="flex items-center gap-2 mt-2 hover:text-primary transition-colors"
                  >
                    <div className="p-1.5 bg-muted rounded-full">
                      <Users className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium truncate">
                      {parentProfile.full_name || parentProfile.email}
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linked students (for parent profiles) */}
        {user.is_parent && linkedStudents.length > 0 && (
          <div className="border-t px-6 py-4">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Linked Students
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {linkedStudents.map((student) => (
                <Link
                  key={student.id}
                  href={`/dashboard/users/${student.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {student.full_name || student.email}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mobile-only actions */}
        {user.is_student && (
          <div className="sm:hidden border-t px-6 py-3 flex gap-2">
            <CsvSongImportButton studentId={user.id} />
            <ExportButton
              userId={user.id}
              userName={user.full_name || user.email}
            />
          </div>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{user.full_name || user.email}</strong>?
              <br />
              <br />
              This action ensures all data (lessons, songs, assignments) is
              permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
