'use client';

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';

/**
 * OfflineDetector - Monitors the browser's connection status.
 * Shows a full-screen block when the device loses internet access.
 */
export function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
        >
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="bg-red-50 p-10 rounded-[40px] shadow-2xl shadow-red-900/10 mb-8 border border-red-100"
          >
            <WifiOff className="h-20 w-20 text-red-600" />
          </motion.div>
          
          <h2 className="text-3xl font-black text-[#333] uppercase italic tracking-tighter mb-3 font-headline">Connection Severed</h2>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest max-w-xs leading-relaxed font-headline">
            We've lost the uplink to the Zapizza servers. Please check your signal to continue your feast.
          </p>
          
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-600 animate-pulse font-headline">
              <div className="h-2 w-2 rounded-full bg-current" />
              Attempting Reconnection...
            </div>
            
            <Button 
              variant="outline" 
              className="h-12 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest font-headline gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="h-4 w-4" /> Force Refresh
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
