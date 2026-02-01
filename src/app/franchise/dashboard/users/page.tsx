"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { USERS, OUTLETS } from '@/lib/data';
import type { User } from '@/lib/types';
import { Plus } from 'lucide-react';

export default function FranchiseUsersPage() {
  const [users, setUsers] = useState<User[]>(USERS);

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
                        {users.map(user => {
                            const outlet = user.outletId ? OUTLETS.find(o => o.id === user.outletId) : null;
                            return (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
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
