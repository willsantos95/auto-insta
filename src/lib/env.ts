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

// O Next importa módulos de rotas durante `next build`. As credenciais reais
// pertencem ao ambiente de execução do container e não devem ser exigidas nem
// gravadas na imagem durante a compilação.
const isProductionBuild =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";

const buildOnlyDefaults = {
  APP_URL: "http://localhost:3000",
  ADMIN_PASSWORD: "build-only-password",
  SESSION_SECRET: "build-only-session-secret-1234567890",
  INTERNAL_API_SECRET: "build-only-internal-secret-1234567890",
  PRIVACY_CONTACT_EMAIL: "build@example.com",
  DATABASE_URL: "postgresql://build:build@127.0.0.1:5432/build",
};

const rawEnvironment = {
  ...(isProductionBuild ? buildOnlyDefaults : {}),
  ...process.env,
  // Compatibilidade com o nome usado no EasyPanel e no painel da Meta.
  INSTAGRAM_APP_ID:
    process.env.INSTAGRAM_APP_ID ?? process.env.INSTAGRAM_CLIENT_ID ?? "",
};

export const env = schema.parse(rawEnvironment);
