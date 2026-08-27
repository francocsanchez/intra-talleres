import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";

import { getRawMongoDb } from "@/lib/mongo-client";

const authBaseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3012";

const authSecret =
  process.env.BETTER_AUTH_SECRET ||
  "intra-talleres-dev-secret-change-me-in-production";

const authDb = await getRawMongoDb();

export const auth = betterAuth({
  baseURL: authBaseUrl,
  secret: authSecret,
  database: mongodbAdapter(authDb),
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
