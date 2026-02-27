
"use client";
import { useState, useEffect } from "react";
import { ChevronDown, MapPin, User, LogOut, ShoppingCart, History, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { City, Outlet } from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";

export function MainNav() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { totalItems } = useCart();
  const [locationLabel, setLocationLabel] = useState("Select Location");
  const [brand, setBrand] = useState<"zapizza" | "zfry">("zapizza");

  useEffect(() => {
    const savedCity = localStorage.getItem("zapizza-city");
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    
    if (savedOutlet) {
      try {
        const outlet: Outlet = JSON.parse(savedOutlet);
        setLocationLabel(outlet.name);
        setBrand(outlet.brand || "zapizza");
      } catch (e) {}
    } else if (savedCity) {
      try {
        const city: City = JSON.parse(savedCity);
        setLocationLabel(city.name);
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('zapizza-mock-session');
    window.location.href = '/login';
  }

  const handleChangeLocation = () => {
    localStorage.removeItem("zapizza-city");
    localStorage.removeItem("zapizza-outlet");
    window.location.reload(); 
  }

  const brandBg = brand === "zfry" ? "bg-[#e31837]" : "bg-[#14532d]";

  return (
    <header className={cn("fixed top-0 left-0 right-0 z-30 text-white transition-colors duration-500", brandBg)}>
      <div className="container mx-auto flex h-16 max-w-full items-center justify-between px-4">
        <div className="flex items-center gap-1 overflow-hidden cursor-pointer" onClick={handleChangeLocation}>
          <MapPin className="h-5 w-5 text-white flex-shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center font-bold text-sm font-headline">
              <span className="truncate max-w-[150px] sm:max-w-[180px]">{locationLabel}</span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </div>
            <span className="text-[10px] text-white/70 whitespace-nowrap font-headline">Tap to change location</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative rounded-full h-9 w-9 border border-white/20 mr-1"
            onClick={() => router.push('/home/checkout')}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white font-body tabular-nums">
                {totalItems}
              </span>
            )}
          </Button>

          {loading ? (
             <Avatar className="h-8 w-8"><AvatarFallback>?</AvatarFallback></Avatar>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border border-white/20">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-black/20 text-white font-headline">{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-0">
                <div className="flex items-center gap-3 p-4 bg-[#f1f2f6]/50 border-b">
                   <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className={cn("text-white font-headline", brandBg)}>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black text-[#14532d] truncate uppercase font-headline">{user.displayName || 'Demo User'}</span>
                    <span className="text-[10px] text-muted-foreground truncate font-body">{user.email}</span>
                  </div>
                </div>
                <div className="p-1">
                  <DropdownMenuItem onClick={() => router.push('/home/profile')} className="py-2.5">
                    <User className="mr-3 h-4 w-4 text-[#14532d]" />
                    <span className="font-bold text-xs uppercase tracking-wider font-headline">My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/home/addresses')} className="py-2.5">
                    <MapPin className="mr-3 h-4 w-4 text-[#14532d]" />
                    <span className="font-bold text-xs uppercase tracking-wider font-headline">Manage Addresses</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/home/orders')} className="py-2.5">
                    <History className="mr-3 h-4 w-4 text-[#14532d]" />
                    <span className="font-bold text-xs uppercase tracking-wider font-headline">My Orders</span>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator />
                <div className="p-1">
                  <DropdownMenuItem onClick={handleLogout} className="py-2.5 text-red-600 focus:text-red-600">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-bold text-xs uppercase tracking-wider font-headline">Logout</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border border-white/20" onClick={() => router.push('/login')}>
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
