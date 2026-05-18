'use client';

import { useEffect } from 'react';

export function StatusBarHandler() {
  useEffect(() => {
    const setupStatusBar = async () => {
      const isNative =
        typeof window !== 'undefined' &&
        (window as any).Capacitor?.isNative;

      if (!isNative) return;

      const { StatusBar, Style } = await import('@capacitor/status-bar');
      const { App } = await import('@capacitor/app');

      const applyTheme = async () => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        });
      };

      // Initial apply
      applyTheme();

      // Detect theme changes
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', applyTheme);

      // Re-apply when app resumes
      App.addListener('resume', applyTheme);
    };

    setupStatusBar();
  }, []);

  return null;
}