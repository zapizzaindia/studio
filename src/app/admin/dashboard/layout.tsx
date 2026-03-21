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
import { ShoppingCart, List, BarChart, Store, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile, Outlet } from '@/lib/types';

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
  
  const profileId = user?.email?.toLowerCase().trim() || null;
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', profileId || 'dummy');
  
  const effectiveOutletId = userProfile?.outletId || 'dummy';
  const { data: outlet } = useDoc<Outlet>('outlets', effectiveOutletId);

  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.replace('/admin/login');
      return;
    }

    if (profileLoading) return;

    if (userProfile === null || (userProfile && userProfile.role !== 'outlet-admin')) {
      router.replace('/admin/login');
      return;
    }

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
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Secure Terminal Auth...</p>
            </div>
        </div>
    )
  }

  return (
    <SidebarProvider>
        <Sidebar collapsible="icon" className="border-r border-gray-100 shadow-xl bg-white">
            <SidebarHeader className="bg-white">
              <div className="flex flex-col items-start gap-2 p-4">
                <ZapizzaLogo className="h-10 w-10 text-primary" />
                <h1 className="font-headline text-lg font-black text-primary leading-tight uppercase italic tracking-tighter group-data-[collapsible=icon]:hidden">
                    Admin Node
                </h1>
              </div>
            </SidebarHeader>
            <SidebarContent className="bg-white">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="bg-white border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <LogOut className="h-5 w-5" />
                            <span className="font-black text-xs uppercase tracking-widest">Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-[#f8f9fa] flex flex-col">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 backdrop-blur-md px-4 shadow-sm pt-safe shrink-0">
                <div className="flex items-center gap-3">
                    <SidebarTrigger className="h-10 w-10 rounded-xl bg-gray-50 border shadow-sm flex items-center justify-center">
                        <Menu className="h-5 w-5 text-primary" />
                    </SidebarTrigger>
                    <div className="flex flex-col text-left">
                        <h1 className="font-headline text-sm font-black text-primary uppercase italic leading-none">
                            {navItems.find(item => pathname.startsWith(item.href))?.label || "Kitchen Terminal"}
                        </h1>
                        {outlet && <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">{outlet.name}</p>}
                    </div>
                </div>
                <Avatar className="h-9 w-9 border-2 border-primary/10 shadow-sm">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="bg-primary text-white font-black">{(userProfile?.displayName || 'A').charAt(0)}</AvatarFallback>
                </Avatar>
            </header>
            <main className="flex-1 p-2 sm:p-8 bg-[#f8f9fa] pb-32 overflow-x-hidden">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}