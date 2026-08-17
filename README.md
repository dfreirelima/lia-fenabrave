# Nexa View · Holmes

Monitor ao vivo (somente leitura) dos testes Fenabrave. É um **PWA** — abre no
navegador do celular e pode ser instalado na tela de início.

## Stack

| Camada     | Escolha                                       |
| ---------- | --------------------------------------------- |
| Build      | Vite 7 + React 19 + TypeScript 5.9            |
| Estilo     | Tailwind CSS v4 (tokens CSS-first em `@theme`) |
| Animação   | Motion (spring physics, layout animations)     |
| Dados      | TanStack Query v5 + cliente PostgREST próprio  |
| Estado     | Zustand                                        |
| PWA        | vite-plugin-pwa (Workbox)                      |

Não usa `@supabase/supabase-js`: o app só faz quatro `GET` em views, então
`src/lib/rest.ts` fala PostgREST direto e economiza ~250 KB no bundle.

## Rodando

```bash
npm install
cp .env.example .env    # preencha as três variáveis
npm run dev             # http://localhost:5173
```

Scripts: `dev`, `build`, `preview`, `typecheck`.

## Telas

1. **Início** — KPIs ao vivo, histograma de execuções, gauges, split de domínio, ticker
2. **Conversas** — busca, filtros e inbox
3. **Operações** — saúde das execuções com filtros combinados
4. **Equipe** — pódio + classificação (Lia reportada à parte)
5. **/conversa/:id** — thread de leitura estilo mensageiro

O botão central da barra inferior é o **interruptor do polling** — pausa e
retoma todas as consultas.

## Dados

Somente `SELECT` nestas views do projeto LIA_Prod:

- `fenabrave_monitor_kpis`
- `fenabrave_monitor_executions`
- `fenabrave_monitor_conversations`
- `fenabrave_monitor_messages`

Polling de 2,5–4 s por view, **pausado automaticamente** quando a aba está em
segundo plano. Tokens, modelos e payloads não são expostos.

## Deploy (Vercel)

O build precisa destas variáveis (entram no bundle, use apenas a chave `anon`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MONITOR_PIN`

```bash
npx vercel --prod
# ou
./scripts/deploy-vercel.sh
```

PIN padrão de abertura: `2580`.
