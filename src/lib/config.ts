import { decryptToken, encryptToken } from "./crypto";
import { query } from "./db";

export type AppConfig = {
  instagram_user_id: string | undefined;
  instagram_username: string | undefined;
  instagram_name: string | undefined;
  profile_picture_url: string | undefined;
  token_expires_at: Date | undefined;
  connected_at: Date | undefined;
};

export type InstagramAccount = AppConfig & {
  id: string;
};

type ConfigWithToken = AppConfig & {
  access_token_ciphertext: string | null;
  access_token_iv: string | null;
  access_token_tag: string | null;
};

type AccountWithToken = InstagramAccount & ConfigWithToken;

// Legacy: mantém compatibilidade com código antigo
export async function getPublicConfig(): Promise<AppConfig> {
  const result = await query<AppConfig>(`
    SELECT instagram_user_id, instagram_username, instagram_name,
           profile_picture_url, token_expires_at, connected_at
    FROM config WHERE id = 1
  `);
  return result.rows[0];
}

// Legacy: retorna o token da primeira conta conectada
export async function getAccessToken(): Promise<string> {
  const result = await query<ConfigWithToken>(`
    SELECT instagram_user_id, instagram_username, instagram_name,
           profile_picture_url, token_expires_at, connected_at,
           access_token_ciphertext, access_token_iv, access_token_tag
    FROM config WHERE id = 1
  `);
  const row = result.rows[0];
  if (!row?.access_token_ciphertext || !row.access_token_iv || !row.access_token_tag) {
    throw new Error("Instagram ainda não está conectado.");
  }
  return decryptToken(row.access_token_ciphertext, row.access_token_iv, row.access_token_tag);
}

// Novo: lista todas as contas conectadas
export async function listInstagramAccounts(): Promise<InstagramAccount[]> {
  const result = await query<InstagramAccount>(`
    SELECT id, instagram_user_id, instagram_username, instagram_name,
           profile_picture_url, token_expires_at, connected_at
    FROM instagram_accounts
    ORDER BY connected_at DESC
  `);
  return result.rows;
}

// Novo: obtém uma conta específica com seu token
export async function getAccountWithToken(accountId: string): Promise<string> {
  const result = await query<AccountWithToken>(`
    SELECT id, instagram_user_id, instagram_username, instagram_name,
           profile_picture_url, token_expires_at, connected_at,
           access_token_ciphertext, access_token_iv, access_token_tag
    FROM instagram_accounts
    WHERE id = $1
  `, [accountId]);

  const row = result.rows[0];
  if (!row?.access_token_ciphertext || !row.access_token_iv || !row.access_token_tag) {
    throw new Error(`Conta Instagram com ID ${accountId} não encontrada ou sem token.`);
  }
  return decryptToken(row.access_token_ciphertext, row.access_token_iv, row.access_token_tag);
}

// Novo: salva/atualiza uma conexão na tabela nova
export async function saveInstagramAccount(input: {
  accessToken: string;
  expiresAt: Date;
  userId: string;
  username?: string;
  name?: string;
  profilePictureUrl?: string;
}): Promise<string> {
  const encrypted = encryptToken(input.accessToken);

  // Verifica se já existe uma conta com este user_id
  const existing = await query<{ id: string }>(`
    SELECT id FROM instagram_accounts WHERE instagram_user_id = $1
  `, [input.userId]);

  if (existing.rows.length > 0) {
    // Atualiza conta existente
    const accountId = existing.rows[0].id;
    await query(
      `UPDATE instagram_accounts
         SET access_token_ciphertext = $1,
             access_token_iv = $2,
             access_token_tag = $3,
             token_expires_at = $4,
             instagram_username = $5,
             instagram_name = $6,
             profile_picture_url = $7,
             updated_at = now()
       WHERE id = $8`,
      [
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.tag,
        input.expiresAt,
        input.username ?? null,
        input.name ?? null,
        input.profilePictureUrl ?? null,
        accountId,
      ],
    );
    return accountId;
  } else {
    // Cria nova conta
    const result = await query<{ id: string }>(
      `INSERT INTO instagram_accounts
        (instagram_user_id, instagram_username, instagram_name, profile_picture_url,
         access_token_ciphertext, access_token_iv, access_token_tag, token_expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        input.userId,
        input.username ?? null,
        input.name ?? null,
        input.profilePictureUrl ?? null,
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.tag,
        input.expiresAt,
      ],
    );
    return result.rows[0].id;
  }
}

// Legacy: mantém compatibilidade, salva também na tabela config (para código antigo)
export async function saveInstagramConnection(input: {
  accessToken: string;
  expiresAt: Date;
  userId: string;
  username?: string;
  name?: string;
  profilePictureUrl?: string;
}) {
  const encrypted = encryptToken(input.accessToken);
  await query(
    `UPDATE config
       SET instagram_user_id = $1,
           instagram_username = $2,
           instagram_name = $3,
           profile_picture_url = $4,
           access_token_ciphertext = $5,
           access_token_iv = $6,
           access_token_tag = $7,
           token_expires_at = $8,
           connected_at = COALESCE(connected_at, now()),
           updated_at = now()
     WHERE id = 1`,
    [
      input.userId,
      input.username ?? null,
      input.name ?? null,
      input.profilePictureUrl ?? null,
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.tag,
      input.expiresAt,
    ],
  );
}

export async function updateAccessToken(accessToken: string, expiresAt: Date) {
  const encrypted = encryptToken(accessToken);
  await query(
    `UPDATE config
       SET access_token_ciphertext = $1,
           access_token_iv = $2,
           access_token_tag = $3,
           token_expires_at = $4,
           updated_at = now()
     WHERE id = 1`,
    [encrypted.ciphertext, encrypted.iv, encrypted.tag, expiresAt],
  );
}

// Novo: Define o ID do dono da conta (para filtrar comentários)
export async function setOwnerUserId(userId: string) {
  await query(
    `UPDATE config SET owner_instagram_user_id = $1, updated_at = now() WHERE id = 1`,
    [userId],
  );
}

// Novo: Obtém o ID do dono da conta
export async function getOwnerUserId(): Promise<string | null> {
  const result = await query<{ owner_instagram_user_id: string | null }>(
    `SELECT owner_instagram_user_id FROM config WHERE id = 1`
  );
  return result.rows[0]?.owner_instagram_user_id ?? null;
}
