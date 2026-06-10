import { eq } from "drizzle-orm";

import { uploadCompleteSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { products, uploadedFiles } from "@/server/db/schema";
import { created, error, validationError } from "@/server/http/responses";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const body = uploadCompleteSchema.parse(await request.json());
    const [file] = await db.insert(uploadedFiles).values({
      scope: body.scope,
      entityId: body.entityId,
      fileKey: body.fileKey,
      publicUrl: body.publicUrl,
      contentType: body.contentType,
      size: body.size,
      originalName: body.originalName,
      uploadedById: auth.user.id,
    }).returning();
    if (body.scope === "PRODUCT_IMAGE" && body.entityId) {
      await db.update(products).set({ primaryImageUrl: body.publicUrl, updatedAt: new Date() }).where(eq(products.id, body.entityId));
    }
    await audit({ actorId: auth.user.id, action: "create", entity: "uploaded_file", entityId: file.id, after: file, request });
    return created(file);
  } catch (err) {
    return validationError(err);
  }
}
