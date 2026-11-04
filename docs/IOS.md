# Payzed sur iPhone

La même application (même code, mêmes écrans) est compilée pour iPhone avec Capacitor.
Chaque envoi sur GitHub produit, sur la page **Releases**, l'APK Android **et** le fichier iPhone
`Payzed-vX.Y.Z-iOS.ipa` (compilé sur un Mac de GitHub, gratuit car le dépôt est public).

## Installer sur un iPhone sans compte développeur (depuis Windows)

Le fichier `.ipa` n'est pas signé : Apple n'autorise l'installation qu'après signature avec un
identifiant Apple. L'outil gratuit **Sideloadly** s'en charge :

1. Sur le PC : installer **iTunes** et **iCloud** depuis le site d'Apple (pas les versions du
   Microsoft Store), puis **Sideloadly** (sideloadly.io).
2. Brancher l'iPhone en USB, le déverrouiller et toucher « Se fier à cet ordinateur ».
3. Ouvrir Sideloadly, glisser le fichier `Payzed-vX.Y.Z-iOS.ipa`, saisir son identifiant Apple, Start.
4. Sur l'iPhone (iOS 16 et plus) : Réglages › Confidentialité et sécurité › **Mode développeur** → activer,
   redémarrer.
5. Réglages › Général › VPN et gestion de l'appareil › votre identifiant Apple › **Faire confiance**.

Limites d'Apple pour un identifiant gratuit : l'app doit être réinstallée **tous les 7 jours**
(Sideloadly peut le faire automatiquement), 3 apps de ce type au maximum par iPhone.

## Pour TestFlight et l'App Store

Il faut un compte **Apple Developer Program** (99 USD par an). Ensuite : certificat de distribution
et clé API App Store Connect ajoutés aux secrets GitHub, et la compilation peut envoyer chaque version
sur TestFlight (lien d'installation pour les investisseurs, sans câble ni limite de 7 jours).

## Différences avec Android

| | Android | iPhone |
|---|---|---|
| Retour | bouton / geste Retour | flèche ← et croix des fenêtres |
| Déverrouillage rapide | Empreinte digitale | Face ID |
| Clavier | redimensionnement Android | plugin clavier (iPhone uniquement) |
| Notifications | canal « Opérations », alarmes exactes | autorisation iOS, son et bannière iOS |
| Écran | barre d'état noire sur blanc | plein écran, encoche et barre d'accueil respectées |

Fichiers propres à l'iPhone : `ios/` (projet Xcode), `capacitor.config.ts` (section `ios` et plugin
`Keyboard`), `src/utils/platform.ts`.
