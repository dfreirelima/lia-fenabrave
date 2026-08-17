#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

SCOPE="${VERCEL_SCOPE:-dfreirelima-4742s-projects}"
PROJECT="${VERCEL_PROJECT:-nexa-fenabrave}"
VERCEL_BIN="${VERCEL_BIN:-npx vercel}"

echo "==> Login / identidade"
$VERCEL_BIN whoami

echo "==> Link do projeto"
$VERCEL_BIN link --yes --scope "$SCOPE" --project "$PROJECT"

echo "==> Variáveis de build (EXPO_PUBLIC_* precisam existir no build)"
set -a
# shellcheck disable=SC1091
source .env
set +a

add_env() {
  local key="$1"
  local val="$2"
  printf '%s' "$val" | $VERCEL_BIN env add "$key" production --yes >/dev/null 2>&1 || true
  printf '%s' "$val" | $VERCEL_BIN env add "$key" preview --yes >/dev/null 2>&1 || true
}

add_env EXPO_PUBLIC_SUPABASE_URL "$EXPO_PUBLIC_SUPABASE_URL"
add_env EXPO_PUBLIC_SUPABASE_ANON_KEY "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
add_env EXPO_PUBLIC_MONITOR_PIN "$EXPO_PUBLIC_MONITOR_PIN"

echo "==> Deploy production"
$VERCEL_BIN deploy --prod --yes --scope "$SCOPE" \
  -b "EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL" \
  -b "EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -b "EXPO_PUBLIC_MONITOR_PIN=$EXPO_PUBLIC_MONITOR_PIN"
