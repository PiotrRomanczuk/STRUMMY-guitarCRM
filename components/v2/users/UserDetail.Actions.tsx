'use client';

import Link from 'next/link';
import { Edit, Mail, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export function HeaderActions({
  userId,
  needsInvite,
  onDelete,
  onSendInvite,
}: {
  userId: string;
  needsInvite?: boolean;
  onDelete: () => void;
  onSendInvite?: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" asChild>
        <Link href={`/dashboard/users/${userId}/edit`}>
          <Edit className="h-5 w-5" />
          <span className="sr-only">Edit profile</span>
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
            <MoreVertical className="h-5 w-5" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/users/${userId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Link>
          </DropdownMenuItem>
          {needsInvite && onSendInvite && (
            <DropdownMenuItem onClick={onSendInvite}>
              <Mail className="h-4 w-4 mr-2" />
              Send Invite
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DeleteDialog({
  open,
  onOpenChange,
  userName,
  deleting,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{userName}</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Deleting...' : 'Delete User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function InviteDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  sending,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Invitation Email</AlertDialogTitle>
          <AlertDialogDescription>
            Send an invitation email to <strong>{userName}</strong> at <strong>{userEmail}</strong>?
            They will receive a link to set up their password and access their account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSend}>
            {sending ? 'Sending...' : 'Send Invite'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
