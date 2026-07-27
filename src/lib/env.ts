import { z } from "zod";

const boolString = z
  .string()
  .optional()
  .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  APP_TIMEZONE: z.string().default("America/Sao_Paulo"),
  ADMIN_PASSWORD: z.string().min(10),
  SESSION_SECRET: z.string().min(24),
  INTERNAL_API_SECRET: z.string().min(24),
  PRIVACY_CONTACT_EMAIL: z.string().email(),
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: boolString,
  META_API_VERSION: z.string().default("v25.0"),
  INSTAGRAM_APP_ID: z.string().optional().default(""),
  INSTAGRAM_APP_SECRET: z.string().optional().default(""),
  WEBHOOK_VERIFY_TOKEN: z.string().optional().default(""),
  TOKEN_ENCRYPTION_KEY: z.string().optional().default(""),
  MAX_MESSAGES_PER_HOUR: z.coerce.number().int().min(1).max(1000).default(200),
  WORKER_INTERVAL_MS: z.coerce.number().int().min(500).default(500),
  QUEUE_CLAIM_TIMEOUT_MINUTES: z.coerce.number().int().min(1).default(10),
});

export const env = schema.parse(process.env);
