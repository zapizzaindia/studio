'use client';

import React, { useEffect } from 'react';
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
import { LayoutDashboard, ShoppingCart, List, BarChart, Store, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile, Outlet } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/dashboard/menu", label: "Menu", icon: List },
  { href: "/admin/dashboard/reports", label: "Reports", icon: BarChart },
  { href: "/admin/dashboard/outlet", label: "Outlet", icon: Store },
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
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || 'dummy');
  const { data: outlet, loading: outletLoading } = useDoc<Outlet>('outlets', userProfile?.outletId || 'dummy');


  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/admin/login');
    }
    if (!profileLoading && userProfile && userProfile.role !== 'outlet-admin') {
      auth?.signOut();
      router.replace('/admin/login');
    }
  }, [user, userLoading, userProfile, profileLoading, auth, router]);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        router.push('/login');
    }
  }

  if (userLoading || profileLoading || outletLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading Dashboard...</p>
        </div>
    )
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                <ZapizzaLogo className="h-8 w-8 text-primary" />
                <h1 className="font-headline text-xl font-bold text-primary">
                    Zapizza Admin
                </h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href) && (item.href === '/admin/dashboard' ? pathname === item.href : true) } >
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
                        {navItems.find(item => pathname.startsWith(item.href) && (item.href === '/admin/dashboard' ? pathname === item.href : true))?.label}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {outlet ? <p className="text-sm text-muted-foreground">{outlet.name}</p> : <Skeleton className="h-5 w-24" />}
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL || undefined} />
                      <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                     <Button asChild variant="ghost" className="md:hidden" onClick={handleLogout}>
                        <LogOut className="h-5 w-5"/>
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  );
}
