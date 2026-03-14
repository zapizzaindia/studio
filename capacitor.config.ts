import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zapizza.pos',
  appName: 'Zapizza POS',
  webDir: 'out',
  server: {
    url: "https://orders.zapizza.co.in/",
    cleartext: false
  }
};

export default config;