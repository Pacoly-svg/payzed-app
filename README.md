# Payzed — Mobile Banking & Fintech Experience

Application mobile de fintech et néo-banque moderne conçue avec **React 19**, **TypeScript**, **Tailwind CSS v4** et **Capacitor Android**.

## ✨ Fonctionnalités
- Solde, envoi d'argent, réception par QR code
- Crédit téléphonique, factures (Senelec, Woyofal, Sen'Eau, Rapido), abonnements, coffres d'épargne
- Carte virtuelle avec blocage, plafond, paiements en ligne / sans contact
- Verrouillage par code PIN (1234 par défaut) et empreinte
- Voir `AUDIT.md` pour le détail de la version 1.1.0

**Prérequis :** Node.js 22+, Java 21 pour compiler Android.

## 📲 Télécharger l'APK
Chaque mise à jour sur `main` publie automatiquement l'APK dans l'onglet **Releases** du dépôt GitHub.

## 🚀 Installation & Développement

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement local
npm run dev

# Compiler pour la production
npm run build
```

## 📱 Build Android (Capacitor)

```bash
# Synchroniser les assets web avec le projet Android
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android
```

## ✅ Tests
```bash
# Prérequis : Playwright + Chromium, ffmpeg et ImageMagick (scan QR)
./tests/e2e/run.sh
```
Voir `AUDIT.md` (compte rendu) et `docs/LOGOS.md` (inventaire des logos).
