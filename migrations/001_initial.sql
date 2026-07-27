CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  instagram_user_id text,
  instagram_username text,
  instagram_name text,
  profile_picture_url text,
  access_token_ciphertext text,
  access_token_iv text,
  access_token_tag text,
  token_expires_at timestamptz,
  connected_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  triggers text[] NOT NULL DEFAULT ARRAY['comment']::text[],
  keywords text[] NOT NULL DEFAULT ARRAY[]::text[],
  match_type text NOT NULL DEFAULT 'contains' CHECK (match_type IN ('contains', 'exact', 'any')),
  media_id text,
  public_replies text[] NOT NULL DEFAULT ARRAY[]::text[],
  welcome_dm text NOT NULL,
  quick_reply_label text,
  link_text text,
  link_button_label text,
  link_url text,
  link_delay_seconds integer NOT NULL DEFAULT 0 CHECK (link_delay_seconds >= 0),
  reminder_text text,
  reminder_delay_seconds integer CHECK (reminder_delay_seconds IS NULL OR reminder_delay_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  kind text NOT NULL CHECK (kind IN ('text', 'button')),
  delay_seconds integer NOT NULL DEFAULT 0 CHECK (delay_seconds >= 0),
  message_text text NOT NULL,
  button_label text,
  button_url text,
  requires_24h_window boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (automation_id, step_order)
);

CREATE TABLE IF NOT EXISTS contacts (
  instagram_user_id text PRIMARY KEY,
  username text,
  first_contact_at timestamptz NOT NULL DEFAULT now(),
  last_reply_at timestamptz,
  window_expires_at timestamptz,
  last_automation_id uuid REFERENCES automations(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id bigserial PRIMARY KEY,
  event_key text NOT NULL UNIQUE,
  field text NOT NULL,
  event_type text NOT NULL,
  instagram_account_id text,
  sender_id text,
  comment_id text,
  media_id text,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text
);

CREATE TABLE IF NOT EXISTS queue (
  id bigserial PRIMARY KEY,
  dedupe_key text NOT NULL UNIQUE,
  automation_id uuid REFERENCES automations(id) ON DELETE SET NULL,
  event_id bigint REFERENCES events(id) ON DELETE SET NULL,
  contact_id text REFERENCES contacts(instagram_user_id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('private_reply', 'public_reply', 'dm_text', 'dm_button', 'dm_quick_reply')),
  recipient_id text,
  comment_id text,
  payload jsonb NOT NULL,
  send_after timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  window_required boolean NOT NULL DEFAULT false,
  bypass_window boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  claimed_at timestamptz,
  claimed_by text,
  sent_at timestamptz,
  failure_reason text,
  meta_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS queue_pending_idx ON queue (status, send_after, id);
CREATE INDEX IF NOT EXISTS queue_sent_at_idx ON queue (sent_at) WHERE status = 'sent';
CREATE INDEX IF NOT EXISTS events_received_at_idx ON events (received_at DESC);
CREATE INDEX IF NOT EXISTS contacts_window_idx ON contacts (window_expires_at);
CREATE INDEX IF NOT EXISTS automations_active_idx ON automations (active) WHERE active = true;

ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE config IS 'Uma única linha. O token é armazenado com AES-256-GCM.';
COMMENT ON TABLE queue IS 'Fila com claim atômico usando FOR UPDATE SKIP LOCKED.';
