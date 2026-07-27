import { decryptToken, encryptToken } from "./crypto";
import { query } from "./db";

export type AppConfig = {
  instagram_user_id: string | null;
  instagram_username: string | null;
  instagram_name: string | null;
  profile_picture_url: string | null;
  token_expires_at: Date | null;
  connected_at: Date | null;
};

type ConfigWithToken = AppConfig & {
  access_token_ciphertext: string | null;
  access_token_iv: string | null;
  access_token_tag: string | null;
};

export async function getPublicConfig(): Promise<AppConfig> {
  const result = await query<AppConfig>(`
    SELECT instagram_user_id, instagram_username, instagram_name,
           profile_picture_url, token_expires_at, connected_at
    FROM config WHERE id = 1
  `);
  return result.rows[0];
}

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
