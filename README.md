# Payzed — Mobile Banking & Fintech Experience

Application mobile de fintech et néo-banque moderne conçue avec **React 19**, **TypeScript**, **Tailwind CSS v4** et **Capacitor Android**.

## ✨ Fonctionnalités clés
- **Tableau de bord bancaire & Multi-comptes** : Solde en temps réel, QR code, masquage du solde, statistiques détaillées.
- **Opérations financières** : Virements P2P & interbancaires, recharge de crédit, paiement de factures (Senelec, Woyofal, Rapido, etc.).
- **Coffres-forts & Épargne sécurisée** : Verrouillage des fonds avec emojis Apple 3D, objectifs financiers et calcul d'intérêts.
- **Cartes virtuelles & Physiques** : Gestion des plafonds de dépenses, blocage/déblocage instantané, sécurité biométrique.
- **Simulateur de flux & Notifications** : Notification banner interactive, carillon audio, retours haptiques.
- **Sécurité bancaire** : Écran de verrouillage à code PIN (4 chiffres) avec déverrouillage biométrique (Face ID / Empreinte).
- **Export & Build mobile natif** : PWA installable et projet natif Android compilable en APK avec Capacitor.

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
