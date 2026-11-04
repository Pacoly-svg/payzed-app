import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sn.payzed.app',
  appName: 'Payzed',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  android: {
    // Pas d'inspection du code depuis un PC sur l'APK installé
    webContentsDebuggingEnabled: false,
  },
};

export default config;
