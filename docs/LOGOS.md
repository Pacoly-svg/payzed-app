# Inventaire des logos — Payzed 1.6.0

Source de vérité : `src/data/catalog.ts` (opérateurs → logo, services → opérateur).
Affichage : composant unique `src/components/common/BrandLogo.tsx` (normalisation automatique).

## Règles appliquées
- **Uniquement des fichiers de provenance connue** : fichiers officiels fournis dans le projet d'origine, ou bibliothèque
  [Simple Icons](https://simpleicons.org) v16.36.0 (tracés CC0 — les marques restent la propriété de leurs titulaires et
  leurs chartes d'usage s'appliquent). Licence copiée dans `design/logos-source/SIMPLE-ICONS-LICENSE.md`.
- **Aucun logo inventé, redessiné ou généré** : quand aucun fichier officiel n'est disponible, l'app affiche un **repère
  neutre** (initiales grises sur fond gris clair), qui ne prétend pas être le logo de la marque.
- **Normalisation** : carré identique pour toutes les marques, coins arrondis, liseré discret (lisible sur fond clair et
  sombre). Logos « pleins » (fond de marque) : remplissent la case. Logos horizontaux ou transparents : centrés avec une
  marge fixe de 14 %, sans déformation (`object-contain`). Les logos horizontaux trop fins (CBAO, DGID, Sen'Eau, Eiffage)
  ont été remplacés par leur **symbole officiel**, isolé (recadré, jamais redessiné) depuis le fichier d'origine, afin
  d'avoir un poids visuel comparable aux autres.
- Les fichiers d'origine non affichés tels quels sont conservés hors de l'APK dans `design/logos-source/`.

## Opérateurs et état des logos

| Opérateur | Services dans l'app | Fichier affiché | Provenance | État |
|---|---|---|---|---|
| Payzed | Envoi Payzed, retrait agent | `assets/logo/symbole-blanc.svg` | Marque Payzed | ✅ |
| Wave | Wave (Mobile Money) | `logos/tiles/wave.png` | Projet (`design/logos-source/wave.png`) | ✅ |
| Orange | Orange Money, crédit Orange, Orange Fibre | `logos/orange.svg` | Projet | ⚠️ Orange Money a un logo propre : à fournir pour remplacer le logo Orange sur ce service |
| Yas (ex-Free) | Mixx by Yas, crédit Yas, Yas Box | `logos/yas.svg` (« Yasenegal2024 ») | Projet | ⚠️ Mixx by Yas a un logo propre : à fournir |
| Expresso | Crédit Expresso | `logos/tiles/expresso.png` | Projet (recadré) | ✅ |
| CBAO (Attijariwafa bank) | Virement CBAO | `logos/tiles/cbao.png` | Projet (symbole isolé) | ✅ |
| Ecobank | Virement Ecobank | `logos/tiles/ecobank.png` | Projet | ✅ |
| Senelec | Facture Senelec, Woyofal | `logos/tiles/senelec.png`, `logos/tiles/woyofal.png` | Projet (recadrés) | ✅ |
| Sen'Eau | Facture eau | `logos/tiles/seneau.png` | Projet (symbole isolé) | ✅ |
| SECAA (Eiffage) | Rapido (péage) | `logos/tiles/rapido.png` | Projet (symbole Eiffage isolé) | ⚠️ symbole de l'exploitant ; le badge Rapido a sa propre identité : logo Rapido à fournir |
| DGID | Impôts | `logos/tiles/dgid.png` | Projet (symbole isolé) | ✅ |
| AXA | Assurance | `logos/axa.svg` | Projet | ✅ |
| PayPal | Transfert international | `logos/paypal_icon.svg` | Projet | ✅ |
| Western Union | Transfert international | `logos/tiles/westernunion.svg` | Simple Icons (couleur officielle #FFDD00) | ✅ |
| MoneyGram | Transfert international | `logos/tiles/moneygram.svg` | Simple Icons (#DA291C) | ✅ |
| Netflix | Abonnement | `logos/netflix_icon.svg` | Projet | ✅ |
| Spotify | Abonnement | `logos/spotify.svg` | Projet | ✅ |
| YouTube | YouTube Premium | `logos/tiles/youtube.svg` | Simple Icons (#FF0000) | ✅ |
| Deezer | Abonnement | `logos/tiles/deezer.svg` | Simple Icons (#A238FF) | ✅ |
| Apple | Apple Music | `logos/tiles/applemusic.svg` | Simple Icons (#FA243C) | ✅ |
| OpenAI | ChatGPT | `logos/chatgpt_icon.svg` | Projet | ✅ |
| Anthropic | Claude | `logos/claude.svg` | Projet | ✅ |
| Google | Gemini | `logos/gemini.svg` | Projet | ✅ |
| Visa | Carte | `logos/visa-white.svg` | Simple Icons | ✅ |
| Wizall | Wizall Money | — | — | ❌ logo officiel à fournir (repère neutre « WM ») |
| Société Générale Sénégal | Virement | — | — | ❌ logo à fournir ; l'ancien visuel redessiné du projet a été retiré. Identité actuelle de la banque à vérifier |
| UBA | Virement | — | — | ❌ logo officiel à fournir |
| Bank of Africa | Virement | — | — | ❌ logo officiel à fournir |
| Ria | Transfert international | — | — | ❌ logo officiel à fournir |
| Canal+ | Abonnement TV | — | — | ❌ logo officiel à fournir |
| StarTimes | Abonnement TV | — | — | ❌ logo officiel à fournir |

**Pourquoi certains logos manquent :** les sites officiels et Wikimedia ne sont pas accessibles depuis l'environnement de
développement utilisé ; seuls les fichiers déjà présents dans le projet et la bibliothèque Simple Icons (installée via npm)
l'étaient. Pour compléter : déposer le fichier officiel (PNG ou SVG, idéalement carré) dans `public/logos/tiles/`, puis
renseigner `logo` et `source` de l'opérateur dans `src/data/catalog.ts`.

## Corrections effectuées
- **Logos « disparus »** : logos horizontaux affichés dans de petites cases → illisibles. Remplacés par des tuiles
  carrées (symbole officiel isolé). Services retirés lors d'une simplification précédente réintégrés via le catalogue.
- **Visuels non officiels retirés** : monogrammes colorés imitant des marques (UBA, BOA, Ria, Canal+, StarTimes, Wizall)
  et logo Société Générale redessiné → repère neutre.
- **Doublons / obsolètes** : 10 fichiers sources sortis de l'APK (`design/logos-source/`), 14 images d'emojis jamais
  affichables supprimées, licence déplacée hors de l'APK. Poids des images embarquées : 1,1 Mo → 0,46 Mo.
- **Chemins** : tous les chemins du catalogue sont vérifiés par le test automatisé (chargement de chaque image).
