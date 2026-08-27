import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";

import { getRawMongoDbSync } from "@/lib/mongo-client";

const authBaseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3012";

const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  "intra-talleres-dev-secret-change-me-in-production";

function buildTrustedOrigins() {
  const configuredOrigins = (process.env.AUTH_TRUSTED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const defaultOrigins =
    process.env.NODE_ENV === "production"
      ? []
      : [
          "http://localhost:3000",
          "http://127.0.0.1:3000",
          "http://localhost:3012",
          "http://127.0.0.1:3012",
        ];

  return Array.from(new Set([authBaseUrl, ...defaultOrigins, ...configuredOrigins]));
}

export const auth = betterAuth({
  baseURL: authBaseUrl,
  secret: authSecret,
  trustedOrigins: buildTrustedOrigins(),
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
