# Audit Payzed

## Version 1.5.0

### Saisie au clavier — cause et correction
**Cause :** selon le téléphone (version d'Android, de la WebView et du clavier Samsung/Gboard), le clavier soit *réduit* la page, soit se *pose par-dessus*. L'app ne s'appuyait que sur des mesures du navigateur (`visualViewport`), peu fiables dans la WebView Android quand le clavier recouvre la page : le champ restait caché sous le clavier.

**Correction :**
- Plugin natif **@capacitor/keyboard** : Android donne la hauteur exacte du clavier.
- `src/utils/keyboard.ts` combine 3 signaux (plugin natif, taille de la WebView, visualViewport) et calcule la partie de l'écran réellement recouverte (`--kb`). L'app et les fenêtres remontent d'autant, la barre du bas se masque, le champ actif est recentré (et ramené à l'écran pendant la frappe).
- **Test automatisé** de tous les champs (Envoyer, Crédit, Factures, Services, Épargne, Abonnements, Plafond, Profil, Code PIN, SIM) avec clavier simulé dans les deux modes, sur 360 et 412 px : **88/88 champs visibles**. Contre-test sans la correction : 7/22 seulement.
- **Diagnostic caché** : toucher 5 fois « Payzed · version » dans Profil affiche les mesures du clavier (à envoyer en capture si un téléphone pose encore problème).

### Logos
**Cause :** la plupart des logos sont des logos *horizontaux* (CBAO, DGID, Sen'Eau, Eiffage/Rapido, Senelec…) affichés dans de petites cases carrées : ils devenaient minuscules, donc « invisibles ». Certains services avaient aussi été retirés des écrans lors de la simplification.

**Correction :** icônes carrées 160×160 générées à partir des fichiers officiels du projet (symbole isolé, proportions respectées) dans `public/logos/tiles/`. Nouveaux logos officiels depuis la bibliothèque Simple Icons (CC0) : Western Union, MoneyGram, YouTube, Deezer, Apple Music. Services sans logo officiel disponible hors-ligne : monogramme aux couleurs de la marque (Wizall, UBA, BOA, Ria, Canal+, StarTimes) — à remplacer en déposant le fichier officiel.

### Catalogue des opérateurs et services
`src/data/catalog.ts` — 12 catégories : Mobile Money, Banques, Transferts d'argent, Crédit & télécoms, Électricité, Eau, Internet, TV, Transport & péage, Impôts & taxes, Assurances, Abonnements (35 services).
- Nouvelle page **Services** (accueil) : recherche + filtres par catégorie ; toucher un service ouvre le bon parcours déjà présélectionné.
- Envoyer, Crédit, Factures (par catégorie), Abonnements et SIM lisent ce catalogue.
- **Ajouter un service** : une ligne dans `PROVIDERS` (+ logo dans `public/logos/tiles/`). **Ajouter une catégorie** : une ligne dans `CATEGORIES`.

### Carte
Vérifiée sans débordement à 320, 360, 393, 412 et 480 px (recto, verso, actions, fenêtres).


## Version 1.4.0

| Demande | Réalisation |
|---|---|
| Frais de 1 % | Appliqués aux envois, paiements QR, factures, crédit, paiement d'abonnement et sorties SIM. Affichés avant validation (frais + total débité), dans le détail et sur le reçu ; le solde débite montant + frais. Les Stats comptent les frais. |
| Menu « SIM » | Renommé. Retour du choix de la **date** de l'opération (passée), des **canaux personnalisés** (nom + logo depuis la galerie) et du **reçu**. |
| Reçu | « Voir le reçu » dans le détail de chaque opération : image PNG (logo, montant, statut, date, parties, moyen, frais, total, référence, QR de référence), partage natif Android (WhatsApp, galerie, e-mail…). |
| Carte | Refonte : carte qui se retourne pour afficher numéro / expiration / CVV (masqués automatiquement après 30 s), 4 actions (Infos, Bloquer, Plafond, Remplacer), dépenses du mois vs plafond, derniers paiements par carte, réglages (en ligne, sans contact, distributeur, étranger), remplacement en cas de perte ou vol (nouveau numéro Visa valide). |
| Formulaires | Le bouton de validation reste fixé en bas des fenêtres Envoyer, Crédit et Factures. |


## Version 1.3.0

| Demande | Réalisation |
|---|---|
| Simulations pour les présentations | Profil → **Simulations** : entrée ou sortie d'argent (Payzed, Wave, Orange Money, Mixx by Yas, PayPal, Ecobank), nom, numéro, montant, arrivée directe / 10 s / 30 s / 1 min avec compte à rebours annulable, notification animée avec son et vibration, réglage du solde. Le détail de chaque opération simulée indique « Opération simulée ». |
| QR code dans les deux sens | **Payer** : la caméra scanne le QR d'une autre personne puis on saisit le montant (bouton scan en haut de l'écran et dans « Envoyer »). **Recevoir** : mon QR code + Copier / Partager. |
| Saisie de texte | Mécanisme clavier de la 1.2 conservé (champ toujours visible au-dessus du clavier). |


## Version 1.2.0

| Retour | Correction |
|---|---|
| Heure, réseau et batterie invisibles (blanc sur blanc) | Le téléphone en mode sombre affichait les icônes système en blanc. Les icônes sont maintenant forcées en noir (`SystemBars.style = LIGHT`). |
| Impossible de voir ce qu'on tape | Le clavier recouvrait les champs. L'app et les fenêtres remontent au-dessus du clavier, le champ actif est recentré, la barre du bas se cache pendant la saisie. `adjustResize` activé côté Android. Champs forcés en texte noir même en mode sombre. |
| « Code par défaut : 1234 » visible | Ligne supprimée. Nouvel écran de verrouillage plus sobre. |
| Crédit : montants imposés | Numéro + montant libre uniquement. |
| Épargne mal faite | 3 vues claires : liste (total + progression), détail (ajouter / retirer, bloquer, supprimer), création (icône, nom, objectif). |
| Abonnements « cliché IA » | Plus de pastilles ni de points : liste simple, détail (payer, pause, supprimer), ajout. |
| Stats | Les anciens chiffres étaient inventés (multiplicateurs, pourcentages fixes). Tout est maintenant calculé sur les vraies opérations : 7 jours / 30 jours / 12 mois, graphique touchable, répartition réelle, plus grosses dépenses. |
| Carte | Carte épurée, 3 actions (Afficher, Copier, Bloquer), dépenses réelles du mois vs plafond, plafond modifiable (montant libre), réglages paiements en ligne / sans contact / distributeur. |
| Harmonisation | Une boîte à outils unique (`src/components/ui`) : mêmes tailles de texte, boutons, champs, listes et fenêtres partout. |
| Recevoir | Vrai QR code scannable + Copier / Partager (faux scanner caméra retiré). |

---

## Version 1.1.0 (stable)

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
