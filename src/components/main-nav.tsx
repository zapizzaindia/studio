"use client";
import { ChevronDown, MapPin, User } from "lucide-react";
import { ZapizzaLogo } from "./icons";
import { Button } from "./ui/button";

export function MainNav() {
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
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
