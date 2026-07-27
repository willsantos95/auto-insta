# Instagram Auto — EasyPanel

Aplicação própria para transformar comentários, respostas de story e DMs com palavra-chave em mensagens automáticas, sem disparo para base fria.

## Arquitetura

- `web`: Next.js 16, painel, OAuth e webhook.
- `worker`: mesmo Docker image, comando separado `npm run worker`.
- `postgres`: serviço PostgreSQL do EasyPanel.
- Fila atômica com `FOR UPDATE SKIP LOCKED`.
- Token do Instagram criptografado com AES-256-GCM.
- Limite conservador de 2 envios/segundo e 200 mensagens/hora.

## Serviços no EasyPanel

### 1. PostgreSQL

Crie banco, usuário e senha. Use a URL interna no `DATABASE_URL`.

### 2. Web

- Origem: repositório GitHub.
- Build: Dockerfile.
- Porta de proxy: `3000`.
- Domínio: `n8n-insta-auto.fgxtfw.easypanel.host`.
- Comando padrão do Dockerfile: `npm run start`.

### 3. Worker

Crie outro App Service usando o mesmo repositório e as mesmas variáveis.

- Sem domínio.
- Réplicas: **1**.
- Command: `./node_modules/.bin/tsx`
- Arguments: `src/worker.ts`

### 4. Migração

No console do serviço Web, execute uma vez:

```bash
./node_modules/.bin/tsx scripts/migrate.ts
```

## Variáveis

Copie `.env.example`. Gere segredos fortes:

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
openssl rand -base64 32
```

O último valor é usado em `TOKEN_ENCRYPTION_KEY`.

## URLs da Meta

- OAuth callback: `https://n8n-insta-auto.fgxtfw.easypanel.host/api/oauth/callback`
- Webhook: `https://n8n-insta-auto.fgxtfw.easypanel.host/api/webhook`
- Política: `https://n8n-insta-auto.fgxtfw.easypanel.host/privacidade`
- Exclusão: `https://n8n-insta-auto.fgxtfw.easypanel.host/exclusao-de-dados`

## Renovação semanal do token

Como existe um worker contínuo, o envio não depende de cron. Para a renovação semanal, crie um cron no EasyPanel que faça:

```bash
curl -X POST \
  -H "Authorization: Bearer SEU_INTERNAL_API_SECRET" \
  https://n8n-insta-auto.fgxtfw.easypanel.host/api/internal/refresh-token
```

## Limites reais

- Não verifica se a pessoa segue o perfil.
- Não detecta clique no link.
- Não envia mensagem em massa para base fria.
- Follow-ups são pulados automaticamente quando a janela de 24 horas termina.
- Resposta privada a comentário possui chave de deduplicação por comentário e automação.
