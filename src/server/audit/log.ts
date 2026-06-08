import "server-only";

import { auditLogs } from "@/server/db/schema";
import { db } from "@/server/db";

type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "change_password" | "status_transition";

export async function audit(input: {
  actorId?: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  request?: Request;
}) {
  await db.insert(auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    before: input.before,
    after: input.after,
    ip: input.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: input.request?.headers.get("user-agent"),
  });
}
