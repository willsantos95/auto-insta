-- Script para excluir/limpar conta Instagram conectada
-- ⚠️ Use com cuidado - deleta dados!

-- OPÇÃO 1: Limpar APENAS a tabela config (desconectar conta atual)
-- Use isto se quiser reconectar com outra conta
DELETE FROM config WHERE id = 1;
INSERT INTO config (id) VALUES (1);
SELECT 'Conta desconectada! Próximo: clique em Conectar Instagram' AS resultado;

-- ═══════════════════════════════════════════════════════════

-- OPÇÃO 2: Excluir uma conta específica de instagram_accounts
-- Substitua 'ACCOUNT_ID_AQUI' pelo ID da conta que quer deletar
-- DELETE FROM instagram_accounts WHERE id = 'ACCOUNT_ID_AQUI';
-- SELECT 'Conta excluída de instagram_accounts' AS resultado;

-- ═══════════════════════════════════════════════════════════

-- OPÇÃO 3: Limpar TUDO (nuclear option - usa com cuidado!)
-- DELETE FROM instagram_accounts;
-- DELETE FROM config WHERE id = 1;
-- INSERT INTO config (id) VALUES (1);
-- SELECT 'TUDO DELETADO! Reinicie do zero.' AS resultado;

-- ═══════════════════════════════════════════════════════════

-- VER CONTAS ATUAIS antes de deletar
SELECT 'CONTAS CONECTADAS:' AS info;
SELECT id, instagram_username, instagram_name, token_expires_at
FROM instagram_accounts
ORDER BY connected_at DESC;

SELECT '═══════════════════════════════════════════' AS info;
SELECT 'CONTA ATIVA (config):' AS info;
SELECT instagram_user_id, instagram_username, instagram_name, token_expires_at
FROM config WHERE id = 1;
