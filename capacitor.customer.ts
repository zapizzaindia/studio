import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zapizza.customer',
  appName: 'Zapizza',
  webDir: 'out',
  server: {
    url: 'https://orders.zapizza.co.in',
    cleartext: true
  }
};

export default config;