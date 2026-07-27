# Guia rápido — GitHub e EasyPanel

## 1. Subir para o GitHub

Extraia o ZIP. No repositório `willsantos95/insta-auto`, envie **todos os arquivos que estão dentro da pasta** `insta-auto-github-ready` para a raiz do repositório.

O repositório deve mostrar na raiz, entre outros:

- `Dockerfile`
- `package.json`
- `next.config.ts`
- `src/`
- `migrations/`
- `.env.example`

Não envie um arquivo `.env` e não coloque chaves secretas no GitHub.

## 2. EasyPanel — serviço Web

- Repositório: `willsantos95/insta-auto`
- Ramo: use o ramo real do GitHub, normalmente `main`
- Caminho de build: `./`
- Construtor: `Dockerfile`
- Porta: `3000`
- Domínio: `n8n-insta-auto.fgxtfw.easypanel.host`

## 3. EasyPanel — variáveis do Web

Copie as chaves de `.env.example` e preencha os valores no EasyPanel. Não use a chave secreta antiga que apareceu na conversa; use apenas a nova chave redefinida na Meta.

## 4. Banco

Depois do primeiro deploy, abra o terminal do serviço Web e execute:

```bash
npm run db:migrate
```

## 5. Worker

Crie um segundo App Service usando o mesmo repositório, sem domínio e com apenas uma réplica.

Use as mesmas variáveis do Web. Sobrescreva o comando para:

```bash
npm run worker
```

## 6. URLs da Meta

- OAuth: `https://n8n-insta-auto.fgxtfw.easypanel.host/api/oauth/callback`
- Webhook: `https://n8n-insta-auto.fgxtfw.easypanel.host/api/webhook`
- Privacidade: `https://n8n-insta-auto.fgxtfw.easypanel.host/privacidade`
- Exclusão: `https://n8n-insta-auto.fgxtfw.easypanel.host/exclusao-de-dados`
