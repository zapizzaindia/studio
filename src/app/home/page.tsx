"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Plus, ShoppingCart, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { City, Category, MenuItem } from "@/lib/types";
import { CitySelector } from "@/components/city-selector";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCollection, useUser } from "@/firebase";
import { placeholderImageMap } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    const savedCity = localStorage.getItem("zapizza-city");
    if (savedCity) {
      setSelectedCity(JSON.parse(savedCity));
    }
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    categoryRefs.current[categoryId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user...</p>
      </div>
    );
  }

  if (!selectedCity) {
    return (
      <CitySelector
        onCitySelect={(city) => {
          setSelectedCity(city);
          if (typeof window !== "undefined") {
            localStorage.setItem("zapizza-city", JSON.stringify(city));
          }
        }}
      />
    );
  }

  const sortedCategories = categories ? [...categories].sort((a,b) => (a as any).order - (b as any).order) : [];

  return (
    <div className="container mx-auto max-w-4xl px-4">
      <nav className="sticky top-16 z-10 -mx-4 bg-background/80 py-2 backdrop-blur-sm">
        <div className="flex space-x-4 overflow-x-auto px-4 pb-2">
          {categoriesLoading ? Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />) :
          sortedCategories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => handleCategoryClick(category.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1 h-auto transition-colors duration-300 ${activeCategory === category.id ? 'bg-primary text-primary-foreground' : 'bg-card'}`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </nav>

      <div className="space-y-12">
        {menuItemsLoading ? (
            <div className="space-y-12">
                {Array.from({length: 2}).map((_, i) => (
                    <section key={i} className="pt-4">
                        <Skeleton className="h-8 w-48 mb-4" />
                        <Separator className="my-4" />
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {Array.from({length: 2}).map((_, j) => (
                                <Card key={j}><CardContent className="p-4"><Skeleton className="h-36 w-full" /></CardContent></Card>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        ) : sortedCategories.map((category) => (
          <section
            key={category.id}
            id={category.id}
            ref={(el) => (categoryRefs.current[category.id] = el)}
            className="scroll-mt-24 pt-4"
          >
            <h2 className="font-headline text-2xl font-bold text-foreground">
              {category.name}
            </h2>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {menuItems?.filter((item) => item.category === category.id).map(
                (item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="flex gap-4 p-4">
                      <div className="relative h-28 w-28 flex-shrink-0 sm:h-36 sm:w-36">
                        <Image
                          src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                          alt={item.name}
                          fill
                          className="rounded-lg object-cover"
                          data-ai-hint={placeholderImageMap.get(item.imageId)?.imageHint}
                          sizes="(max-width: 640px) 112px, 144px"
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <h3 className="font-headline text-lg font-semibold">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant={item.isVeg ? 'secondary' : 'destructive'} className="h-5 border-2" style={{ borderColor: item.isVeg ? '#22c55e' : '#ef4444' }}/>
                          <Star className="h-4 w-4 text-accent" fill="currentColor" />
                          <span>4.5</span>
                        </div>
                        <p className="mt-2 flex-1 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-lg font-bold">₹{item.price}</p>
                          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                            <Plus className="mr-2 h-4 w-4" /> Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </section>
        ))}
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ ease: "easeInOut" }}
          className="fixed bottom-24 right-4 z-20 md:bottom-8 md:right-8"
        >
          <Button className="h-14 rounded-full bg-primary pl-6 pr-6 shadow-lg" size="lg">
            <ShoppingCart className="mr-3 h-6 w-6" />
            <span className="font-bold">View Cart (0)</span>
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
