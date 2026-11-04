import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'sn.payzed.app',
  appName: 'Payzed',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  android: {
    // Pas d'inspection du code depuis un PC sur l'APK installé
    webContentsDebuggingEnabled: false,
    // Le plugin clavier n'est PAS embarqué sur Android : il bloquait le rafraîchissement du
    // texte saisi (corrigé en 1.7). Android redimensionne lui-même la fenêtre (adjustResize).
    includePlugins: [
      '@capacitor/app',
      '@capacitor/device',
      '@capacitor/filesystem',
      '@capacitor/local-notifications',
      '@capacitor/share',
    ],
  },
  ios: {
    // L'app gère elle-même son défilement (une seule zone qui défile) : pas de rebond de la page entière
    scrollEnabled: false,
    contentInset: 'never',
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SystemBars: {
      // L'app est toujours sur fond blanc : heure, réseau et batterie en NOIR,
      // même quand le téléphone est en mode sombre.
      style: 'LIGHT',
      // Pas de mode « bord à bord » : Android redimensionne lui-même la fenêtre quand
      // le clavier s'ouvre (adjustResize). Aucun double décalage, rafraîchissement normal
      // du texte pendant la saisie.
      insetsHandling: 'disable',
    },
    // iPhone uniquement : la fenêtre se réduit quand le clavier s'ouvre (comme Android),
    // le champ en cours de saisie reste visible au-dessus du clavier.
    Keyboard: {
      resize: 'native',
      style: 'LIGHT',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      // iPhone : bannière, son et pastille même quand l'app est ouverte
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
