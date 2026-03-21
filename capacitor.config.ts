import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zapizza.pos',
  appName: 'Zapizza Partners',
  webDir: 'out'
server: {
  url: "https://orders.zapizza.co.in/admin/login",
  cleartext: false
}
};

export default config;