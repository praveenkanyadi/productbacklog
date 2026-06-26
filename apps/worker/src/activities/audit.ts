/**
 * Audit activities
 *
 * OWNS:
 * - Writing AuditEvent records for audit trail
 *
 * Called by: ApprovalWorkflow, RequestWorkflow (via persistRequestState or separate calls)
 */

import { prisma } from "../lib/prisma.js";

export interface RecordAuditEventInput {
  orgId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
}

export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      orgId: input.orgId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      changes: input.changes as object | undefined,
    },
  });
}
