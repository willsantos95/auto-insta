import { env } from "./env";
import { getAccessToken, getPublicConfig } from "./config";

const GRAPH = "https://graph.instagram.com";

function graphUrl(path: string): string {
  return `${GRAPH}/${env.META_API_VERSION}${path}`;
}

export class MetaError extends Error {
  code?: number;
  subcode?: number;
  metaMessage?: string;

  constructor(statusCode: number, data: any) {
    let errorData = data?.error || data;
    let code = errorData?.code;
    let subcode = errorData?.error_subcode;
    let message = errorData?.message || errorData?.error_message || JSON.stringify(data);

    // Handle different error response formats from Meta
    if (!code && typeof data?.error === "string") {
      message = data.error;
    }
    if (!code && data?.error_code) {
      code = data.error_code;
      subcode = data?.error_subcode;
    }

    super(`Meta API ${statusCode}: ${message}`);
    this.name = "MetaError";
    this.code = code;
    this.subcode = subcode;
    this.metaMessage = message;

    // Log full error for debugging
    if (code || subcode) {
      console.log(`[MetaError] code=${code}, subcode=${subcode}, message=${message}`);
    }
  }
}

async function parseMetaResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new MetaError(response.status, data);
  }
  return data;
}

export async function exchangeShortToken(code: string, redirectUri: string) {
  // A documentação da Meta demonstra esta troca como multipart/form-data
  // (curl -F). FormData deixa o runtime criar o boundary corretamente.
  const body = new FormData();
  body.set("client_id", env.INSTAGRAM_APP_ID);
  body.set("client_secret", env.INSTAGRAM_APP_SECRET);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", redirectUri);
  body.set("code", code);

  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const metaMessage =
      typeof data?.error_message === "string"
        ? data.error_message
        : typeof data?.error?.message === "string"
          ? data.error.message
          : JSON.stringify(data);

    throw new Error(
      `Falha ao trocar o código OAuth (${response.status}): ${metaMessage}. ` +
        `Redirect usado: ${redirectUri}. Se persistir, confira se INSTAGRAM_APP_SECRET pertence ao app do Instagram ${env.INSTAGRAM_APP_ID}.`,
    );
  }

  return data as { access_token: string; user_id: string };
}

export async function exchangeLongToken(shortToken: string) {
  const url = new URL(`${GRAPH}/access_token`);
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", env.INSTAGRAM_APP_SECRET);
  url.searchParams.set("access_token", shortToken);
  const response = await fetch(url, { cache: "no-store" });
  return parseMetaResponse(response) as Promise<{ access_token: string; token_type: string; expires_in: number }>;
}

export async function refreshLongToken(currentToken: string) {
  const url = new URL(`${GRAPH}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", currentToken);
  const response = await fetch(url, { cache: "no-store" });
  return parseMetaResponse(response) as Promise<{ access_token: string; token_type: string; expires_in: number }>;
}

export async function fetchMyProfile(accessToken: string) {
  const url = new URL(graphUrl("/me"));
  url.searchParams.set("fields", "user_id,username,name,profile_picture_url");
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url, { cache: "no-store" });
  return parseMetaResponse(response) as Promise<{
    user_id: string;
    username?: string;
    name?: string;
    profile_picture_url?: string;
  }>;
}

export async function subscribeAccount(userId: string, accessToken: string) {
  const url = new URL(graphUrl(`/${userId}/subscribed_apps`));
  url.searchParams.set("subscribed_fields", "comments,messages");
  url.searchParams.set("access_token", accessToken);
  const response = await fetch(url, { method: "POST", cache: "no-store" });
  return parseMetaResponse(response);
}

export async function fetchMedia() {
  const token = await getAccessToken();
  const config = await getPublicConfig();
  if (!config.instagram_user_id) throw new Error("Conta do Instagram não conectada.");
  const url = new URL(graphUrl(`/${config.instagram_user_id}/media`));
  url.searchParams.set("fields", "id,media_type,media_url,thumbnail_url,caption,permalink,timestamp");
  url.searchParams.set("limit", "50");
  url.searchParams.set("access_token", token);
  const response = await fetch(url, { cache: "no-store" });
  return parseMetaResponse(response);
}

async function authenticatedPost(path: string, body: unknown) {
  const token = await getAccessToken();
  const url = new URL(graphUrl(path));
  url.searchParams.set("access_token", token);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parseMetaResponse(response);
}

export async function sendPrivateReply(input: {
  accountId: string;
  commentId: string;
  text: string;
  quickReplyLabel?: string | null;
  quickReplyPayload?: string | null;
}) {
  const message: Record<string, unknown> = { text: input.text };
  if (input.quickReplyLabel && input.quickReplyPayload) {
    message.quick_replies = [
      {
        content_type: "text",
        title: input.quickReplyLabel.slice(0, 20),
        payload: input.quickReplyPayload,
      },
    ];
  }
  return authenticatedPost(`/${input.accountId}/messages`, {
    recipient: { comment_id: input.commentId },
    message,
  });
}

export async function sendDirectMessage(input: {
  accountId: string;
  recipientId: string;
  text: string;
  quickReplyLabel?: string | null;
  quickReplyPayload?: string | null;
}) {
  const message: Record<string, unknown> = { text: input.text };
  if (input.quickReplyLabel && input.quickReplyPayload) {
    message.quick_replies = [
      {
        content_type: "text",
        title: input.quickReplyLabel.slice(0, 20),
        payload: input.quickReplyPayload,
      },
    ];
  }
  return authenticatedPost(`/${input.accountId}/messages`, {
    recipient: { id: input.recipientId },
    message,
  });
}

export async function sendButtonMessage(input: {
  accountId: string;
  recipientId: string;
  text: string;
  buttonLabel: string;
  url: string;
}) {
  return authenticatedPost(`/${input.accountId}/messages`, {
    recipient: { id: input.recipientId },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: input.text,
          buttons: [
            {
              type: "web_url",
              url: input.url,
              title: input.buttonLabel.slice(0, 20),
            },
          ],
        },
      },
    },
  });
}

export async function sendPublicReply(commentId: string, message: string) {
  return authenticatedPost(`/${commentId}/replies`, { message });
}
