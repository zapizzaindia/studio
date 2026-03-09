import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zapizza.pos',
  appName: 'Zapizza POS',
  webDir: 'out',
  server: {
    url: "https://orders.zapizza.co.in/admin",
    cleartext: false
  }
};

export default config;