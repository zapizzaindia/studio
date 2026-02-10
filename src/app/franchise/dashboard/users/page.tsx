
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserProfile, Outlet } from '@/lib/types';
import { Plus, UserPlus, Shield, Store } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function FranchiseUsersPage() {
  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const { data: outlets, loading: outletsLoading } = useCollection<Outlet>('outlets');
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<'outlet-admin' | 'franchise-owner'>('outlet-admin');
  const [selectedOutletId, setSelectedOutletId] = useState("");

  const isLoading = usersLoading || outletsLoading;
  const adminUsers = users?.filter(u => u.role === 'franchise-owner' || u.role === 'outlet-admin');

  const handleAddUser = async () => {
    if (!firestore || !newUserEmail || !newUserName) return;
    
    // In a real app, you would use Firebase Auth to create the user.
    // Here we create the userProfile document which handles the app logic.
    // For the prototype, we use the email as a UID surrogate or generate a random one.
    const tempUid = `user_${Date.now()}`;
    const userData: UserProfile = {
      uid: tempUid,
      email: newUserEmail,
      displayName: newUserName,
      role: newUserRole,
      ...(newUserRole === 'outlet-admin' && { outletId: selectedOutletId })
    };

    try {
      await setDoc(doc(firestore, 'users', tempUid), userData);
      toast({ title: "Admin user added successfully" });
      setIsUserDialogOpen(false);
      // Reset form
      setNewUserName(""); setNewUserEmail(""); setSelectedOutletId("");
    } catch (e) {
      toast({ variant: 'destructive', title: "Error creating user" });
    }
  };

  return (
    <div className="container mx-auto p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="font-headline text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage administrative access and outlet assignments.</p>
        </div>
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
                <Button><UserPlus className="mr-2 h-4 w-4"/> Add New User</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Create Admin User</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="e.g. Rajesh Kumar" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="rajesh@zapizza.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select onValueChange={(val: any) => setNewUserRole(val)} value={newUserRole}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="outlet-admin">Outlet Admin</SelectItem>
                                <SelectItem value="franchise-owner">Franchise Owner (Superadmin)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {newUserRole === 'outlet-admin' && (
                        <div className="space-y-2">
                            <Label>Assign Outlet</Label>
                            <Select onValueChange={setSelectedOutletId} value={selectedOutletId}>
                                <SelectTrigger><SelectValue placeholder="Select Outlet" /></SelectTrigger>
                                <SelectContent>
                                    {outlets?.map(outlet => (
                                        <SelectItem key={outlet.id} value={outlet.id}>{outlet.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleAddUser} disabled={!newUserName || !newUserEmail || (newUserRole === 'outlet-admin' && !selectedOutletId)}>
                        Assign Access
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Admin Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Assigned Jurisdiction</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 4}).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                        )) : adminUsers && adminUsers.length > 0 ? adminUsers.map(user => {
                            const outlet = user.outletId ? outlets?.find(o => o.id === user.outletId) : null;
                            return (
                            <TableRow key={user.uid}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {user.displayName?.charAt(0) || 'A'}
                                        </div>
                                        {user.displayName || 'N/A'}
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'franchise-owner' ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                                        {user.role === 'franchise-owner' ? <Shield className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                                        {user.role === 'franchise-owner' ? 'Super Admin' : 'Outlet Admin'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.role === 'franchise-owner' ? (
                                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Global Access</span>
                                    ) : (
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Store className="h-3.5 w-3.5" />
                                            <span className="text-sm">{outlet?.name || 'Unassigned'}</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Switch
                                        checked={true}
                                        disabled={user.role === 'franchise-owner'}
                                    />
                                </TableCell>
                            </TableRow>
                        )}) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No administrative users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
