"use client";
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

export function MainNav() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
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
          <Button variant="ghost" className="flex items-center gap-2 text-left">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
                <span className="text-xs text-muted-foreground">Delivering to</span>
                <p className="flex items-center font-bold">New York <ChevronDown className="ml-1 h-4 w-4" /></p>
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
