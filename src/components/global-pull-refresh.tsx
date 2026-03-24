
'use client';

import React from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';

interface GlobalPullRefreshProps {
  children: React.ReactNode;
}

/**
 * GlobalPullRefresh - Provides a global pull-to-refresh gesture for the entire application.
 * Triggering window.location.reload() ensures all Firebase/Auth states are 
 * re-synchronized cleanly in PWA/Capacitor environments.
 */
export function GlobalPullRefresh({ children }: GlobalPullRefreshProps) {
  const handleRefresh = async () => {
    // Brute force refresh as requested for maximum stability in PWA/Capacitor
    window.location.reload();
    return Promise.resolve();
  };

  return (
    <PullToRefresh 
      onRefresh={handleRefresh}
      className="bg-transparent"
      resistance={2.5}
      pullingContent={
        <div className="flex flex-col items-center justify-center p-4 w-full h-16 animate-in fade-in slide-in-from-top-4">
          <div className="h-1 w-12 bg-[#14532d]/20 rounded-full" />
        </div>
      }
      refreshingContent={
        <div className="flex items-center justify-center p-4 w-full h-16">
          <div className="h-5 w-5 border-2 border-[#14532d] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <div className="min-h-full">
        {children}
      </div>
    </PullToRefresh>
  );
}
