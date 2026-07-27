import { z } from "zod";
import { query, transaction } from "./db";

export const automationInputSchema = z.object({
  name: z.string().min(2).max(120),
  active: z.boolean().default(true),
  triggers: z.array(z.enum(["comment", "story", "dm"])).min(1),
  keywords: z.array(z.string().trim().min(1)).default([]),
  match_type: z.enum(["contains", "exact", "any"]),
  media_id: z.string().nullable().optional(),
  public_replies: z.array(z.string().trim().min(1)).default([]),
  welcome_dm: z.string().min(1).max(1000),
  quick_reply_label: z.string().max(20).nullable().optional(),
  link_text: z.string().max(1000).nullable().optional(),
  link_button_label: z.string().max(20).nullable().optional(),
  link_url: z.string().url().nullable().optional(),
  link_delay_seconds: z.number().int().min(0).max(86_400).default(0),
  reminder_text: z.string().max(1000).nullable().optional(),
  reminder_delay_seconds: z.number().int().min(0).max(86_400).nullable().optional(),
});

export type AutomationInput = z.infer<typeof automationInputSchema>;

export type Automation = AutomationInput & {
  id: string;
  created_at: Date;
  updated_at: Date;
};

export async function listAutomations(): Promise<Automation[]> {
  const result = await query<Automation>(`SELECT * FROM automations ORDER BY created_at DESC`);
  return result.rows;
}

export async function getAutomation(id: string): Promise<Automation | null> {
  const result = await query<Automation>(`SELECT * FROM automations WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

async function rebuildFollowups(client: import("pg").PoolClient, id: string, input: AutomationInput) {
  await client.query(`DELETE FROM followups WHERE automation_id = $1`, [id]);
  let order = 1;
  if (input.link_text && input.link_url && input.link_button_label) {
    await client.query(
      `INSERT INTO followups
        (automation_id, step_order, kind, delay_seconds, message_text, button_label, button_url)
       VALUES ($1, $2, 'button', $3, $4, $5, $6)`,
      [id, order++, input.link_delay_seconds, input.link_text, input.link_button_label, input.link_url],
    );
  }
  if (input.reminder_text && input.reminder_delay_seconds !== null && input.reminder_delay_seconds !== undefined) {
    await client.query(
      `INSERT INTO followups
        (automation_id, step_order, kind, delay_seconds, message_text)
       VALUES ($1, $2, 'text', $3, $4)`,
      [id, order, input.reminder_delay_seconds, input.reminder_text],
    );
  }
}

export async function createAutomation(raw: unknown): Promise<Automation> {
  const input = automationInputSchema.parse(raw);
  return transaction(async (client) => {
    const result = await client.query<Automation>(
      `INSERT INTO automations
        (name, active, triggers, keywords, match_type, media_id, public_replies,
         welcome_dm, quick_reply_label, link_text, link_button_label, link_url,
         link_delay_seconds, reminder_text, reminder_delay_seconds)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        input.name,
        input.active,
        input.triggers,
        input.keywords,
        input.match_type,
        input.media_id ?? null,
        input.public_replies,
        input.welcome_dm,
        input.quick_reply_label ?? null,
        input.link_text ?? null,
        input.link_button_label ?? null,
        input.link_url ?? null,
        input.link_delay_seconds,
        input.reminder_text ?? null,
        input.reminder_delay_seconds ?? null,
      ],
    );
    const automation = result.rows[0];
    await rebuildFollowups(client, automation.id, input);
    return automation;
  });
}

export async function updateAutomation(id: string, raw: unknown): Promise<Automation | null> {
  const input = automationInputSchema.parse(raw);
  return transaction(async (client) => {
    const result = await client.query<Automation>(
      `UPDATE automations SET
         name=$2, active=$3, triggers=$4, keywords=$5, match_type=$6, media_id=$7,
         public_replies=$8, welcome_dm=$9, quick_reply_label=$10, link_text=$11,
         link_button_label=$12, link_url=$13, link_delay_seconds=$14,
         reminder_text=$15, reminder_delay_seconds=$16, updated_at=now()
       WHERE id=$1 RETURNING *`,
      [
        id,
        input.name,
        input.active,
        input.triggers,
        input.keywords,
        input.match_type,
        input.media_id ?? null,
        input.public_replies,
        input.welcome_dm,
        input.quick_reply_label ?? null,
        input.link_text ?? null,
        input.link_button_label ?? null,
        input.link_url ?? null,
        input.link_delay_seconds,
        input.reminder_text ?? null,
        input.reminder_delay_seconds ?? null,
      ],
    );
    const automation = result.rows[0];
    if (!automation) return null;
    await rebuildFollowups(client, id, input);
    return automation;
  });
}

export async function deleteAutomation(id: string) {
  const result = await query(`DELETE FROM automations WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function matchesAutomation(automation: Automation, text: string): boolean {
  if (automation.match_type === "any") return true;
  const normalizedText = normalize(text);
  return automation.keywords.some((keyword) => {
    const normalizedKeyword = normalize(keyword);
    if (automation.match_type === "exact") return normalizedText === normalizedKeyword;
    return normalizedText.includes(normalizedKeyword);
  });
}

export async function findMatchingAutomation(input: {
  trigger: "comment" | "story" | "dm";
  text: string;
  mediaId?: string | null;
}): Promise<Automation | null> {
  const rows = await listAutomations();
  return (
    rows.find((automation) => {
      if (!automation.active || !automation.triggers.includes(input.trigger)) return false;
      if (automation.media_id && automation.media_id !== input.mediaId) return false;
      return matchesAutomation(automation, input.text);
    }) ?? null
  );
}
