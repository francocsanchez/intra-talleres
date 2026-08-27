import { auth } from "@/lib/auth";

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
        return;
      }

      throw error;
    }
  })();

  return ensureAdminPromise;
}
