
"use client";
import { useState, useEffect } from "react";
import { ChevronDown, MapPin, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import type { City, Outlet } from "@/lib/types";

export function MainNav() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [locationLabel, setLocationLabel] = useState("Select Location");

  useEffect(() => {
    const savedCity = localStorage.getItem("zapizza-city");
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    
    if (savedOutlet) {
      try {
        const outlet: Outlet = JSON.parse(savedOutlet);
        setLocationLabel(outlet.name);
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

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-[#00143c] text-white">
      <div className="container mx-auto flex h-16 max-w-full items-center justify-between px-4">
        <div className="flex items-center gap-1 overflow-hidden" onClick={handleChangeLocation}>
          <MapPin className="h-5 w-5 text-white flex-shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center font-bold text-sm">
              <span className="truncate max-w-[180px]">{locationLabel}</span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </div>
            <span className="text-[10px] text-white/70 whitespace-nowrap">Tap to change location</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {loading ? (
             <Avatar className="h-8 w-8"><AvatarFallback>?</AvatarFallback></Avatar>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border border-white/20">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-[#002a77] text-white">{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
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
