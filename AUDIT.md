# Audit Payzed — version 1.1.0 (stable)

## 1. Bugs bloquants corrigés

| Problème | Cause | Correction |
|---|---|---|
| **Impossible de scroller sur Samsung (APK)** | La page entière défilait avec un « faux téléphone » (mode mockup) activé par défaut, `overflow-x: hidden` sur `body`, et des listes qui interceptaient les gestes tactiles. Sur la WebView Android, le scroll se bloquait. | Nouvelle structure : la page ne défile plus, **un seul** conteneur défile (`.app-scroll`). Le mode mockup est supprimé. |
| **Clics qui ne répondent pas** | La barre du bas était `fixed` par-dessus le contenu, dans un calque invisible. Les lignes de l'historique avaient un « swipe » qui capturait le doigt pendant le scroll. Délai de 300 ms au tap. | Barre du bas dans le flux normal (plus rien par-dessus les boutons). Swipe supprimé. `touch-action: manipulation` sur tous les boutons. |
| **Icône d'app invisible** | « P » noir sur fond noir (adaptive icon). | Nouvelle icône : forme noire + picto blanc, toutes tailles Android + favicon + écran de démarrage noir avec logo blanc. |
| **Fabrication automatique de l'APK en échec** | Node 20 alors que Capacitor 8 exige Node 22 ; Java 17 au lieu de 21. | Workflow corrigé : Node 22, Java 21, APK publié sur la page *Releases*. |
| **Mises à jour impossibles sans désinstaller** | Chaque APK était signé avec une clé différente. | Clé de signature fixe dans le projet → les mises à jour s'installent par-dessus. |
| **Solde faux après dépôt/retrait dans un coffre** | Le montant était débité/crédité **deux fois**. | Une seule écriture par opération. |
| **Écran blanc si données corrompues** | `JSON.parse` sans protection au démarrage. | Lecture sécurisée + écran « Redémarrer » si un écran plante (ErrorBoundary). |
| **Archivage involontaire** | Un scroll un peu en diagonale sur l'historique archivait l'opération. | Swipe supprimé ; archivage via le détail de l'opération. |
| Réinitialisation incomplète | Les coffres et le code PIN n'étaient pas remis à zéro. | Tout est réinitialisé (avec confirmation). |

## 2. Ce qui a été enlevé (trop d'options, poids inutile)

- Simulateur de virements/notifications, modification manuelle du solde, canaux personnalisés : écran Paramètres réduit de 1 120 à ~230 lignes.
- Reçu « certifié » imprimable, faux boutons « Partager »/« Répéter » qui ne faisaient rien.
- Sélecteur pays/devise (conversions approximatives) → l'app reste en FCFA.
- Mode « smartphone mockup », bouton verrou dans l'en-tête, fausses notifications de la cloche.
- Écran d'onboarding jamais affiché, 7 composants morts, ~30 images inutilisées (variantes Rapido, stickers…).
- Librairies `canvas-confetti`, `clsx`, `tailwind-merge` ; police Google Fonts (l'app fonctionne hors-ligne avec la police système).

**Poids :** code principal 467 Ko → 248 Ko (‑47 %), les écrans secondaires se chargent à la demande.

## 3. Expérience simplifiée

- **Accueil** : solde + 2 boutons (*Envoyer*, *Recevoir*) + 4 raccourcis (*Crédit*, *Factures*, *Épargne*, *Abos*) + historique.
- **Navigation** : Accueil · Stats · Carte · Profil.
- **Toutes les fenêtres** s'ouvrent du bas de l'écran (atteignables au pouce), même style partout.
- **Envoyer** : choisir un contact → montant → *Envoyer*. (avant : 7 champs)
- **Profil** : nom, téléphone, photo, empreinte, code PIN, verrouiller, réinitialiser.
- Profil par défaut : **COLY SENE — +221 78 302 35 14**.

## 4. Points restants à savoir

- L'app est une **démo** : les données sont stockées sur le téléphone, aucun vrai paiement n'est effectué.
- L'empreinte est simulée (pas encore branchée au vrai capteur Android).
- Le code PIN par défaut est **1234** (à changer dans Profil).
- Pour publier sur le Play Store, il faudra une clé de signature « release » privée (ne pas utiliser celle du projet).
