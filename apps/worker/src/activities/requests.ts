/**
 * Request & assignment activities
 *
 * OWNS:
 * - Loading request context (requester, assignment)
 * - Updating EmployeeRequest status
 * - Updating Assignment status
 * - Creating WorkedRecord placeholders
 *
 * Called by: RequestWorkflow, AssignmentWorkflow
 */

import { RequestStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { RequestContext } from "../lib/types.js";

/**
 * Load request context from requestId.
 * Returns requester (employeeId), assignment reference, and fields needed for
 * notifications and worked record creation.
 */
export async function getRequestContext(requestId: string): Promise<RequestContext> {
  const req = await prisma.employeeRequest.findUnique({
    where: { id: requestId },
    select: { employeeId: true, assignmentId: true },
  });
  if (!req) throw new Error(`Request not found: ${requestId}`);
  return { employeeId: req.employeeId, assignmentId: req.assignmentId };
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: string
): Promise<void> {
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: status as "DRAFT" | "PUBLISHED" | "OPEN" | "FILLED" | "CLOSED" | "COMPLETED" | "CANCELED" },
  });
}

export async function updateRequestStatus(
  requestId: string,
  status: string
): Promise<void> {
  await prisma.employeeRequest.update({
    where: { id: requestId },
    data: { status: status as RequestStatus },
  });
}

/**
 * Persist request state to DB.
 * Updates EmployeeRequest.status (e.g. INELIGIBLE, PENDING_APPROVAL, APPROVED, REJECTED, WITHDRAWN).
 */
export async function persistRequestState(
  requestId: string,
  status: string
): Promise<void> {
  await updateRequestStatus(requestId, status);
}

export async function createWorkedRecordPlaceholder(
  requestId: string,
  assignmentId: string,
  userId: string,
  orgId: string
): Promise<string> {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { payAmount: true },
  });
  const record = await prisma.workedRecord.create({
    data: {
      orgId,
      userId,
      assignmentId,
      requestId,
      hours: 0,
      payAmount: assignment?.payAmount ?? 0,
      workedAt: new Date(),
    },
  });
  return record.id;
}
