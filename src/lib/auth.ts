import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";

import { getRawMongoDbSync } from "@/lib/mongo-client";

const authBaseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3012";

const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  "intra-talleres-dev-secret-change-me-in-production";

function isLocalOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function buildTrustedOrigins() {
  const configuredOrigins = (process.env.AUTH_TRUSTED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      authBaseUrl,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3012",
      "http://127.0.0.1:3012",
      ...configuredOrigins,
    ]),
  );
}

export const auth = betterAuth({
  baseURL: authBaseUrl,
  secret: authSecret,
  trustedOrigins: async (request) => {
    const origins = buildTrustedOrigins();

    if (!request) {
      return origins;
    }

    const requestOrigin = request.headers.get("origin");
    const requestHost = request.headers.get("host");
    const requestProto =
      request.headers.get("x-forwarded-proto") ||
      (request.url.startsWith("https://") ? "https" : "http");

    if (requestOrigin && isLocalOrigin(requestOrigin)) {
      origins.push(requestOrigin);
    }

    if (requestHost) {
      const derivedOrigin = `${requestProto}://${requestHost}`;
      if (isLocalOrigin(derivedOrigin)) {
        origins.push(derivedOrigin);
      }
    }

    return Array.from(new Set(origins));
  },
  database: mongodbAdapter(getRawMongoDbSync()),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    admin({
      defaultRole: "user",
    }),
  ],
});
