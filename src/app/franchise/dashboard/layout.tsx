
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
import { LayoutDashboard, Store, List, BarChart, Users, LogOut, Image as ImageIcon, Ticket, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useDoc, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';


const navItems = [
  { href: "/franchise/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/franchise/dashboard/outlets", label: "Outlets", icon: Store },
  { href: "/franchise/dashboard/menu", label: "Global Menu", icon: List },
  { href: "/franchise/dashboard/banners", label: "Global Banners", icon: ImageIcon },
  { href: "/franchise/dashboard/coupons", label: "Marketing Coupons", icon: Ticket },
  { href: "/franchise/dashboard/reports", label: "Reports", icon: BarChart },
  { href: "/franchise/dashboard/users", label: "Users", icon: Users },
  { href: "/franchise/dashboard/settings", label: "Global Settings", icon: Settings },
];


export default function FranchiseDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, loading: userLoading } = useUser();
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', user?.uid || 'dummy');

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/franchise/login');
    }
    if (!profileLoading && userProfile && userProfile.role !== 'franchise-owner') {
      auth?.signOut();
      router.replace('/franchise/login');
    }
  }, [user, userLoading, userProfile, profileLoading, auth, router]);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
        router.push('/login');
    }
  }
  
  if (userLoading || profileLoading) {
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
                    Zapizza Franchise
                </h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href) && (item.href === '/franchise/dashboard' ? pathname === item.href : true) } >
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
                        {navItems.find(item => pathname.startsWith(item.href) && (item.href === '/franchise/dashboard' ? pathname === item.href : true))?.label}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={user?.photoURL || undefined} />
                       <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'S'}</AvatarFallback>
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
