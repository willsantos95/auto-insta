import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import { query, transaction } from "./db";
import { findMatchingAutomation, getAutomation, type Automation } from "./automations";
import { enqueue } from "./queue";

export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | null): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const received = Buffer.from(signatureHeader.slice(7), "hex");
  const expected = Buffer.from(
    createHmac("sha256", env.INSTAGRAM_APP_SECRET).update(rawBody).digest("hex"),
    "hex",
  );
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function eventKey(payload: unknown, fallback: string) {
  return createHash("sha256").update(JSON.stringify(payload) + fallback).digest("hex");
}

async function upsertContact(input: {
  userId: string;
  username?: string | null;
  automationId?: string | null;
  inboundReply?: boolean;
}) {
  await query(
    `INSERT INTO contacts
      (instagram_user_id, username, first_contact_at, last_reply_at, window_expires_at, last_automation_id, updated_at)
     VALUES ($1,$2,now(),CASE WHEN $4 THEN now() ELSE NULL END,
             CASE WHEN $4 THEN now()+interval '24 hours' ELSE NULL END,$3,now())
     ON CONFLICT (instagram_user_id) DO UPDATE SET
       username=COALESCE(EXCLUDED.username, contacts.username),
       last_reply_at=CASE WHEN $4 THEN now() ELSE contacts.last_reply_at END,
       window_expires_at=CASE WHEN $4 THEN now()+interval '24 hours' ELSE contacts.window_expires_at END,
       last_automation_id=COALESCE($3, contacts.last_automation_id),
       updated_at=now()`,
    [input.userId, input.username ?? null, input.automationId ?? null, input.inboundReply ?? false],
  );
}

async function recordEvent(input: {
  key: string;
  field: string;
  eventType: string;
  accountId?: string | null;
  senderId?: string | null;
  commentId?: string | null;
  mediaId?: string | null;
  payload: unknown;
}): Promise<number | null> {
  const result = await query<{ id: number }>(
    `INSERT INTO events
      (event_key, field, event_type, instagram_account_id, sender_id, comment_id, media_id, payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (event_key) DO NOTHING
     RETURNING id`,
    [input.key, input.field, input.eventType, input.accountId, input.senderId, input.commentId, input.mediaId, input.payload],
  );
  return result.rows[0]?.id ?? null;
}

function quickReplyPayload(automationId: string) {
  return `AUTO_CONFIRM:${automationId}`;
}

async function queueWelcome(input: {
  automation: Automation;
  eventId: number;
  accountId: string;
  senderId: string;
  commentId?: string | null;
  isPrivateReply: boolean;
  eventTimestamp?: number;
}) {
  const payload = {
    text: input.automation.welcome_dm,
    quickReplyLabel: input.automation.quick_reply_label,
    quickReplyPayload: input.automation.quick_reply_label ? quickReplyPayload(input.automation.id) : null,
  };
  if (input.isPrivateReply && input.commentId) {
    const eventDate = input.eventTimestamp ? new Date(input.eventTimestamp * 1000) : new Date();
    const expiresAt = new Date(eventDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    await enqueue({
      dedupeKey: `comment:${input.commentId}:private:${input.automation.id}`,
      automationId: input.automation.id,
      eventId: input.eventId,
      contactId: input.senderId,
      kind: "private_reply",
      commentId: input.commentId,
      payload,
      expiresAt,
      bypassWindow: true,
    });

    if (input.automation.public_replies.length > 0) {
      const selected = input.automation.public_replies[Math.floor(Math.random() * input.automation.public_replies.length)];
      await enqueue({
        dedupeKey: `comment:${input.commentId}:public:${input.automation.id}`,
        automationId: input.automation.id,
        eventId: input.eventId,
        contactId: input.senderId,
        kind: "public_reply",
        commentId: input.commentId,
        payload: { text: selected },
        expiresAt,
        bypassWindow: true,
      });
    }
  } else {
    await enqueue({
      dedupeKey: `event:${input.eventId}:welcome:${input.automation.id}`,
      automationId: input.automation.id,
      eventId: input.eventId,
      contactId: input.senderId,
      recipientId: input.senderId,
      kind: input.automation.quick_reply_label ? "dm_quick_reply" : "dm_text",
      payload,
      windowRequired: true,
    });
  }
}

async function enqueueFollowups(automation: Automation, contactId: string, sourceKey: string) {
  const result = await query<{
    id: string;
    step_order: number;
    kind: "text" | "button";
    delay_seconds: number;
    message_text: string;
    button_label: string | null;
    button_url: string | null;
  }>(`SELECT * FROM followups WHERE automation_id=$1 ORDER BY step_order`, [automation.id]);

  for (const step of result.rows) {
    const sendAfter = new Date(Date.now() + step.delay_seconds * 1000);
    await enqueue({
      dedupeKey: `${sourceKey}:followup:${step.id}`,
      automationId: automation.id,
      contactId,
      recipientId: contactId,
      kind: step.kind === "button" ? "dm_button" : "dm_text",
      payload: {
        text: step.message_text,
        buttonLabel: step.button_label,
        url: step.button_url,
      },
      sendAfter,
      windowRequired: true,
    });
  }
}

async function processComment(accountId: string, value: any, timestamp?: number) {
  const commentId = String(value.id ?? value.comment_id ?? "");
  const text = String(value.text ?? "");
  const senderId = String(value.from?.id ?? value.user_id ?? "");
  const username = value.from?.username ? String(value.from.username) : null;
  const mediaId = value.media?.id ? String(value.media.id) : value.media_id ? String(value.media_id) : null;
  if (!commentId || !senderId || !text) return;

  const key = eventKey(value, `comment:${commentId}`);
  const eventId = await recordEvent({
    key,
    field: "comments",
    eventType: "comment",
    accountId,
    senderId,
    commentId,
    mediaId,
    payload: value,
  });
  if (!eventId) return;

  const automation = await findMatchingAutomation({ trigger: "comment", text, mediaId });
  await upsertContact({ userId: senderId, username, automationId: automation?.id });
  if (automation) {
    await queueWelcome({ automation, eventId, accountId, senderId, commentId, isPrivateReply: true, eventTimestamp: timestamp });
  }
  await query(`UPDATE events SET processed_at=now() WHERE id=$1`, [eventId]);
}

async function processMessage(accountId: string, messaging: any) {
  const message = messaging.message;
  if (!message || message.is_echo) return;
  const senderId = String(messaging.sender?.id ?? "");
  if (!senderId) return;
  const text = String(message.text ?? "");
  const storyReply = Boolean(message.reply_to?.story);
  const quickPayload = message.quick_reply?.payload ? String(message.quick_reply.payload) : null;
  const mid = String(message.mid ?? "");
  const key = mid || eventKey(messaging, `message:${senderId}:${messaging.timestamp ?? Date.now()}`);
  const eventId = await recordEvent({
    key,
    field: "messages",
    eventType: storyReply ? "story_reply" : quickPayload ? "quick_reply" : "dm",
    accountId,
    senderId,
    mediaId: message.reply_to?.story?.id ? String(message.reply_to.story.id) : null,
    payload: messaging,
  });
  if (!eventId) return;

  let automation: Automation | null = null;
  if (quickPayload?.startsWith("AUTO_CONFIRM:")) {
    automation = await getAutomation(quickPayload.slice("AUTO_CONFIRM:".length));
  } else if (text) {
    automation = await findMatchingAutomation({ trigger: storyReply ? "story" : "dm", text });
  }

  await upsertContact({ userId: senderId, automationId: automation?.id, inboundReply: true });

  if (quickPayload?.startsWith("AUTO_CONFIRM:") && automation) {
    await enqueueFollowups(automation, senderId, `event:${eventId}`);
  } else if (automation) {
    await queueWelcome({ automation, eventId, accountId, senderId, isPrivateReply: false });
  } else if (text) {
    const contact = await query<{ last_automation_id: string | null }>(
      `SELECT last_automation_id FROM contacts WHERE instagram_user_id=$1`,
      [senderId],
    );
    const lastAutomationId = contact.rows[0]?.last_automation_id;
    if (lastAutomationId) {
      const lastAutomation = await getAutomation(lastAutomationId);
      if (lastAutomation) await enqueueFollowups(lastAutomation, senderId, `event:${eventId}`);
    }
  }
  await query(`UPDATE events SET processed_at=now() WHERE id=$1`, [eventId]);
}

export async function processWebhookPayload(payload: any) {
  for (const entry of payload.entry ?? []) {
    const accountId = String(entry.id ?? "");
    for (const change of entry.changes ?? []) {
      if (change.field === "comments") {
        await processComment(accountId, change.value, entry.time);
      }
      if (change.field === "messages" && change.value) {
        await processMessage(accountId, change.value);
      }
    }
    for (const messaging of entry.messaging ?? []) {
      await processMessage(accountId, messaging);
    }
  }
}
