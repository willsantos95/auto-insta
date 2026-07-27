import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "./env";

export const SESSION_COOKIE = "insta_auto_session";

export function expectedSessionToken(): string {
  return createHash("sha256")
    .update(`${env.ADMIN_PASSWORD}:${env.SESSION_SECRET}`)
    .digest("hex");
}

export function isValidPassword(password: string): boolean {
  const received = Buffer.from(createHash("sha256").update(password).digest("hex"));
  const expected = Buffer.from(createHash("sha256").update(env.ADMIN_PASSWORD).digest("hex"));
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function isValidSession(value?: string): boolean {
  if (!value) return false;
  const received = Buffer.from(value);
  const expected = Buffer.from(expectedSessionToken());
  return received.length === expected.length && timingSafeEqual(received, expected);
}
