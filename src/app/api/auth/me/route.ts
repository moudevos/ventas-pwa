import { error, ok } from "@/server/http/responses";
import { requireUser } from "@/server/auth/guards";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  return ok(auth.user);
}
