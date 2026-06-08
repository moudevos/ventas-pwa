import { and, eq, ilike, or } from "drizzle-orm";

import { clientFindSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { normalizeDocument } from "@/server/clients/documents";
import { db } from "@/server/db";
import { clients } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const input = clientFindSchema.parse(params);
    const rawDocument = input.documentId ?? input.documentNumber;
    const documentId = rawDocument && input.documentType && input.documentType !== "GENERIC"
      ? normalizeDocument({ documentType: input.documentType, documentId: rawDocument })
      : rawDocument;
    const filters = [
      input.documentType ? eq(clients.documentType, input.documentType) : undefined,
      documentId ? eq(clients.documentId, documentId) : undefined,
      input.email ? eq(clients.email, input.email) : undefined,
      input.q ? or(ilike(clients.name, `%${input.q}%`), ilike(clients.documentId, `%${input.q}%`)) : undefined,
    ].filter(Boolean);
    const rows = await db
      .select()
      .from(clients)
      .where(filters.length ? and(...filters) : undefined)
      .limit(20);
    return ok(rows);
  } catch (err) {
    return validationError(err);
  }
}
