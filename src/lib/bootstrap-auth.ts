import { createLocalAccountIssuer } from "@better-auth/core/db";
import { hashPassword } from "better-auth/crypto";

import { auth } from "@/lib/auth";
import { getRawMongoDb } from "@/lib/mongo-client";

const adminEmail =
  process.env.AUTH_ADMIN_EMAIL || "admin@nipponcarsrl.com.ar";

const adminPassword =
  process.env.AUTH_ADMIN_PASSWORD || "Nippon111+";

const adminName = process.env.AUTH_ADMIN_NAME || "Administrador";

let ensureAdminPromise: Promise<void> | null = null;

export function ensureAuthAdmin() {
  if (ensureAdminPromise) {
    return ensureAdminPromise;
  }

  ensureAdminPromise = (async () => {
    try {
      await auth.api.createUser({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: adminName,
          role: "admin",
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        /already exists|another email|ya existe/i.test(error.message)
      ) {
        const db = await getRawMongoDb();
        const users = db.collection("user");
        const accounts = db.collection("account");
        const existingUser = await users.findOne<{ id: string }>({
          email: adminEmail.toLowerCase(),
        });

        if (!existingUser) {
          return;
        }

        const hashedPassword = await hashPassword(adminPassword);
        const credentialIssuer = createLocalAccountIssuer("credential");

        await users.updateOne(
          { id: existingUser.id },
          {
            $set: {
              name: adminName,
              role: "admin",
              updatedAt: new Date(),
            },
          },
        );

        await accounts.updateOne(
          {
            userId: existingUser.id,
            providerId: "credential",
            issuer: credentialIssuer,
            accountId: existingUser.id,
          },
          {
            $set: {
              password: hashedPassword,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              id: crypto.randomUUID(),
              createdAt: new Date(),
              userId: existingUser.id,
              providerId: "credential",
              issuer: credentialIssuer,
              accountId: existingUser.id,
            },
          },
          { upsert: true },
        );

        return;
      }

      throw error;
    }
  })();

  return ensureAdminPromise;
}
