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
import { Plus, UserPlus, Shield, Store, Mail, Globe } from 'lucide-react';
import { useCollection, useFirestore } from "@/firebase";
import { collection, addDoc, setDoc, doc, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

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
    if (!newUserEmail || !newUserName || !firestore) return;
    
    // We use a deterministic ID based on email for the prototype, 
    // in production this would sync with Firebase Auth UID.
    const tempUid = newUserEmail.replace(/[.@]/g, '_');
    const userData: UserProfile = {
      uid: tempUid,
      email: newUserEmail,
      displayName: newUserName,
      role: newUserRole,
      ...(newUserRole === 'outlet-admin' && { outletId: selectedOutletId })
    };

    setDoc(doc(firestore, 'users', tempUid), userData)
      .then(() => {
        toast({ title: "Success", description: `Access granted to ${newUserName}.` });
        setIsUserDialogOpen(false);
        setNewUserName(""); setNewUserEmail(""); setSelectedOutletId("");
      })
      .catch((error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${tempUid}`,
          operation: 'create',
          requestResourceData: userData
        }));
      });
  };

  return (
    <div className="container mx-auto p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tight italic text-primary">Authority Control</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Manage administrative access and store permissions</p>
        </div>
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
                <Button className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg px-6">
                  <UserPlus className="mr-2 h-4 w-4"/> Authorize Admin User
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[32px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary italic">Create Identity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                        <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="e.g. Rajesh Kumar" className="h-12 rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Email Address</Label>
                        <Input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="rajesh@zapizza.com" className="h-12 rounded-xl font-bold" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Administrative Role</Label>
                          <Select onValueChange={(val: any) => setNewUserRole(val)} value={newUserRole}>
                              <SelectTrigger className="h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="outlet-admin" className="text-[10px] font-bold uppercase">Outlet Manager</SelectItem>
                                  <SelectItem value="franchise-owner" className="text-[10px] font-bold uppercase">Super Admin (Global)</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      {newUserRole === 'outlet-admin' && (
                          <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Assign Kitchen Pipeline</Label>
                              <Select onValueChange={setSelectedOutletId} value={selectedOutletId}>
                                  <SelectTrigger className="h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest"><SelectValue placeholder="Select Outlet" /></SelectTrigger>
                                  <SelectContent>
                                      {outlets?.map(outlet => (
                                          <SelectItem key={outlet.id} value={outlet.id} className="text-[10px] font-bold uppercase">{outlet.name}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                      )}
                    </div>
                </div>
                <DialogFooter className="bg-muted/30 p-6 -mx-6 -mb-6 rounded-b-[32px]">
                    <Button onClick={handleAddUser} disabled={!newUserName || !newUserEmail || (newUserRole === 'outlet-admin' && !selectedOutletId)} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                        Commit Access Level
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b-gray-100 hover:bg-transparent">
                            <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 pl-8">Admin Profile</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Role</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest h-14">Jurisdiction</TableHead>
                            <TableHead className="font-black uppercase text-[10px] tracking-widest h-14 text-right pr-8">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 4}).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={4} className="py-6 pl-8"><Skeleton className="h-10 w-full rounded-2xl" /></TableCell></TableRow>
                        )) : adminUsers && adminUsers.length > 0 ? adminUsers.map(user => {
                            const outlet = user.outletId ? outlets?.find(o => o.id === user.outletId) : null;
                            return (
                            <TableRow key={user.uid} className="border-b-gray-50 hover:bg-gray-50/30 transition-colors">
                                <TableCell className="pl-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black italic">
                                            {user.displayName?.charAt(0) || 'A'}
                                        </div>
                                        <div className="flex flex-col">
                                          <span className="font-black uppercase text-[13px] tracking-tight text-[#333] italic">{user.displayName || 'N/A'}</span>
                                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'franchise-owner' ? 'default' : 'secondary'} className="font-black uppercase text-[8px] tracking-widest h-5 px-2 gap-1 rounded-sm">
                                        {user.role === 'franchise-owner' ? <Shield className="h-2.5 w-2.5" /> : <Store className="h-2.5 w-2.5" />}
                                        {user.role === 'franchise-owner' ? 'Super Admin' : 'Kitchen Admin'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.role === 'franchise-owner' ? (
                                        <div className="flex items-center gap-2 text-primary">
                                          <Globe className="h-3.5 w-3.5" />
                                          <span className="text-[10px] font-black uppercase tracking-widest">Global Network</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Store className="h-3.5 w-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{outlet?.name || 'Unassigned'}</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <Switch
                                        checked={true}
                                        disabled={user.role === 'franchise-owner'}
                                    />
                                </TableCell>
                            </TableRow>
                        )}) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic uppercase text-[10px] font-black tracking-[0.2em] opacity-40">No administrative profiles found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
