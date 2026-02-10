
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShoppingBag, List, X, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Category, MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollection } from "@/firebase";
import { placeholderImageMap } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/hooks/use-cart";
import { AnimatePresence, motion } from "framer-motion";

export default function MenuPage() {
  const router = useRouter();
  const { addItem, totalItems, totalPrice } = useCart();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');
  
  const { data: categories, loading: categoriesLoading } = useCollection<Category>('categories');
  const { data: menuItems, loading: menuItemsLoading } = useCollection<MenuItem>('menuItems');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (initialCategory && !categoriesLoading) {
        const el = document.getElementById(`cat-${initialCategory}`);
        if (el) {
            setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    }
  }, [initialCategory, categoriesLoading]);

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(`cat-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMenuOpen(false);
  };

  const filteredMenuItems = useMemo(() => {
    if (!menuItems) return [];
    if (!searchQuery) return menuItems;
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuItems, searchQuery]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-white relative">
      {/* Menu Header */}
      <div className="sticky top-16 z-20 bg-white border-b shadow-sm px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search menu..." 
            className="h-9 pl-9 bg-[#f1f2f6] border-none text-xs font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      {!searchQuery && (
        <div className="sticky top-[113px] z-20 bg-white border-b overflow-x-auto px-4 py-3 space-x-6 scrollbar-hide flex items-center">
          {categoriesLoading ? Array.from({length: 4}).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
          )) : categories?.map((category) => (
              <button 
                  key={category.id} 
                  className="text-[11px] font-black text-[#666666] uppercase whitespace-nowrap px-4 py-1.5 rounded-full border border-gray-200 hover:border-[#14532d] hover:text-[#14532d] transition-colors active:bg-[#14532d]/5"
                  onClick={() => scrollToCategory(category.id)}
              >
                  {category.name}
              </button>
          ))}
        </div>
      )}

      {/* Menu Sections */}
      <div className="flex-1 pb-32 bg-white">
        {searchQuery ? (
          <div className="p-6">
             <h3 className="text-sm font-black text-[#14532d] mb-6 uppercase tracking-widest">
                Search Results ({filteredMenuItems.length})
             </h3>
             <div className="space-y-8">
                {filteredMenuItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} onAdd={() => addItem(item)} />
                ))}
                {filteredMenuItems.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground font-medium italic">Oops! No pizzas found for "{searchQuery}"</p>
                  </div>
                )}
             </div>
          </div>
        ) : (
          categories?.map((category) => {
            const categoryItems = menuItems?.filter(i => i.category === category.id) || [];
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} id={`cat-${category.id}`} className="p-6 border-b last:border-0 scroll-mt-36">
                <h3 className="text-base font-black text-[#14532d] mb-6 uppercase tracking-widest flex items-center gap-2">
                  <div className="h-4 w-1 bg-primary rounded-full" />
                  {category.name}
                </h3>
                <div className="space-y-8">
                  {categoryItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAdd={() => addItem(item)} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Menu Button */}
      {!searchQuery && (
        <div className="fixed bottom-36 right-6 z-50">
          <Button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-[#333333] hover:bg-black text-white h-12 w-12 rounded-full shadow-2xl flex items-center justify-center p-0"
            title="Menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <List className="h-6 w-6" />}
          </Button>
        </div>
      )}

      {/* Category Selection Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[51] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="fixed bottom-36 left-4 right-4 bg-white rounded-2xl z-[52] shadow-2xl p-6 overflow-hidden border border-gray-100"
            >
              <h3 className="text-sm font-black text-[#14532d] uppercase tracking-widest mb-4">Choose Category</h3>
              <div className="grid grid-cols-1 gap-1">
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className="flex items-center justify-between w-full py-3 px-4 rounded-xl hover:bg-[#f1f2f6] transition-colors text-left group"
                  >
                    <span className="text-sm font-bold text-[#333333] group-hover:text-[#14532d]">{cat.name}</span>
                    <span className="text-[10px] font-black text-muted-foreground opacity-50">
                      {menuItems?.filter(i => i.category === cat.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <Button 
            onClick={() => router.push('/home/checkout')}
            className="w-full h-14 bg-[#14532d] hover:bg-[#0f4023] text-white flex items-center justify-between px-6 rounded-xl shadow-2xl animate-in slide-in-from-bottom-10"
          >
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{totalItems} ITEMS</span>
              <span className="text-lg font-black">₹{totalPrice}</span>
            </div>
            <div className="flex items-center gap-2 font-black uppercase tracking-widest text-[12px]">
              VIEW CART <ShoppingBag className="h-5 w-5" />
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}

function MenuItemCard({ item, onAdd }: { item: MenuItem, onAdd: () => void }) {
  return (
    <div className="flex gap-5">
      <div className="relative h-28 w-28 flex-shrink-0 rounded-xl overflow-hidden shadow-lg border">
        <Image
          src={placeholderImageMap.get(item.imageId)?.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <div>
            <div className={`h-4 w-4 border-2 mb-1.5 flex items-center justify-center ${item.isVeg ? 'border-[#4CAF50]' : 'border-[#e31837]'}`}>
              <div className={`h-2 w-2 rounded-full ${item.isVeg ? 'bg-[#4CAF50]' : 'bg-[#e31837]'}`} />
            </div>
            <h4 className="text-[14px] font-black text-[#333333] leading-tight uppercase tracking-tight">{item.name}</h4>
            <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-[15px] font-black text-[#14532d]">₹{item.price}</span>
          <Button 
            size="sm" 
            onClick={onAdd}
            className="h-8 px-6 bg-white text-[#e31837] border-2 border-[#e31837] font-black text-[11px] rounded shadow-md uppercase active:bg-[#e31837] active:text-white transition-colors"
          >
            ADD
          </Button>
        </div>
      </div>
    </div>
  );
}
