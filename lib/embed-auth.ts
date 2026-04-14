import { createHmac, timingSafeEqual } from "crypto";

export type EmbedTokenPayload = {
  version: 1;
  projectId: string;
  allowedDomains: string[];
  iat: number;
  exp: number;
};

function getEmbedTokenSecret() {
  const secret = process.env.EMBED_TOKEN_SECRET;

  if (!secret) {
    throw new Error("EMBED_TOKEN_SECRET is not configured.");
  }

  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getEmbedTokenSecret()).update(value).digest("base64url");
}

export function normalizeAllowedDomain(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (!trimmed) return null;

  try {
    const url = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);

    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

export function createEmbedToken(input: {
  projectId: string;
  allowedDomains: string[];
  expiresInSeconds?: number;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: EmbedTokenPayload = {
    version: 1,
    projectId: input.projectId,
    allowedDomains: [...new Set(input.allowedDomains.map((item) => item.toLowerCase()))],
    iat: now,
    exp: now + (input.expiresInSeconds ?? 60 * 60 * 24 * 30),
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyEmbedToken(token: string) {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return { ok: false as const, error: "Invalid token format." };
  }

  const expectedSignature = signValue(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return { ok: false as const, error: "Invalid token signature." };
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as EmbedTokenPayload;

    if (payload.version !== 1) {
      return { ok: false as const, error: "Unsupported token version." };
    }

    if (!payload.projectId || !Array.isArray(payload.allowedDomains)) {
      return { ok: false as const, error: "Invalid token payload." };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return { ok: false as const, error: "Token expired." };
    }

    return { ok: true as const, payload };
  } catch {
    return { ok: false as const, error: "Invalid token payload." };
  }
}

export function getSourceOriginFromHeaders(headers: Headers) {
  const origin = headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin.toLowerCase();
    } catch {
      return null;
    }
  }

  const referer = headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin.toLowerCase();
    } catch {
      return null;
    }
  }

  return null;
}

export function getRequestOriginFromHeaders(headers: Headers) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const protoHeader = headers.get("x-forwarded-proto");

  if (!host) return null;

  const proto =
    protoHeader ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${proto}://${host}`.toLowerCase();
}

export function isAllowedDomain(origin: string | null, allowedDomains: string[]) {
  if (!origin) return false;
  return allowedDomains.some((domain) => domain.toLowerCase() === origin.toLowerCase());
}
