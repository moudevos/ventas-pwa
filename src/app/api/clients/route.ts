import { desc } from "drizzle-orm";

import { clientSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { clients } from "@/server/db/schema";
import { created, error, ok, validationError } from "@/server/http/responses";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  return ok(await db.select().from(clients).orderBy(desc(clients.createdAt)));
}

export async function POST(request: Request) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const body = clientSchema.parse(await request.json());
    const [client] = await db.insert(clients).values({ ...body, email: body.email ?? "clientegenerico@generico.com", createdById: auth.user.id }).returning();
    await audit({ actorId: auth.user.id, action: "create", entity: "client", entityId: client.id, after: client, request });
    return created(client);
  } catch (err) {
    return validationError(err);
  }
}
