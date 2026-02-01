'use client';

import { usePathname } from "next/navigation";
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
import { LayoutDashboard, Store, List, BarChart, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/franchise/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/franchise/dashboard/outlets", label: "Outlets", icon: Store },
  { href: "/franchise/dashboard/menu", label: "Global Menu", icon: List },
  { href: "/franchise/dashboard/reports", label: "Reports", icon: BarChart },
  { href: "/franchise/dashboard/users", label: "Users", icon: Users },
];


export default function FranchiseDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

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
                        <SidebarMenuButton asChild>
                            <Link href="/login">
                                <LogOut />
                                <span>Logout</span>
                            </Link>
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
                      <AvatarImage src="https://i.pravatar.cc/150?u=superadmin" />
                      <AvatarFallback>SA</AvatarFallback>
                    </Avatar>
                     <Button asChild variant="ghost" className="md:hidden">
                        <Link href="/login">
                            <LogOut className="h-5 w-5"/>
                        </Link>
                    </Button>
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6">{children}</main>
        </SidebarInset>
    </SidebarProvider>
  );
}
