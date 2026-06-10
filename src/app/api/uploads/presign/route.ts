import { uploadPresignSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { error, ok, validationError } from "@/server/http/responses";
import { createUploadUrl } from "@/server/storage/r2";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const body = uploadPresignSchema.parse(await request.json());
    return ok(await createUploadUrl(body));
  } catch (err) {
    return err instanceof Error ? error(err.message, 400) : validationError(err);
  }
}
