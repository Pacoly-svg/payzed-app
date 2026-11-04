# Audit Payzed

## Version 1.10.0 — version iPhone

- **Plateforme iOS** ajoutée (Capacitor 8, Swift Package Manager) : même code et mêmes écrans qu'Android.
- **Compilation** sur un Mac de GitHub à chaque envoi : `Payzed-v1.10.0-iOS.ipa` publié sur la même page que l'APK.
  Fichier non signé : installation avec Sideloadly (voir `docs/IOS.md`) ; TestFlight / App Store nécessitent un
  compte Apple Developer.
- **Adaptations iPhone** : plein écran avec encoche et barre d'accueil respectées, pas de zoom automatique sur les
  champs, pas de rebond de la page, clavier qui réduit la fenêtre (plugin clavier embarqué **uniquement** sur iPhone,
  Android inchangé), Face ID à la place de l'empreinte, mode clair forcé, portrait, icône et écran de lancement
  Payzed (symbole blanc sur noir).
- **Permissions iPhone** : appareil photo (scanner un QR), enregistrement des reçus dans Photos, lien `payzed://`.
- **Notifications** : la création du canal (Android uniquement) n'est plus appelée sur iPhone, où elle aurait
  empêché toute notification ; bannière et son aussi quand l'app est ouverte.
- Tests : toutes les suites repassent (Android inchangé) ; vérification iPhone émulé (plein écran, Face ID, Réglages).
  À valider sur un vrai iPhone.

---

## Version 1.9.0

### Réglages (engrenage en haut à gauche)
L'en-tête devient : engrenage · logo Payzed · scanner. L'engrenage ouvre **Réglages** :
- **Comptes** : compte actif (nom, numéro, type, badge Gratuit / PRO), autres comptes de l'appareil, **Ajouter un autre
  compte** (personnel ou professionnel, nom + numéro sénégalais vérifié, numéro déjà utilisé refusé). Chaque compte a son
  propre solde, sa carte (nouveau numéro Visa valide), son historique, ses coffres et abonnements. La bascule range les
  données du compte actif, installe celles de l'autre et rouvre l'app déjà déverrouillée. Un compte inactif peut être
  retiré de l'appareil. Le code PIN, SIM et les préférences restent communs à l'appareil.
- **Amis** : *Inviter un ami* (partage direct d'un message avec le lien de téléchargement) et *Parrainer un ami*
  (code personnel, copie d'un geste, fonctionnement en 3 étapes, compteurs).
- **Vos appareils** : modèle et version d'Android (plugin `@capacitor/device`), date de première connexion, mode de
  déverrouillage, version de Payzed, état des notifications avec bouton « Activer ».
- **Plan** : Gratuit (2 comptes) ou Pro à 2 500 FCFA / mois (jusqu'à 5 comptes, service client prioritaire, badge PRO).
  Le passage à Pro passe par un récapitulatif, débite le solde (opération « Payzed Pro ») et envoie la notification.
  Retour au plan Gratuit possible à tout moment.
- **Service client** : appel et WhatsApp, foire aux questions (frais, retrait agent, échec, carte perdue, code PIN,
  historique). Ligne prioritaire affichée pour les comptes Pro.
- **Se déconnecter** : confirmation puis écran du code PIN (les données restent sur l'appareil). La ligne
  « Verrouiller l'application » du Profil, qui faisait la même chose, est retirée.

Coordonnées et offres réglables en un seul endroit : `src/data/company.ts` (numéro du service client, lien
d'invitation, prime de parrainage, prix Pro, nombre de comptes).

### Logos
Café de Rome (symbole du Colisée), Cinéma Pathé et Yum Yum intégrés depuis les fichiers fournis : tous les
commerçants de SIM ont maintenant leur logo.

### Tests
Réglages 47/47 (nouveau), simulations 31/31, navigation et formulaires 21/21, retrait / reçu / logos / QR 13/13,
clavier 100/100, responsive sans débordement.

---

## Version 1.8.0

### SIM (simulations de démonstration)
- **Opérations programmées invisibles jusqu'à leur arrivée :** une entrée ou un envoi programmé n'apparaît ni dans
  l'historique, ni dans les statistiques, et ne touche pas au solde tant que l'heure d'arrivée n'est pas atteinte.
  Il n'est visible que dans « Programmées » (écran Simulations), où il peut être annulé (supprimé sans trace).
  À l'arrivée : il prend la date et l'heure d'arrivée, le solde est mis à jour une seule fois, la notification part.
  Rattrapage au redémarrage si l'app était fermée.
- **Nouveaux types :** Entrée, Dépôt, Envoi, Retrait, Achat. Achats chez Yum Yum, Auchan, Cinéma Pathé, Café de Rome,
  Apple et Nvidia (« Auchan · Paiement par carte » dans l'historique).
- **Frais 1 %** appliqués aux envois, achats et retraits simulés (comme les opérations réelles) ; dépôts et entrées sans frais.
  Le récapitulatif montant + frais + total s'affiche avant de lancer.

### Notifications système (comme un SMS)
- Plugin `@capacitor/local-notifications` : canal « Opérations Payzed » en importance maximale, avec le **son de
  notification du téléphone**, la vibration et l'affichage sur l'écran verrouillé. Petite icône Payzed blanche
  (`ic_stat_payzed`). Autorisation demandée au premier déverrouillage (Android 13 et plus).
- Une notification pour chaque opération : envoi, réception, dépôt, retrait, achat, facture, recharge, abonnement,
  échec. Les opérations SIM programmées sont planifiées à l'avance par Android : elles arrivent même app fermée.
  Pour une heure exacte à la seconde, autoriser « Alarmes et rappels » (raccourci proposé dans Simulations) ;
  sinon Android peut décaler de quelques minutes.
- **Textes** (`src/utils/messages.ts`) : titre court qui dit ce qui s'est passé (« Argent reçu », « Envoi effectué »,
  « Paiement accepté », « Retrait effectué », « Opération échouée »…), puis montant, contrepartie, canal, frais et
  nouveau solde ; la référence est ajoutée dans le détail.

### Historique
- **Œil** dans l'en-tête de l'historique : masque tout l'historique d'un geste (mémorisé), « Afficher » pour le revoir.
- **Choisir** : sélection manuelle d'opérations à masquer ; filtre « Masqués (n) » pour les retrouver et les réafficher.
- Libellés revus : « Reçu · Wave », « Envoyé · Orange Money », « Dépôt · … », « Retrait chez un agent »,
  « Paiement par carte », « Facture », « Crédit téléphonique », « Abonnement ».
- **Identité noir et blanc :** plus de vert pour l'argent reçu (montants en noir, signe + ou −). Le rouge est réservé
  aux opérations échouées (badge « Échoué » et montant barré).

### Logos
Ria (carré orange), Bank of Africa et Société Générale intégrés depuis les fichiers fournis ; commerçants Auchan,
Apple et Nvidia (Simple Icons). Yum Yum, Cinéma Pathé et Café de Rome : repère neutre en attendant les logos officiels.

### Tests
Simulations 31/31, navigation et formulaires 21/21, retrait / reçu / logos / QR 13/13, clavier 100/100,
responsive sans débordement. Notifications système et son : à vérifier sur téléphone (non testables sans appareil).

---

## Version 1.7.0

### Saisie : le texte n'apparaissait qu'après la fermeture du clavier
- **Cause identifiée :** le plugin `@capacitor/keyboard` (ajouté en 1.5) enregistre un rappel d'animation des insets
  sur la vue racine en mode `DISPATCH_MODE_STOP` : les animations du clavier ne sont plus transmises aux vues enfants,
  dont la WebView, qui ne se redessine plus pendant que le clavier est ouvert. En parallèle, la gestion « bord à bord »
  de `SystemBars` (`insetsHandling: css` + `viewport-fit=cover`) ajoutait un second décalage de la fenêtre.
- **Correction :** suppression du plugin clavier ; `SystemBars.insetsHandling = 'disable'` pour revenir au
  redimensionnement Android standard (`adjustResize`), sans mode bord à bord ; `viewport` en `interactive-widget=resizes-content` ;
  animations des fenêtres en `fill-mode: backwards` (aucune transformation CSS ne reste appliquée après l'ouverture) ;
  script clavier allégé (plus aucun défilement ni écriture DOM pendant la frappe).
- À confirmer sur téléphone (non vérifiable sans appareil Android) : le panneau de diagnostic (5 touches sur la version)
  reste disponible.

### Interface
- **Paiement** remplace « Factures » et « Tous les services » : un seul point d'entrée pour factures, banques, Mobile Money,
  transferts, TV et abonnements (par service ou par opérateur, avec recherche).
- En-tête : photo de profil retirée (le Profil est dans la barre du bas).
- Profil : la bascule s'appelle **SIM** (sans sous-titre) ; l'écran ouvert s'appelle **Simulations**.
- Épargne : total présenté comme le solde de l'accueil, avec l'œil afficher/masquer ; mention « N coffres » retirée.
- Carte : recto et verso fidèles à une vraie carte (puce, sans contact, numéro en relief, VALID THRU, titulaire, Visa ;
  bande magnétique, panneau de signature, CVV, hologramme irisé animé, mentions). Toucher = retourner ; œil = afficher/masquer.
  Le Retour Android masque d'abord les infos puis remet le recto.
- Plafond : montant encore disponible mis en avant, dépensé / plafond, date de remise à zéro, réglage par curseur ou saisie.

### Logos
Intégrés depuis les fichiers fournis : Orange Money, Wizall, Canal+, StarTimes, UBA (voir `docs/LOGOS.md`).
Ria, Bank of Africa et Société Générale : envoyés pendant le travail mais non reçus comme fichiers.

---


## Version 1.6.0 — audit global, corrections et optimisation

### Priorité 1 — Corrections bloquantes

**Bouton / geste Retour Android qui fermait l'app**
- *Cause :* Capacitor transmet le Retour à l'historique du navigateur intégré ; or l'app n'a qu'une seule page
  (onglets et fenêtres sont des états React). Sans historique, Android fermait l'application.
- *Correction (à la source) :* pile de retour unique `src/utils/backStack.ts`, branchée sur le plugin `@capacitor/app`
  (`backButton`) et sur la touche Échap. Chaque élément refermable s'y inscrit avec une priorité :
  verrouillage > notification > fenêtres / sous-écrans > écran principal.
  Ordre obtenu : confirmation ouverte → sous-écran (ex. fiche d'un coffre) → fenêtre → onglet → Accueil →
  « Appuyez encore sur Retour pour quitter » → mise en arrière-plan (jamais de fermeture brutale).
  Sur l'écran de verrouillage, Retour met l'app en arrière-plan sans jamais contourner le code.
  La flèche « ← » de l'interface et le geste Android passent par le même mécanisme.
- *Abandon d'une opération :* toute fenêtre contenant une saisie demande « Abandonner l'opération ? » ; les valeurs
  sont conservées si l'on continue.
- *Liens profonds :* `payzed://pay?name=…&tel=…` (intent Android déclaré). Le QR « Recevoir » encode désormais ce lien :
  scanné avec l'appareil photo du téléphone, il ouvre Payzed sur le paiement, **après** déverrouillage par code PIN.

**Clavier et saisie** (corrigé en 1.5, étendu en 1.6) — plugin natif `@capacitor/keyboard` + `src/utils/keyboard.ts` ;
nouveaux champs (retrait, durée SIM, PIN du mode test) couverts ; touches « Suivant / OK » du clavier (`enterKeyHint`),
pavé numérique pour les montants, clavier téléphone pour les numéros. Les valeurs saisies sont conservées entre les
étapes.

### Priorité 2 — Fiabilité fonctionnelle

**Formulaires financiers** (Envoyer, Retirer, Crédit, Factures, Paiement QR)
- Étape **« Vérifier »** systématique avant exécution (bénéficiaire, moyen, montant, frais, total débité).
- **Anti double soumission :** le bouton « Confirmer » se verrouille au premier appui (état « Traitement… ») ;
  test : 3 appuis rapides = 1 seul débit.
- **Validations :** numéro sénégalais (9 chiffres, 70–78, avec ou sans +221), RIB/IBAN, e-mail ou numéro international,
  nom, montant > 0 et ≤ solde frais compris. Messages d'erreur sous le champ concerné.
- Messages de succès affichés uniquement après l'enregistrement effectif de l'opération.

**Nouveau parcours Retrait** — vers un portefeuille Mobile Money, ou chez un agent avec **code de retrait** à 6 chiffres
(valable 24 h, visible dans le détail et le reçu).

**Simulation SIM (mode test)** — `src/context/DemoContext.tsx`
- Durée libre en **secondes, minutes, heures ou jours** ; résultat choisi : réussie ou échouée.
- Statuts : **En attente → En cours de traitement → Réussie / Échouée**, ou **Annulée** à tout moment.
- Chaque opération porte un échéancier persisté (`createdAt`, `processingAt`, `resolveAt`, `outcome`, `settled`, `held`).
  Le statut est **recalculé à partir de ces horodatages** au démarrage, au retour au premier plan et chaque seconde :
  rien n'est perdu si l'app est fermée ou redémarrée, et un résultat n'est **jamais appliqué deux fois**.
- Effets sur le solde : sortie/retrait débités (montant + frais) dès la création et **remboursés** si échec/annulation ;
  entrée créditée **uniquement** si elle réussit.
- Séparation : toutes les opérations SIM sont marquées « simulées » ; **« Effacer toutes les opérations SIM »** les
  supprime et annule exactement leurs effets sur le solde.
- Accès : menu SIM visible seulement en **mode test**, activé dans Profil avec le **code PIN**.
- Limite connue : quand l'app est complètement fermée, aucune notification système n'est émise ; le statut est mis à
  jour et notifié à la réouverture.

### Priorité 3 — Opérateurs, services et logos
- Catalogue restructuré (`src/data/catalog.ts`) : **opérateurs** (identité, logo, provenance) distincts des **services**
  (catégorie, parcours). Ex. Orange → Orange Money, crédit Orange, Orange Fibre ; Senelec → facture Senelec, Woyofal.
  30 opérateurs (dont Payzed), 34 services, 12 catégories regroupées en 4 familles (Envoyer & recevoir, Recharger, Payer une facture,
  Abonnements).
- Inventaire complet et provenance de chaque logo : **`docs/LOGOS.md`**. Visuels non officiels retirés (monogrammes de
  couleur, logo Société Générale redessiné) → repère neutre signalé « logo à fournir » (7 marques).
- Composant de normalisation unique `BrandLogo` : même carré partout, marges constantes, aucune déformation,
  liseré pour fonds clairs et sombres. Test : 27/27 logos chargés, tous strictement de la même taille.

### Priorité 4 — Expérience utilisateur
- **Par action** (accueil) : Envoyer, Recevoir, Retirer, Crédit, Factures, Épargne.
- **Par opérateur** : « Tous les services » → onglets *Par service* / *Par opérateur*, recherche (nom, alias, opérateur,
  catégorie) ; la fiche d'un opérateur liste tous ses services (un portefeuille propose aussi « Retirer vers … »).
- Statuts visibles dans l'historique (badge texte + couleur), détail avec échéance et bouton « Annuler l'opération ».
- Reçu : la coche « réussi » n'apparaît que si l'opération a réellement réussi.

### Priorité 5 — Nettoyage, performances, sécurité
- **Code PIN haché** (SHA-256) : plus jamais stocké en clair ; migration automatique de l'ancien stockage.
- Journaux : seul un message technique est consigné en cas d'erreur d'affichage, jamais de données de compte.
- Code mort supprimé (vérifié par recherche des usages) : `convertCurrency`, `totalWithFee`, `isFinalFailure`,
  état d'onboarding inutilisé, carte des emojis étendue ; 14 images d'emojis jamais affichables, 10 logos sources et une
  licence sortis de l'APK (images embarquées : 1,1 Mo → 0,46 Mo).
- Correction d'une dépendance manquante de hook (`lockApp`).

### Priorité 6 — Tests exécutés (Chromium, émulation Galaxy, `tests/e2e/`)
| Suite | Résultat |
|---|---|
| `clavier.cjs` — tous les champs, clavier qui réduit l'écran ou le recouvre, 360 et 412 px | **100/100** champs visibles |
| `navigation-formulaires.cjs` — Retour, confirmations, validation, double appui | **19/19** |
| `simulation-sim.cjs` — statuts en direct, échec + remboursement, redémarrage, rattrapage, annulation, purge, PIN | **20/20** |
| `retrait-recu-logos-qr.cjs` — retrait agent, reçu PNG, logos, recherche, scan QR (caméra simulée) | **13/13** |
| `responsive.cjs` — 320 / 360 / 393 / 412 / 480 px | aucun débordement |
| Compilation TypeScript + build Vite + lint oxlint | OK (avertissements de style uniquement) |

**Non vérifiable ici :** aucun appareil ni émulateur Android n'est disponible dans l'environnement de développement.
Le comportement natif (bouton Retour physique, plugin clavier, partage, liens profonds, caméra réelle) a été implémenté
avec les API officielles Capacitor 8 et vérifié par lecture de leur code source, mais doit être confirmé sur téléphone.
L'orientation est verrouillée en portrait (pas de test paysage).

### Points restant à traiter
- Fournir les logos officiels manquants (liste dans `docs/LOGOS.md`).
- Clé de signature « release » privée avant toute publication sur le Play Store.
- Notifications système pour les opérations SIM arrivant à échéance app fermée (plugin de notifications locales).

---

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
