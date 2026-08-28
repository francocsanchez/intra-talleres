import { redirect } from "next/navigation";

import { redirectToCentralLogin } from "@/lib/auth/central";
import { getServerAuthResult } from "@/lib/auth-session";

export default async function SignInPage() {
  const authResult = await getServerAuthResult();

  if (authResult.status === "authenticated") {
    redirect("/");
  }

  if (authResult.status === "forbidden") {
    redirect("/forbidden");
  }

  redirectToCentralLogin("/");
}
