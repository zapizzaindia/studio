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
  useSidebar,
} from "@/components/ui/sidebar";
import { ShoppingCart, List, BarChart, Store, LogOut, Menu, Wifi, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useUser, useDoc, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { UserProfile, Outlet } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { requestForToken } from '@/firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: "/admin/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/dashboard/menu", label: "Stock", icon: List },
  { href: "/admin/dashboard/reports", label: "Intelligence", icon: BarChart },
  { href: "/admin/dashboard/outlet", label: "Profile", icon: Store },
];

/**
 * 📱 Mobile-Aware Navigation Component
 * This component handles the auto-close behavior for the sidebar on mobile.
 */
function AdminSidebarNav({ 
  navItems, 
  pathname, 
  brandColor, 
  handleLogout 
}: { 
  navItems: any[], 
  pathname: string, 
  brandColor: string,
  handleLogout: () => void
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <SidebarContent className="bg-white">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname.startsWith(item.href)} 
                tooltip={item.label}
                onClick={handleNavClick}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" style={{ color: pathname.startsWith(item.href) ? brandColor : undefined }} />
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
                  <SidebarMenuButton 
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                      handleLogout();
                    }} 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                      <LogOut className="h-5 w-5" />
                      <span className="font-black text-xs uppercase tracking-widest">Logout</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  
  const profileId = user?.email?.toLowerCase().trim() || null;
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>('users', profileId || 'dummy');
  
  const effectiveOutletId = userProfile?.outletId || 'dummy';
  const { data: outlet } = useDoc<Outlet>('outlets', effectiveOutletId);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (userLoading || profileLoading) return;
  
    if (!user) {
      const timer = setTimeout(() => {
        if (!auth?.currentUser) {
          router.replace('/admin/login');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  
    if (!userProfile || userProfile.role !== 'outlet-admin') {
      router.replace('/admin/login');
      return;
    }
  
    setIsVerifying(false);
  }, [user, userLoading, profileLoading, userProfile, auth, router]);

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

  const handleSyncTerminal = async () => {
    if (!user || !db || !profileId) return;
    setIsSyncing(true);
    
    try {
      const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNative;
      
      if (isNative) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.removeAllListeners();
        
        await PushNotifications.addListener('registration', async (token) => {
          await updateDoc(doc(db, 'users', profileId), {
            fcmToken: token.value,
            lastTokenSync: new Date().toISOString()
          });
          toast({ title: "Signal Established", description: "This terminal is now linked to the cloud." });
          setIsSyncing(false);
        });

        await PushNotifications.addListener('registrationError', (err) => {
          toast({ variant: 'destructive', title: "Hardware Error", description: "Could not initialize device bridge." });
          setIsSyncing(false);
        });

        const permStatus = await PushNotifications.requestPermissions();
        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        } else {
          throw new Error("Notification permission denied by device.");
        }
      } else {
        const token = await requestForToken();
        if (token) {
          await updateDoc(doc(db, 'users', profileId), {
            fcmToken: token,
            lastTokenSync: new Date().toISOString()
          });
          toast({ title: "Browser Linked", description: "Signal synchronized successfully." });
        } else {
          throw new Error("Could not capture secure token. Check site permissions.");
        }
        setIsSyncing(false);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Sync Failed", description: e.message || "Please check your network." });
      setIsSyncing(false);
    }
  };

  if (userLoading || isVerifying) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <ZapizzaLogo className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Authenticating Terminal...</p>
            </div>
        </div>
    )
  }

  const brandColor = outlet?.brand === 'zfry' ? '#e31837' : '#14532d';

  return (
    <SidebarProvider>
        <Sidebar collapsible="icon" className="border-r border-gray-100 shadow-xl bg-white">
            <SidebarHeader className="bg-white pt-safe">
              <div className="flex flex-col items-start gap-2 p-4">
                <ZapizzaLogo className="h-10 w-10 text-primary" />
                <h1 className="font-headline text-lg font-black text-primary leading-tight uppercase italic tracking-tighter group-data-[collapsible=icon]:hidden">
                    Admin Node
                </h1>
              </div>
            </SidebarHeader>
            <AdminSidebarNav 
              navItems={navItems} 
              pathname={pathname} 
              brandColor={brandColor} 
              handleLogout={handleLogout} 
            />
        </Sidebar>
        <SidebarInset className="bg-[#f8f9fa] flex flex-col">
            <header className="sticky top-0 z-30 flex h-auto min-h-[4rem] items-center justify-between border-b bg-white/95 backdrop-blur-md px-4 shadow-sm pt-safe pb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <SidebarTrigger className="h-10 w-10 rounded-xl bg-gray-50 border shadow-sm flex items-center justify-center">
                        <Menu className="h-5 w-5 text-primary" />
                    </SidebarTrigger>
                    <div className="flex flex-col text-left min-w-0">
                        <h1 className="font-headline text-[13px] font-black text-primary uppercase italic leading-none truncate">
                            {navItems.find(item => pathname.startsWith(item.href))?.label || "Terminal"}
                        </h1>
                        {outlet && <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1 truncate">{outlet.name}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSyncTerminal}
                        disabled={isSyncing}
                        className={cn(
                            "h-10 rounded-xl font-black text-[9px] uppercase gap-2 border-primary/10 shadow-sm transition-all active:scale-95",
                            userProfile?.fcmToken ? "bg-green-50 text-green-700 border-green-100" : "bg-white text-primary"
                        )}
                    >
                        {isSyncing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <Wifi className={cn("h-3 w-3", userProfile?.fcmToken ? "fill-current" : "")} />
                        )}
                        <span className="hidden min-[400px]:inline">
                          {userProfile?.fcmToken ? "Linked" : "Sync Terminal"}
                        </span>
                    </Button>

                    <Avatar className="h-9 w-9 border-2 border-primary/10 shadow-sm shrink-0">
                      <AvatarImage src={user?.photoURL || undefined} />
                      <AvatarFallback className="bg-primary text-white font-black">{(userProfile?.displayName || 'A').charAt(0)}</AvatarFallback>
                    </Avatar>
                </div>
            </header>
            <main className="flex-1 p-2 bg-[#f8f9fa] pb-32 overflow-x-hidden">
                {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
