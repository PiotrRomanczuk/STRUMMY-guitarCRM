'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LockKeyhole, ShieldAlert, Unlock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getLockedAccounts, unlockAccount, type LockedAccount } from '@/app/actions/admin/lockout';

const QUERY_KEY = ['admin', 'locked-accounts'];

export function LockedAccountsSection() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: getLockedAccounts,
    refetchInterval: 60000,
  });

  const unlock = useMutation({
    mutationFn: (profileId: string) => unlockAccount(profileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  if (error || data?.success === false) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Locked Accounts Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Failed to load locked accounts.</p>
        </CardContent>
      </Card>
    );
  }

  const accounts: LockedAccount[] = data?.accounts ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockKeyhole className="h-5 w-5 text-primary" />
          Locked Accounts
        </CardTitle>
        <CardDescription>Accounts locked by failed sign-in attempts</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
            <p className="text-sm text-muted-foreground">No accounts are currently locked.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Failed attempts</TableHead>
                  <TableHead>Unlocks</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{account.fullName || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{account.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{account.failedLoginAttempts}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(account.lockedUntil), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={unlock.isPending}
                        onClick={() => unlock.mutate(account.id)}
                      >
                        <Unlock className="h-3 w-3 mr-1" />
                        {unlock.isPending && unlock.variables === account.id
                          ? 'Unlocking…'
                          : 'Unlock'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
