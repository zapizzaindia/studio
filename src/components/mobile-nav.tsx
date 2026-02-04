"use client";

import Link from "next/link";
import { LayoutGrid, ShoppingBag, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/use-cart";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/home/menu", label: "Menu", icon: LayoutGrid },
  { href: "/home/orders", label: "Orders", icon: ShoppingBag },
];

export function MobileNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <nav className="container mx-auto flex max-w-full items-center justify-around px-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isOrders = item.label === "Orders";
          
          return (
            <Link
              href={item.href}
              key={item.label}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all relative h-full ${
                isActive ? "text-[#14532d]" : "text-[#666666]"
              }`}
            >
              <div className="relative">
                <item.icon className={`h-6 w-6 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 3 : 2} />
                {isOrders && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#e31837] text-[8px] font-bold text-white border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
              {isActive && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#14532d] rounded-b-full" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
