import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zapizza.customer',
  appName: 'Zapizza',
  webDir: 'out',
  android: {
    allowMixedContent: true,
    backgroundColor: "#FFFFFF"
  }
};

export default config;