'use client';

import Link from 'next/link';
import { MoreHorizontal, Trash2, Eye, Pencil } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getDisplayName,
  getInitials,
  getRoleDisplay,
  hasRealName,
} from './types';
import type { UserProfile } from './types';

interface DesktopUsersTableProps {
  users: UserProfile[];
  onDelete: (id: string, email: string) => void;
}

export function DesktopUsersTable({
  users,
  onDelete,
}: DesktopUsersTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <TableCell className="relative">
                  <Link
                    href={`/dashboard/users/${user.id}`}
                    className="absolute inset-0 z-0"
                    aria-label={`View ${getDisplayName(user)}`}
                  />
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p
                        className={`text-sm truncate ${
                          hasRealName(user)
                            ? 'font-medium'
                            : 'text-muted-foreground italic'
                        }`}
                      >
                        {getDisplayName(user)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email || '(no email)'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getRoleDisplay(user)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        user.isActive
                          ? 'bg-green-500'
                          : 'bg-muted-foreground/40'
                      }`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {user.isActive ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className="relative z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/users/${user.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/users/${user.id}/edit`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          onDelete(user.id, user.email || 'User')
                        }
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
