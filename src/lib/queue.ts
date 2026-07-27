import os from "node:os";
import { env } from "./env";
import { pool, query, transaction } from "./db";
import { getPublicConfig } from "./config";
import { sendButtonMessage, sendDirectMessage, sendPrivateReply, sendPublicReply } from "./meta";

export type QueueItem = {
  id: number;
  dedupe_key: string;
  automation_id: string | null;
  event_id: number | null;
  contact_id: string | null;
  kind: "private_reply" | "public_reply" | "dm_text" | "dm_button" | "dm_quick_reply";
  recipient_id: string | null;
  comment_id: string | null;
  payload: Record<string, unknown>;
  send_after: Date;
  expires_at: Date | null;
  window_required: boolean;
  bypass_window: boolean;
  attempts: number;
  max_attempts: number;
};

const workerId = `${os.hostname()}:${process.pid}`;
const RATE_LOCK_ID = 184736251;

export async function enqueue(input: {
  dedupeKey: string;
  automationId?: string | null;
  eventId?: number | null;
  contactId?: string | null;
  kind: QueueItem["kind"];
  recipientId?: string | null;
  commentId?: string | null;
  payload: Record<string, unknown>;
  sendAfter?: Date;
  expiresAt?: Date | null;
  windowRequired?: boolean;
  bypassWindow?: boolean;
}) {
  await query(
    `INSERT INTO queue
      (dedupe_key, automation_id, event_id, contact_id, kind, recipient_id, comment_id,
       payload, send_after, expires_at, window_required, bypass_window)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (dedupe_key) DO NOTHING`,
    [
      input.dedupeKey,
      input.automationId ?? null,
      input.eventId ?? null,
      input.contactId ?? null,
      input.kind,
      input.recipientId ?? null,
      input.commentId ?? null,
      input.payload,
      input.sendAfter ?? new Date(),
      input.expiresAt ?? null,
      input.windowRequired ?? false,
      input.bypassWindow ?? false,
    ],
  );
}

async function resetStaleClaims() {
  await query(
    `UPDATE queue
       SET status='pending', claimed_at=NULL, claimed_by=NULL, updated_at=now(),
           failure_reason='Claim expirado; item devolvido à fila.'
     WHERE status='sending'
       AND claimed_at < now() - ($1::text || ' minutes')::interval`,
    [env.QUEUE_CLAIM_TIMEOUT_MINUTES],
  );
}

async function hourlyMessageCount(): Promise<number> {
  const result = await query<{ count: string }>(
    `SELECT count(*)::text AS count
       FROM queue
      WHERE status='sent'
        AND sent_at >= now() - interval '1 hour'
        AND kind IN ('private_reply','dm_text','dm_button','dm_quick_reply')`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function claimNext(): Promise<QueueItem | null> {
  return transaction(async (client) => {
    const result = await client.query<QueueItem>(
      `WITH candidate AS (
         SELECT id FROM queue
          WHERE status='pending'
            AND send_after <= now()
          ORDER BY send_after, id
          FOR UPDATE SKIP LOCKED
          LIMIT 1
       )
       UPDATE queue q
          SET status='sending', claimed_at=now(), claimed_by=$1,
              attempts=q.attempts+1, updated_at=now()
         FROM candidate c
        WHERE q.id=c.id
       RETURNING q.*`,
      [workerId],
    );
    return result.rows[0] ?? null;
  });
}

async function markSkipped(item: QueueItem, reason: string) {
  await query(
    `UPDATE queue SET status='skipped', failure_reason=$2, updated_at=now() WHERE id=$1`,
    [item.id, reason],
  );
}

async function validateWindow(item: QueueItem): Promise<boolean> {
  if (item.expires_at && new Date(item.expires_at).getTime() <= Date.now()) {
    await markSkipped(item, "Prazo permitido pela Meta expirou antes do envio.");
    return false;
  }
  if (!item.window_required || item.bypass_window) return true;
  if (!item.contact_id) {
    await markSkipped(item, "Item exige janela de 24h, mas não possui contato.");
    return false;
  }
  const result = await query<{ window_expires_at: Date | null }>(
    `SELECT window_expires_at FROM contacts WHERE instagram_user_id=$1`,
    [item.contact_id],
  );
  const expiresAt = result.rows[0]?.window_expires_at;
  if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) {
    await markSkipped(item, "Janela de 24 horas encerrada.");
    return false;
  }
  return true;
}

async function performSend(item: QueueItem) {
  const config = await getPublicConfig();
  if (!config.instagram_user_id) throw new Error("Instagram não conectado.");
  const text = String(item.payload.text ?? "");
  switch (item.kind) {
    case "private_reply":
      if (!item.comment_id) throw new Error("comment_id ausente.");
      return sendPrivateReply({
        accountId: config.instagram_user_id,
        commentId: item.comment_id,
        text,
        quickReplyLabel: item.payload.quickReplyLabel ? String(item.payload.quickReplyLabel) : null,
        quickReplyPayload: item.payload.quickReplyPayload ? String(item.payload.quickReplyPayload) : null,
      });
    case "public_reply":
      if (!item.comment_id) throw new Error("comment_id ausente.");
      return sendPublicReply(item.comment_id, text);
    case "dm_button":
      if (!item.recipient_id) throw new Error("recipient_id ausente.");
      return sendButtonMessage({
        accountId: config.instagram_user_id,
        recipientId: item.recipient_id,
        text,
        buttonLabel: String(item.payload.buttonLabel ?? "Abrir"),
        url: String(item.payload.url ?? ""),
      });
    case "dm_quick_reply":
    case "dm_text":
      if (!item.recipient_id) throw new Error("recipient_id ausente.");
      return sendDirectMessage({
        accountId: config.instagram_user_id,
        recipientId: item.recipient_id,
        text,
        quickReplyLabel: item.payload.quickReplyLabel ? String(item.payload.quickReplyLabel) : null,
        quickReplyPayload: item.payload.quickReplyPayload ? String(item.payload.quickReplyPayload) : null,
      });
  }
}

async function finalize(item: QueueItem, response: unknown) {
  await query(
    `UPDATE queue
        SET status='sent', sent_at=now(), meta_response=$2, failure_reason=NULL, updated_at=now()
      WHERE id=$1`,
    [item.id, response],
  );
}

async function fail(item: QueueItem, error: unknown) {
  const reason = error instanceof Error ? error.message : String(error);
  const finalFailure = item.attempts >= item.max_attempts;
  const retryDelay = Math.min(300, 2 ** Math.max(1, item.attempts));
  await query(
    `UPDATE queue
        SET status=$2,
            send_after=CASE WHEN $2='pending' THEN now() + ($3::text || ' seconds')::interval ELSE send_after END,
            claimed_at=NULL, claimed_by=NULL, failure_reason=$4, updated_at=now()
      WHERE id=$1`,
    [item.id, finalFailure ? "failed" : "pending", retryDelay, reason.slice(0, 4000)],
  );
}

export async function processOne(): Promise<boolean> {
  const lockClient = await pool.connect();
  let locked = false;
  try {
    const lockResult = await lockClient.query<{ locked: boolean }>(
      `SELECT pg_try_advisory_lock($1) AS locked`,
      [RATE_LOCK_ID],
    );
    locked = Boolean(lockResult.rows[0]?.locked);
    if (!locked) return false;

    await resetStaleClaims();
    if ((await hourlyMessageCount()) >= env.MAX_MESSAGES_PER_HOUR) return false;

    const lastSend = await query<{ sent_at: Date | null }>(
      `SELECT max(sent_at) AS sent_at FROM queue WHERE status='sent'`,
    );
    const lastSentAt = lastSend.rows[0]?.sent_at;
    if (lastSentAt) {
      const elapsed = Date.now() - new Date(lastSentAt).getTime();
      const wait = env.WORKER_INTERVAL_MS - elapsed;
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    }

    const item = await claimNext();
    if (!item) return false;
    try {
      if (!(await validateWindow(item))) return true;
      const response = await performSend(item);
      await finalize(item, response);
    } catch (error) {
      console.error(`Falha ao enviar item ${item.id}:`, error);
      await fail(item, error);
    }
    return true;
  } finally {
    if (locked) await lockClient.query(`SELECT pg_advisory_unlock($1)`, [RATE_LOCK_ID]);
    lockClient.release();
  }
}

export async function drainQueue(maxItems = 4) {
  let processed = 0;
  for (; processed < maxItems; processed += 1) {
    const didWork = await processOne();
    if (!didWork) break;
    if (processed + 1 < maxItems) {
      await new Promise((resolve) => setTimeout(resolve, env.WORKER_INTERVAL_MS));
    }
  }
  return processed;
}
