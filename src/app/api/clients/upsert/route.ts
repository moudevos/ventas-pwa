import { eq } from "drizzle-orm";

import { clientSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { normalizeDocument } from "@/server/clients/documents";
import { db } from "@/server/db";
import { clients } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function POST(request: Request) {
    const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const body = clientSchema.parse(await request.json());
    const documentId = normalizeDocument({ documentType: body.documentType, documentId: body.documentId ?? body.documentNumber ?? "" });
    const normalized = {
      documentType: body.documentType,
      documentId,
      firstName: body.firstName,
      lastName: body.lastName,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address ?? body.deliveryAddress,
      deliveryReference: body.deliveryReference ?? body.reference,
      ubigeo: body.ubigeo,
      department: body.department,
      province: body.province,
      district: body.district,
      city: body.city,
      notes: body.notes ?? body.observations,
      active: body.active,
    };
    const before = documentId
      ? (await db.select().from(clients).where(eq(clients.documentId, documentId)).limit(1))[0]
      : undefined;
    const [client] = before
      ? await db.update(clients).set({ ...normalized, updatedAt: new Date() }).where(eq(clients.id, before.id)).returning()
      : await db.insert(clients).values({ ...normalized, createdById: auth.user.id }).returning();
    await audit({
      actorId: auth.user.id,
      action: before ? "update" : "create",
      entity: "client",
      entityId: client.id,
      before,
      after: client,
      request,
    });
    return ok(client, before ? 200 : 201);
  } catch (err) {
    return validationError(err);
  }
}
