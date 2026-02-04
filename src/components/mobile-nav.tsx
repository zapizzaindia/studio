
"use client";

import Link from "next/link";
import { LayoutGrid, Percent } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/home", label: "Menu", icon: LayoutGrid },
  { href: "/offers", label: "Offers", icon: Percent },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <nav className="container mx-auto flex max-w-full items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              href={item.href}
              key={item.label}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
