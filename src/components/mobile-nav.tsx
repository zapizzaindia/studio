
"use client";

import Link from "next/link";
import { LayoutGrid, ShoppingBag, Home, Crown } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useEffect, useState } from "react";
import type { Outlet } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [brand, setBrand] = useState<'zapizza' | 'zfry'>('zapizza');

  useEffect(() => {
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    if (savedOutlet) {
      try {
        const outlet: Outlet = JSON.parse(savedOutlet);
        setBrand(outlet.brand || 'zapizza');
      } catch (e) {}
    }
  }, [pathname]);

  const navItems = [
    { href: "/home", label: brand === 'zfry' ? 'Zfry' : 'Zapizza', icon: Home },
    { href: "/home/checkout", label: "Cart", icon: ShoppingBag, badge: totalItems },
    { href: "/home/menu", label: "Menu", icon: LayoutGrid },
    { href: "/home/rewards", label: "LP Rewards", icon: Crown },
  ];

  // Hide navigation on checkout and success pages to focus user on the transaction
  // This also prevents layout overlap with the fixed checkout payment bar
  if (pathname === '/home/checkout' || pathname === '/home/checkout/success') {
    return null;
  }

  const activeColor = brand === 'zfry' ? '#e31837' : '#14532d';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.05)] md:hidden">
      <nav className="container mx-auto flex max-w-full items-center justify-around px-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              href={item.href}
              key={item.label}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-all relative h-full"
              style={{ color: isActive ? activeColor : '#666666' }}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive ? 'scale-110' : '')} strokeWidth={isActive ? 3 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#e31837] text-[8px] font-bold text-white border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[9px] font-black uppercase tracking-tight", isActive ? 'opacity-100' : 'opacity-60')}>
                {item.label}
              </span>
              {isActive && (
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 rounded-b-full" 
                  style={{ backgroundColor: activeColor }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
