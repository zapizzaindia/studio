'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from "next/navigation";
import { ZapizzaLogo } from "@/components/icons";
import Link from 'next/link';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ShoppingCart, List, BarChart, Store, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile, Outlet } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { href: "/admin/dashboard/orders", label: "Live Orders", icon: ShoppingCart },
  { href: "/admin/dashboard/menu", label: "Menu Availability", icon: List },
  { href: "/admin/dashboard/reports", label: "Sales Reports", icon: BarChart },
  { href: "/admin/dashboard/outlet", label: "Outlet Settings", icon: Store },
];

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  
  // Use email as key for admin lookups
  const profileId = user?.email?.toLowerCase().trim() || null;
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', profileId || 'dummy');
  
  const effectiveOutletId = userProfile?.outletId || 'dummy';
  const { data: outlet } = useDoc<Outlet>('outlets', effectiveOutletId);

  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // 1. Wait for Auth state to stabilize
    if (userLoading) return;

    // 2. If definitely no user, go to login
    if (!user) {
      router.replace('/admin/login');
      return;
    }

    // 3. Wait for email to be available (sometimes lags on Android)
    if (!user.email) return;

    // 4. Wait for Firestore profile lookup
    if (profileLoading) return;

    // 5. Verify Role or Missing Profile
    if (!userProfile) {
      // Profile not found in authorized users list
      router.replace('/admin/login');
      return;
    }

    if (userProfile.role !== 'outlet-admin') {
      router.replace('/admin/login');
    } else {
      setIsVerifying(false);
    }
  }, [user, userLoading, profileLoading, userProfile, router]);

  useEffect(() => {
    if (pathname === '/admin/dashboard' && !isVerifying) {
      router.replace('/admin/dashboard/orders');
    }
  }, [pathname, isVerifying, router]);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/admin/login');
  }

  if (userLoading || isVerifying) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <ZapizzaLogo className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Securing Terminal...</p>
            </div>
        </div>
    )
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
              <div className="flex flex-col items-start gap-2 p-4">
                <ZapizzaLogo className="h-10 w-10 text-primary" />
                <h1 className="font-headline text-xl font-bold text-primary leading-tight uppercase italic tracking-tighter">
                    Zapizza Admin
                </h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} >
                      <Link href={item.href}>
                        <item.icon />
                        <span className="font-bold text-xs uppercase tracking-widest">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut />
                            <span className="font-bold text-xs uppercase tracking-widest">Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="font-headline text-xl font-bold text-primary hidden sm:block uppercase italic">
                        {navItems.find(item => pathname.startsWith(item.href))?.label || "Admin Panel"}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                        {outlet ? <p className="text-sm font-bold text-[#14532d]">{outlet.name}</p> : <Skeleton className="h-4 w-24" />}
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kitchen Live</p>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL || undefined} />
                      <AvatarFallback>{(userProfile?.displayName || 'A').charAt(0)}</AvatarFallback>
                    </Avatar>
                     <Button variant="ghost" className="md:hidden" onClick={handleLogout}>
                        <LogOut className="h-5 w-5"/>
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 bg-[#f8f9fa]">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  );
}
