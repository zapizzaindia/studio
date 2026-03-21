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
import { LayoutDashboard, Store, List, BarChart, Users, LogOut, Image as ImageIcon, Ticket, Settings, Smartphone, BellRing } from "lucide-react";
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
  { href: "/franchise/dashboard/app-banners", label: "Startup Splash", icon: Smartphone },
  { href: "/franchise/dashboard/coupons", label: "Marketing Coupons", icon: Ticket },
  { href: "/franchise/dashboard/notifications", label: "Marketing Pushes", icon: BellRing },
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

  const profileId = user?.email?.toLowerCase().trim() || null;
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', profileId || 'dummy');

  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.replace('/franchise/login');
      return;
    }

    if (!user.email) return;

    if (profileLoading) return;

    if (!profileLoading && !userProfile) {
      console.log("❌ Franchise profile NOT found:", user?.email);
      router.replace('/franchise/login');
      return;
    }

    if (userProfile && userProfile.role !== 'franchise-owner') {
      console.log("❌ Not franchise owner:", userProfile.role);
      router.replace('/franchise/login');
      return;
    } else if (userProfile) {
      console.log("✅ Franchise verified:", user.email);
      setIsVerifying(false);
    }
  }, [user, userLoading, profileLoading, userProfile, router]);

  const handleLogout = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/franchise/login');
  }
  
  if (userLoading || isVerifying) {
    return (
        <div className="flex flex-col h-screen w-full items-center justify-center bg-white">
            <ZapizzaLogo className="h-16 w-16 text-primary animate-pulse mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Verifying Master Terminal...</p>
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
                    Zapizza Global
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
                            <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="font-headline text-xl font-bold text-primary hidden sm:block uppercase tracking-tight italic">
                        {navItems.find(item => pathname.startsWith(item.href) && (item.href === '/franchise/dashboard' ? pathname === item.href : true))?.label || "Super Admin"}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">{userProfile?.displayName || 'Master Owner'}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Global Jurisdiction</p>
                    </div>
                    <Avatar className="h-9 w-9 border-2 border-primary/10 shadow-sm">
                       <AvatarImage src={user?.photoURL || undefined} />
                       <AvatarFallback className="bg-primary text-white font-black">{(userProfile?.displayName || 'S').charAt(0)}</AvatarFallback>
                    </Avatar>
                     <Button variant="ghost" size="icon" className="md:hidden" onClick={handleLogout}>
                        <LogOut className="h-5 w-5"/>
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-8 bg-[#f8f9fa]">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  );
}
