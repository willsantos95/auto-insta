-- Tabela para armazenar múltiplas contas Instagram
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_user_id text NOT NULL UNIQUE,
  instagram_username text NOT NULL,
  instagram_name text,
  profile_picture_url text,
  access_token_ciphertext text NOT NULL,
  access_token_iv text NOT NULL,
  access_token_tag text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Adicionar account_id nas automações (referenciará a primeira conta conectada por padrão)
ALTER TABLE automations ADD COLUMN account_id uuid REFERENCES instagram_accounts(id) ON DELETE RESTRICT;

-- Criar índice para buscar automações por conta
CREATE INDEX IF NOT EXISTS automations_account_idx ON automations (account_id);

-- Índice para buscar contas por user_id (útil para o fluxo OAuth)
CREATE INDEX IF NOT EXISTS instagram_accounts_user_id_idx ON instagram_accounts (instagram_user_id);

COMMENT ON TABLE instagram_accounts IS 'Múltiplas contas Instagram conectadas. Tokens armazenados com AES-256-GCM.';
