import { toNextJsHandler } from "better-auth/next-js";

import { ensureAuthAdmin } from "@/lib/bootstrap-auth";
import { auth } from "@/lib/auth";

const { GET: authGet, POST: authPost } = toNextJsHandler(auth);

export async function GET(request: Request) {
  await ensureAuthAdmin();
  return authGet(request);
}

export async function POST(request: Request) {
  await ensureAuthAdmin();
  return authPost(request);
}
