"use client";
import { useState, useEffect } from "react";
import { ChevronDown, MapPin, User, LogOut } from "lucide-react";
import { ZapizzaLogo } from "./icons";
import { Button } from "./ui/button";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
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
  const auth = useAuth();
  const router = useRouter();
  const [locationLabel, setLocationLabel] = useState("Select Location");

  useEffect(() => {
    const savedCity = localStorage.getItem("zapizza-city");
    const savedOutlet = localStorage.getItem("zapizza-outlet");
    
    if (savedOutlet) {
      const outlet: Outlet = JSON.parse(savedOutlet);
      setLocationLabel(outlet.name);
    } else if (savedCity) {
      const city: City = JSON.parse(savedCity);
      setLocationLabel(city.name);
    }
  }, []);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  }

  const handleChangeLocation = () => {
    localStorage.removeItem("zapizza-city");
    localStorage.removeItem("zapizza-outlet");
    window.location.reload(); // Force reload to trigger CitySelector
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <ZapizzaLogo className="h-8 w-8 text-primary" />
          <h1 className="hidden font-headline text-2xl font-bold text-primary sm:block">
            Zapizza
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="flex items-center gap-2 text-left" onClick={handleChangeLocation}>
            <MapPin className="h-5 w-5 text-primary" />
            <div className="hidden xs:block">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Delivering to</span>
                <p className="flex items-center font-bold text-sm leading-tight truncate max-w-[120px]">
                  {locationLabel} <ChevronDown className="ml-1 h-3 w-3 flex-shrink-0" />
                </p>
            </div>
          </Button>
          
          {loading ? (
             <Avatar className="h-8 w-8"><AvatarFallback>?</AvatarFallback></Avatar>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
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
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/login')}>
              <User className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
