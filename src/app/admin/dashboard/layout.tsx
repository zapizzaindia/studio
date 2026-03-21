
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
  { href: "/admin/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/dashboard/menu", label: "Stock", icon: List },
  { href: "/admin/dashboard/reports", label: "Reports", icon: BarChart },
  { href: "/admin/dashboard/outlet", label: "Settings", icon: Store },
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
  
  // Use email-based profile ID
  const profileId = user?.email?.toLowerCase().trim() || null;
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', profileId || 'dummy');
  
  const effectiveOutletId = userProfile?.outletId || 'dummy';
  const { data: outlet } = useDoc<Outlet>('outlets', effectiveOutletId);

  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Only proceed if auth status is known
    if (userLoading) return;

    // If definitely not logged in
    if (!user) {
      router.replace('/admin/login');
      return;
    }

    // Wait for profile to load before making role-based decisions
    if (profileLoading) return;

    // If profile is loaded but missing or wrong role
    if (!userProfile || userProfile.role !== 'outlet-admin') {
      router.replace('/admin/login');
      return;
    }

    // Access granted
    setIsVerifying(false);
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
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verifying Node...</p>
            </div>
        </div>
    )
  }

  return (
    <SidebarProvider>
        <Sidebar collapsible="icon">
            <SidebarHeader>
              <div className="flex flex-col items-start gap-2 p-4">
                <ZapizzaLogo className="h-10 w-10 text-primary" />
                <h1 className="font-headline text-lg font-bold text-primary leading-tight uppercase italic tracking-tighter group-data-[collapsible=icon]:hidden">
                    Admin Node
                </h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
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
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-md px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <div className="flex flex-col">
                        <h1 className="font-headline text-sm font-black text-primary uppercase italic leading-none">
                            {navItems.find(item => pathname.startsWith(item.href))?.label || "Terminal"}
                        </h1>
                        {outlet && <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-0.5">{outlet.name}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border-2 border-primary/10">
                      <AvatarImage src={user?.photoURL || undefined} />
                      <AvatarFallback>{(userProfile?.displayName || 'A').charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 bg-[#f8f9fa] pb-24">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  );
}
