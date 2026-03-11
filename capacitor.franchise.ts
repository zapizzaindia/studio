import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zapizza.franchise',
  appName: 'Zapizza Franchise',
  webDir: 'out',
  server: {
    url: 'https://orders.zapizza.co.in/superadmin/login',
    cleartext: true
  }
};

export default config;