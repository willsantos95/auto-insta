-- Rastrear quais automações já responderam para cada pessoa
-- Permite responder apenas 1x por automação

ALTER TABLE contacts ADD COLUMN responded_automations uuid[] NOT NULL DEFAULT ARRAY[]::uuid[];

-- Campo em automations para controlar o comportamento
ALTER TABLE automations ADD COLUMN respond_once_per_user boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN contacts.responded_automations IS 'Array de IDs de automações que já responderam para este contato. Usada para responder apenas 1x.';
COMMENT ON COLUMN automations.respond_once_per_user IS 'Se true, responde apenas o primeiro comentário/mensagem de cada pessoa.';

CREATE INDEX contacts_responded_automations_idx ON contacts USING GIN (responded_automations);
