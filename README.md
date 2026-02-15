# BI Zap Dashboard (React + Vite)

Painel interno para acompanhar grupos com login simples, métricas e IA.

## Funcionalidades entregues

- Login hardcoded (`123 / 123`).
- Seleção de grupo no topo e troca de dashboard.
- Cards com:
  - mais engajado por dia/semana/mês;
  - tempo ocioso do grupo.
- Visual de ranking de engajamento (gráfico de barras simples).
- Feed de mensagens em tempo real via Supabase Realtime.
- Favoritar mensagens.
- Resumo diário com IA (OpenAI `gpt-4o-mini`).
- Campo de resposta rápida com botão para melhorar texto com IA.

## Estrutura esperada no Supabase

### `groups`

- `id` (text/uuid)
- `name` (text)

### `messages`

- `id` (text/uuid)
- `group_id` (fk -> groups.id)
- `sender` (text)
- `text` (text)
- `created_at` (timestamp)
- `is_favorite` (boolean)

## Rodar local

```bash
cp .env.example .env
npm install
npm run dev
```

Acesse: `http://localhost:5173`
