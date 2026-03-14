
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
  const [mockUser, setMockUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  useEffect(() => {
    const saved = localStorage.getItem('zapizza-mock-session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.role === 'outlet-admin') {
          setMockUser(parsed);
        }
      } catch (e) {
        console.error("Failed to parse mock session", e);
      }
    }
    setIsInitializing(false);
  }, []);

  const activeUser = user || mockUser;
  const profileId = activeUser?.email?.toLowerCase().trim() || 'dummy';
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', profileId);
  
  // Use userProfile's outletId, or fallback to the mockUser's outletId
  const effectiveOutletId = userProfile?.outletId || mockUser?.outletId || 'dummy';
  const { data: outlet, loading: outletLoading } = useDoc<Outlet>('outlets', effectiveOutletId);

  useEffect(() => {
    if (!userLoading && !isInitializing) {
      if (!user && !mockUser) {
        router.replace('/admin/login');
      }
    }
  }, [user, mockUser, userLoading, isInitializing, router]);

  useEffect(() => {
    if (!profileLoading && userProfile && userProfile.role !== 'outlet-admin') {
      auth?.signOut();
      localStorage.removeItem('zapizza-mock-session');
      router.replace('/admin/login');
    }
    if (pathname === '/admin/dashboard') {
      router.replace('/admin/dashboard/orders');
    }
  }, [userProfile, profileLoading, auth, router, pathname]);

  const handleLogout = async () => {
    localStorage.removeItem('zapizza-mock-session');
    if (auth) {
        await signOut(auth);
    }
    router.push('/admin/login');
  }

  if (userLoading || isInitializing || (activeUser && profileLoading)) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <ZapizzaLogo className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Initialising Terminal...</p>
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
                <h1 className="font-headline text-xl font-bold text-primary leading-tight">
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
                        <span>{item.label}</span>
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
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="font-headline text-xl font-bold text-primary hidden sm:block">
                        {navItems.find(item => pathname.startsWith(item.href))?.label || "Admin Panel"}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                        {outlet ? <p className="text-sm font-bold text-[#14532d]">{outlet.name}</p> : <Skeleton className="h-4 w-24" />}
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kitchen Live</p>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={activeUser?.photoURL || undefined} />
                      <AvatarFallback>{(userProfile?.displayName || mockUser?.displayName || 'A').charAt(0)}</AvatarFallback>
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
