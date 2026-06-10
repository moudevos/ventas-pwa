import { eq } from "drizzle-orm";

import { uuidSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { products, uploadedFiles } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";
import { deleteObject } from "@/server/storage/r2";

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, id)).limit(1);
    if (!file) return error("File not found", 404);
    await db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
    if (file.scope === "PRODUCT_IMAGE" && file.entityId) {
      await db.update(products).set({ primaryImageUrl: null, updatedAt: new Date() }).where(eq(products.id, file.entityId));
    }
    await deleteObject(file.fileKey).catch(() => undefined);
    await audit({ actorId: auth.user.id, action: "delete", entity: "uploaded_file", entityId: id, before: file, request });
    return ok({ deleted: true });
  } catch (err) {
    return validationError(err);
  }
}
