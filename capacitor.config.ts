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
  plugins: {
    SystemBars: {
      // L'app est toujours sur fond blanc : heure, réseau et batterie en NOIR,
      // même quand le téléphone est en mode sombre.
      style: 'LIGHT',
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
