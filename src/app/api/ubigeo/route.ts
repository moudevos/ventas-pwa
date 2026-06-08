import { requireUser } from "@/server/auth/guards";
import { error, ok } from "@/server/http/responses";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);

  const ubigeo = new URL(request.url).searchParams.get("ubigeo");
  if (!ubigeo) return ok(null);
  const baseUrl = process.env.UBIGEO_API_URL;
  if (!baseUrl) return ok(null);

  const response = await fetch(baseUrl.replace("{ubigeo}", encodeURIComponent(ubigeo)), { cache: "no-store" });
  if (!response.ok) return ok(null);
  return ok(await response.json());
}
