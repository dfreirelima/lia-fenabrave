# Fenabrave Monitor

App mobile (Expo) somente leitura para acompanhar testes Fenabrave em tempo real.

## Stack

- Expo SDK 54 + Expo Router
- NativeWind 4 + Reanimated
- Supabase (views `fenabrave_monitor_*` no projeto LIA_Prod)

## Setup

```bash
npm install
cp .env.example .env   # se necessário
npx expo start
```

PIN padrão de abertura: valor de `EXPO_PUBLIC_MONITOR_PIN` (padrão `2580`).

## Telas

1. **Pulse** — KPIs ao vivo, sparkline, split de domínio e ticker
2. **Conversas** — inbox + chat estilo WhatsApp (somente leitura)
3. **Operações** — feed de execuções com saúde LIA/Meta
4. **Equipe** — ranking de operadores (Lia fora do ranking humano)

## Dados

O app só faz `SELECT` nas views:

- `fenabrave_monitor_kpis`
- `fenabrave_monitor_executions`
- `fenabrave_monitor_conversations`
- `fenabrave_monitor_messages`

Polling a cada 2s (pausa em background). Tokens, modelos e payloads **não** são expostos.

## Publicar na Vercel (evento)

O app web precisa de URL pública. Faça login e publique:

```bash
npx vercel login --github
npx vercel --prod --yes --scope dfreirelima-4742s-projects
```

Ou:

```bash
chmod +x scripts/deploy-vercel.sh
./scripts/deploy-vercel.sh
```

No build, a Vercel precisa destas variáveis (`EXPO_PUBLIC_*` entram no bundle):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MONITOR_PIN`

PIN de abertura no celular: `2580`.
