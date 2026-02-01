"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { UserProfile, Outlet } from '@/lib/types';
import { Plus } from 'lucide-react';
import { useCollection } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function FranchiseUsersPage() {
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const { data: outlets, loading: outletsLoading } = useCollection<Outlet>('outlets');
  const isLoading = usersLoading || outletsLoading;

  const adminUsers = users?.filter(u => u.role === 'franchise-owner' || u.role === 'outlet-admin');

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h1 className="font-headline text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage admin users for all outlets.</p>
        </div>
        <Button><Plus /> Add New User</Button>
      </div>

        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Assigned Outlet</TableHead>
                            <TableHead className="text-right">Enabled</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 4}).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                        )) : adminUsers?.map(user => {
                            const outlet = user.outletId ? outlets?.find(o => o.id === user.outletId) : null;
                            return (
                            <TableRow key={user.uid}>
                                <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'franchise-owner' ? 'default' : 'secondary'}>
                                        {user.role === 'franchise-owner' ? 'Super Admin' : 'Outlet Admin'}
                                    </Badge>
                                </TableCell>
                                <TableCell>{outlet?.name || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <Switch
                                        checked={true} // Mocked as always enabled
                                        disabled={user.role === 'franchise-owner'}
                                    />
                                </TableCell>
                            </TableRow>
                        )})}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
