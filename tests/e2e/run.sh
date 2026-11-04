#!/usr/bin/env bash
# Lance toutes les vérifications de bout en bout sur la version compilée.
# Prérequis : Node 22, Playwright + Chromium (npx playwright install chromium),
# ffmpeg et ImageMagick pour le test de scan QR.
set -e
cd "$(dirname "$0")/../.."
npm run build
npx vite preview --port 4173 >/dev/null 2>&1 &
PREVIEW=$!
trap 'kill $PREVIEW' EXIT
sleep 2
OUT=$(mktemp -d)
for t in navigation-formulaires simulation-sim retrait-recu-logos-qr clavier responsive; do
  echo "== $t"
  node "tests/e2e/$t.cjs" "$OUT" | tail -2
done
