"use client";

import { motion } from "framer-motion";
import { Store, ChevronLeft, Search, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { Outlet } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ZapizzaLogo } from "./icons";
import { useCollection } from "@/firebase";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

type OutletSelectorProps = {
  cityId: string;
  onOutletSelect: (outlet: Outlet) => void;
  onBack: () => void;
};

export function OutletSelector({ cityId, onOutletSelect, onBack }: OutletSelectorProps) {
  const { data: outlets, loading } = useCollection<Outlet>('outlets', {
    where: ['cityId', '==', cityId]
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-background p-4"
    >
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <ZapizzaLogo className="h-10 w-10 text-primary" />
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex flex-col items-center pt-4 text-center">
        <h1 className="font-headline text-3xl font-bold">Select Outlet</h1>
        <p className="max-w-xs text-muted-foreground mt-2">
          Which Zapizza kitchen should prepare your feast?
        </p>
      </div>

      <div className="my-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Find nearby outlet" className="pl-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <h2 className="font-headline text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Available Outlets</h2>
        <div className="space-y-4">
          {loading ? Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} className="h-32 w-full rounded-xl" />
          )) : (
            outlets?.map((outlet) => (
              <Card 
                key={outlet.id} 
                className={`overflow-hidden cursor-pointer hover:border-primary transition-all active:scale-[0.98] ${!outlet.isOpen && 'opacity-70 bg-muted/50'}`}
                onClick={() => outlet.isOpen && onOutletSelect(outlet)}
              >
                <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${outlet.isOpen ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <Store className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-headline text-lg font-bold">{outlet.name}</h3>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{outlet.openingTime} - {outlet.closingTime}</span>
                                </div>
                            </div>
                        </div>
                        <Badge variant={outlet.isOpen ? "secondary" : "destructive"} className="flex gap-1 items-center">
                            {outlet.isOpen ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {outlet.isOpen ? "Open" : "Closed"}
                        </Badge>
                    </div>
                </CardContent>
              </Card>
            ))
          )}
          {!loading && outlets?.length === 0 && (
            <div className="text-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">No outlets found in this city yet.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
