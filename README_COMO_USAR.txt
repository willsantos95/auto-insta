🚀 SUPORTE A MÚLTIPLAS CONTAS INSTAGRAM - COMO USAR

═══════════════════════════════════════════════════════════════

📦 CONTEÚDO DO ZIP
───────────────────────────────────────────────────────────────

5 arquivos organizados em pastas:

migrations/
  └── 002_multi_account_support.sql

src/lib/
  └── config.ts

src/app/api/oauth/
  └── callback/route.ts

src/components/
  ├── AccountSelector.tsx
  └── AccountsManager.tsx

═══════════════════════════════════════════════════════════════

🎯 INSTRUÇÕES DE UPLOAD
───────────────────────────────────────────────────────────────

1️⃣ EXTRAIA O ZIP
   unzip auto-insta-multi-account.zip

2️⃣ ABRA SEU REPOSITÓRIO NO GITHUB
   https://github.com/willsantos95/auto-insta
   Branch: claude/manychat-ui-ux-design-w9f9xe

3️⃣ FAÇA UPLOAD DE CADA ARQUIVO

   📍 ARQUIVO 1: migrations/002_multi_account_support.sql
      • Clique em "Add file" → "Create new file"
      • Caminho: migrations/002_multi_account_support.sql
      • Cole o conteúdo do arquivo
      • Commit

   📍 ARQUIVO 2: src/lib/config.ts
      • Clique em "Edit" (já existe)
      • Ou "Add file" se não existir
      • Caminho: src/lib/config.ts
      • Cole o conteúdo COMPLETO (substitui tudo)
      • Commit

   📍 ARQUIVO 3: src/app/api/oauth/callback/route.ts
      • Clique em "Edit" (já existe)
      • Caminho: src/app/api/oauth/callback/route.ts
      • Cole o conteúdo COMPLETO (substitui tudo)
      • Commit

   📍 ARQUIVO 4: src/components/AccountSelector.tsx
      • Clique em "Add file" → "Create new file"
      • Caminho: src/components/AccountSelector.tsx
      • Cole o conteúdo
      • Commit

   📍 ARQUIVO 5: src/components/AccountsManager.tsx
      • Clique em "Add file" → "Create new file"
      • Caminho: src/components/AccountsManager.tsx
      • Cole o conteúdo
      • Commit

4️⃣ CRIE UM PULL REQUEST
   • Após todos os uploads, vá para "Pull requests"
   • Abra um novo PR da sua branch
   • Título: "feat: Add multi-account Instagram support"
   • Pronto! 🎉

═══════════════════════════════════════════════════════════════

📝 O QUE CADA ARQUIVO FAZ
───────────────────────────────────────────────────────────────

✅ migrations/002_multi_account_support.sql
   - Cria tabela instagram_accounts
   - Adiciona campo account_id em automations
   - AÇÃO: Execute no seu banco de dados

✅ src/lib/config.ts (MODIFICADO)
   - Novas funções: listInstagramAccounts(), getAccountWithToken()
   - Função saveInstagramAccount() para múltiplas contas
   - AÇÃO: Substitui o arquivo antigo completamente

✅ src/app/api/oauth/callback/route.ts (MODIFICADO)
   - Atualizado para salvar em ambas as tabelas
   - Detecta reconexão automática
   - AÇÃO: Substitui o arquivo antigo completamente

✅ src/components/AccountSelector.tsx (NOVO)
   - Componente UI para selecionar conta ao criar automação
   - AÇÃO: Copia para pasta src/components/

✅ src/components/AccountsManager.tsx (NOVO)
   - Componente UI para gerenciar contas conectadas
   - AÇÃO: Copia para pasta src/components/

═══════════════════════════════════════════════════════════════

⏱️ TEMPO ESTIMADO
───────────────────────────────────────────────────────────────

Upload:  10-15 minutos (1-2 min por arquivo)
PR:      1 minuto
Total:   ~20 minutos

═══════════════════════════════════════════════════════════════

💡 PRÓXIMOS PASSOS (APÓS UPLOAD)
───────────────────────────────────────────────────────────────

1. Integrar AccountsManager em uma aba do dashboard
2. Adicionar AccountSelector ao formulário de automação
3. Atualizar salvamento de automação para incluir account_id
4. Atualizar rota /api/automations para validar account_id
5. Testar com múltiplas contas

Veja: MULTI_ACCOUNT_IMPLEMENTATION.md (enviado separadamente)

═══════════════════════════════════════════════════════════════

❓ DÚVIDAS?
───────────────────────────────────────────────────────────────

Se algo der errado:
• Verifique que está na branch correta
• Certifique-se de copiar TODO o conteúdo dos arquivos
• Não edite os arquivos, apenas copie

═══════════════════════════════════════════════════════════════
