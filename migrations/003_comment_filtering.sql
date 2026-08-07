-- Adicionar campos para filtrar comentários do dono e configurar tipo de resposta

ALTER TABLE config ADD COLUMN owner_instagram_user_id text;

-- Campo em automations para forçar resposta pública (comentário) em vez de DM
ALTER TABLE automations ADD COLUMN prefer_public_reply boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN config.owner_instagram_user_id IS 'ID da conta dona. Comentários deste usuário serão ignorados.';
COMMENT ON COLUMN automations.prefer_public_reply IS 'Se true, responde sempre com comentário público. Se false, responde com DM.';
