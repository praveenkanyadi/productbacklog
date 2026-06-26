/**
 * RequestWorkflow - Employee extra duty request lifecycle
 *
 * OWNS:
 * - Orchestrating eligibility check → approval chain → worked record creation
 * - Handling withdraw signal while pending
 * - Notifying requester and approvers at each stage
 *
 * Delegates to activities:
 * - getRequestContext (load requester, assignment for notifications and worked record)
 * - evaluateEligibility
 * - createApprovalInstancesFromTemplate (after eligibility passes)
 * - persistRequestState
 * - sendNotification
 * - createWorkedRecordPlaceholder
 *
 * Input is thin: requestId, approvalTemplateId, orgId, initiatedByUserId.
 * Approval records are created only after eligibility passes via activity.
 *
 * Must remain deterministic: only proxyActivities, startChild, defineSignal, setHandler, condition.
 */

import {
  CancellationScope,
  defineSignal,
  setHandler,
  startChild,
  condition,
  proxyActivities,
} from "@temporalio/workflow";
import type { activities } from "../activities/index.js";
import type {
  ApprovalWorkflowResult,
  RequestWorkflowInput,
  RequestWorkflowResult,
} from "../lib/types.js";
import { ApprovalWorkflow } from "./approval.js";

// -----------------------------------------------------------------------------
// Signal: withdraw request (employee cancels while pending)
// -----------------------------------------------------------------------------

export const requestWithdrawSignal = defineSignal("request-withdraw");

// -----------------------------------------------------------------------------
// Activities
// -----------------------------------------------------------------------------

const {
  getRequestContext,
  evaluateEligibility,
  createApprovalInstancesFromTemplate,
  persistRequestState,
  sendNotification,
  createWorkedRecordPlaceholder,
  recordAuditEvent,
} = proxyActivities<
  Pick<
    typeof activities,
    | "getRequestContext"
    | "evaluateEligibility"
    | "createApprovalInstancesFromTemplate"
    | "persistRequestState"
    | "sendNotification"
    | "createWorkedRecordPlaceholder"
    | "recordAuditEvent"
  >
>({
  startToCloseTimeout: "2 minutes",
});

// -----------------------------------------------------------------------------
// Workflow
// -----------------------------------------------------------------------------

export async function RequestWorkflow(
  input: RequestWorkflowInput
): Promise<RequestWorkflowResult> {
  const { requestId, approvalTemplateId, orgId } = input;

  // Track if employee withdraws while approval is in progress
  let withdrawn = false;
  setHandler(requestWithdrawSignal, () => {
    withdrawn = true;
  });

  // ---------------------------------------------------------------------------
  // Step 1: Load request context (requester, assignment for downstream use)
  // ---------------------------------------------------------------------------
  const ctx = await getRequestContext(requestId);
  const { employeeId, assignmentId } = ctx;

  // ---------------------------------------------------------------------------
  // Step 1b: Notify requester that request was submitted
  // ---------------------------------------------------------------------------
  await sendNotification({
    userId: employeeId,
    orgId,
    type: "request_submitted",
    channel: "email",
    summary: "Your extra duty request has been submitted",
    requestId,
    assignmentId,
  });
  await recordAuditEvent({
    orgId,
    action: "request_submitted",
    entityType: "EmployeeRequest",
    entityId: requestId,
    changes: { assignmentId },
  });

  // ---------------------------------------------------------------------------
  // Step 2: Evaluate eligibility (conflicts, certs, qualifications)
  // ---------------------------------------------------------------------------
  const eligible = await evaluateEligibility(input);

  if (!eligible) {
    // Mark request ineligible and notify requester
    await persistRequestState(requestId, "INELIGIBLE");
    await recordAuditEvent({
      orgId,
      action: "request_ineligible",
      entityType: "EmployeeRequest",
      entityId: requestId,
    });
    await sendNotification({
      userId: employeeId,
      orgId,
      type: "request_ineligible",
      channel: "email",
      summary: "Your extra duty request was deemed ineligible",
      requestId,
      assignmentId,
    });
    return { requestId, status: "ineligible" };
  }

  // ---------------------------------------------------------------------------
  // Step 3: Create approval runtime records from template (only after eligibility passes)
  // ---------------------------------------------------------------------------
  const approvalContext = await createApprovalInstancesFromTemplate(
    requestId,
    approvalTemplateId,
    orgId
  );

  await persistRequestState(requestId, "PENDING_APPROVAL");

  // Build ApprovalWorkflow input from returned approval context
  const approvalInput = {
    approvalInstanceId: approvalContext.approvalInstanceId,
    requestId,
    templateId: approvalTemplateId,
    orgId,
  };

  // ---------------------------------------------------------------------------
  // Step 4: Start ApprovalWorkflow as child, race vs withdraw signal
  // ---------------------------------------------------------------------------
  type ApprovalOutcome =
    | { type: "approval"; result: ApprovalWorkflowResult }
    | { type: "withdrawn" };

  const approvalScope = new CancellationScope({ cancellable: true });
  const approvalPromise = approvalScope.run(async (): Promise<ApprovalOutcome> => {
    const approvalHandle = await startChild(ApprovalWorkflow, {
      args: [approvalInput],
      workflowId: `approval-${approvalContext.approvalInstanceId}`,
    });
    const result = await approvalHandle.result();
    return { type: "approval" as const, result };
  });

  const outcome: ApprovalOutcome = await Promise.race([
    approvalPromise,
    condition(() => withdrawn).then(() => ({ type: "withdrawn" as const })),
  ]);

  if (outcome.type === "withdrawn") {
    approvalScope.cancel();
    await persistRequestState(requestId, "WITHDRAWN");
    await recordAuditEvent({
      orgId,
      action: "request_withdrawn",
      entityType: "EmployeeRequest",
      entityId: requestId,
    });
    await sendNotification({
      userId: employeeId,
      orgId,
      type: "request_withdrawn",
      channel: "email",
      summary: "Your extra duty request has been withdrawn",
      requestId,
      assignmentId,
    });
    return { requestId, status: "withdrawn" };
  }

  // ---------------------------------------------------------------------------
  // Step 5: Handle approval result - APPROVED or REJECTED
  // ---------------------------------------------------------------------------
  const { result } = outcome;

  if (result.status === "approved") {
    await persistRequestState(requestId, "APPROVED");
    await recordAuditEvent({
      orgId,
      action: "request_approved",
      entityType: "EmployeeRequest",
      entityId: requestId,
    });
    await createWorkedRecordPlaceholder(requestId, assignmentId, employeeId, orgId);
    await sendNotification({
      userId: employeeId,
      orgId,
      type: "request_approved",
      channel: "email",
      summary: "Your extra duty request has been approved",
      requestId,
      assignmentId,
    });
    return { requestId, status: "approved" };
  }

  await persistRequestState(requestId, "REJECTED");
  await recordAuditEvent({
    orgId,
    action: "request_rejected",
    entityType: "EmployeeRequest",
    entityId: requestId,
  });
  await sendNotification({
    userId: employeeId,
    orgId,
    type: "request_rejected",
    channel: "email",
    summary: "Your extra duty request was rejected",
    requestId,
    assignmentId,
  });
  return { requestId, status: "rejected" };
}
