import Link from "next/link";
import { Home, Package, ShoppingCart, User } from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/80 backdrop-blur-sm md:hidden">
      <nav className="container mx-auto grid max-w-4xl grid-cols-4 items-center justify-items-center px-4 py-2">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label} legacyBehavior passHref>
            <a className="flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary">
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
}
