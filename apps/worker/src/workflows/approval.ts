/**
 * ApprovalWorkflow - Multi-step approval for a request
 *
 * OWNS:
 * - Walking the approval step chain (from ApprovalWorkflowTemplate)
 * - Waiting for human approve/reject/delegate at each step
 * - Single reminder (v1) while waiting
 * - Updating ApprovalInstance via activities
 *
 * Delegates to activities:
 * - loadApprovalContext, resolveApprover, persistApprovalDecision
 * - delegateApproval, sendNotification, recordAuditEvent
 *
 * Must remain deterministic: only proxyActivities, defineSignal, setHandler, condition, sleep.
 */

import {
  defineSignal,
  setHandler,
  condition,
  sleep,
  proxyActivities,
} from "@temporalio/workflow";
import type { activities } from "../activities/index.js";
import type {
  ApprovalApprovePayload,
  ApprovalDelegatePayload,
  ApprovalRejectPayload,
  ApprovalWorkflowInput,
  ApprovalWorkflowResult,
} from "../lib/types.js";

// -----------------------------------------------------------------------------
// Signals: approve, reject, delegate
// -----------------------------------------------------------------------------

export const approvalApproveSignal = defineSignal<[ApprovalApprovePayload?]>(
  "approval-approve"
);
export const approvalRejectSignal = defineSignal<[ApprovalRejectPayload?]>(
  "approval-reject"
);
export const approvalDelegateSignal = defineSignal<[ApprovalDelegatePayload]>(
  "approval-delegate"
);

// -----------------------------------------------------------------------------
// Activities
// -----------------------------------------------------------------------------

const {
  loadApprovalContext,
  resolveApprover,
  persistApprovalDecision,
  delegateApproval,
  sendNotification,
  recordAuditEvent,
  getReminderThresholdMs,
} = proxyActivities<
  Pick<
    typeof activities,
    | "loadApprovalContext"
    | "resolveApprover"
    | "persistApprovalDecision"
    | "delegateApproval"
    | "sendNotification"
    | "recordAuditEvent"
    | "getReminderThresholdMs"
  >
>({
  startToCloseTimeout: "2 minutes",
});

/** Decision from approver (set by signal handlers) */
type ApprovalDecision =
  | { type: "approve"; note?: string }
  | { type: "reject"; note?: string }
  | { type: "delegate"; delegatedToUserId: string };

// -----------------------------------------------------------------------------
// Workflow
// -----------------------------------------------------------------------------

export async function ApprovalWorkflow(
  input: ApprovalWorkflowInput
): Promise<ApprovalWorkflowResult> {
  const { approvalInstanceId, requestId, templateId, orgId } = input;

  const reminderThresholdMs = await getReminderThresholdMs();

  // Shared decision state - signal handlers set this
  let decision: ApprovalDecision | null = null;

  setHandler(approvalApproveSignal, (payload?: ApprovalApprovePayload) => {
    decision = { type: "approve", note: payload?.note };
  });
  setHandler(approvalRejectSignal, (payload?: ApprovalRejectPayload) => {
    decision = { type: "reject", note: payload?.note };
  });
  setHandler(approvalDelegateSignal, (payload: ApprovalDelegatePayload) => {
    decision = { type: "delegate", delegatedToUserId: payload.delegatedToUserId };
  });

  // ---------------------------------------------------------------------------
  // Outer loop: process each approval step
  // ---------------------------------------------------------------------------
  while (true) {
    decision = null;

    // Step 1: Load approval context (steps, current step, assigned approver if delegated)
    const ctx = await loadApprovalContext(input);

    // No more steps -> fully approved
    const maxStepOrder = ctx.steps.length
      ? Math.max(...ctx.steps.map((s) => s.stepOrder))
      : 0;
    if (
      ctx.steps.length === 0 ||
      ctx.currentStepOrder > maxStepOrder
    ) {
      return { approvalInstanceId, status: "approved" };
    }

    const currentStep = ctx.steps.find(
      (s: { stepOrder: number }) => s.stepOrder === ctx.currentStepOrder
    );
    if (!currentStep) {
      return { approvalInstanceId, status: "approved" };
    }

    // Step 2: Resolve approver (use delegated assignee if set)
    let approverId = await resolveApprover(
      approvalInstanceId,
      ctx.currentStepOrder,
      templateId,
      orgId,
      ctx.currentStepAssignedApproverId
    );

    if (!approverId) {
      // No approver for step -> skip
      await persistApprovalDecision(
        approvalInstanceId,
        ctx.currentStepOrder,
        "APPROVED",
        "system",
        "Step skipped - no approver"
      );
      continue;
    }

    // ---------------------------------------------------------------------------
    // Inner loop: wait for decision from current approver (handles re-delegation)
    // ---------------------------------------------------------------------------
    let stepComplete = false;
    let isDelegationNotify = false;
    while (!stepComplete) {
      decision = null;

      // Notify approver (approval_assigned or approval_delegated_to after delegation)
      await sendNotification({
        userId: approverId,
        orgId,
        type: isDelegationNotify ? "approval_delegated_to" : "approval_request",
        channel: "email",
        summary: isDelegationNotify
          ? "An extra duty request was delegated to you for approval"
          : "Extra duty request pending your approval",
        requestId,
      });
      await recordAuditEvent({
        orgId,
        action: "approval_assigned",
        entityType: "ApprovalInstance",
        entityId: approvalInstanceId,
        changes: { stepOrder: ctx.currentStepOrder, approverId },
      });

      // Wait for decision - race signals vs reminder
      const reminderOrDecision = await Promise.race([
        condition(() => decision !== null).then(() => ({ type: "decision" as const })),
        sleep(reminderThresholdMs).then(() => ({ type: "reminder" as const })),
      ]);

      if (reminderOrDecision.type === "reminder") {
        await sendNotification({
          userId: approverId,
          orgId,
          type: "approval_reminder",
          channel: "email",
          summary: "Reminder: Extra duty request pending your approval",
          requestId,
        });
        await condition(() => decision !== null);
      }

      const currentDecision = decision!;

      if (currentDecision.type === "approve") {
        await persistApprovalDecision(
          approvalInstanceId,
          ctx.currentStepOrder,
          "APPROVED",
          approverId,
          currentDecision.note
        );
        await recordAuditEvent({
          orgId,
          actorId: approverId,
          action: "approval_step_approved",
          entityType: "ApprovalInstance",
          entityId: approvalInstanceId,
          changes: { stepOrder: ctx.currentStepOrder, note: currentDecision.note },
        });
        stepComplete = true;
        continue;
      }

      if (currentDecision.type === "reject") {
        await persistApprovalDecision(
          approvalInstanceId,
          ctx.currentStepOrder,
          "REJECTED",
          approverId,
          currentDecision.note
        );
        await recordAuditEvent({
          orgId,
          actorId: approverId,
          action: "approval_step_rejected",
          entityType: "ApprovalInstance",
          entityId: approvalInstanceId,
          changes: { stepOrder: ctx.currentStepOrder, note: currentDecision.note },
        });
        return { approvalInstanceId, status: "rejected" };
      }

      // Delegate: reassign, notify new approver, wait again
      await delegateApproval(
        approvalInstanceId,
        ctx.currentStepOrder,
        currentDecision.delegatedToUserId
      );
      await recordAuditEvent({
        orgId,
        actorId: approverId,
        action: "approval_delegated",
        entityType: "ApprovalInstance",
        entityId: approvalInstanceId,
        changes: {
          stepOrder: ctx.currentStepOrder,
          delegatedToUserId: currentDecision.delegatedToUserId,
        },
      });
      approverId = currentDecision.delegatedToUserId;
      isDelegationNotify = true;
      // Loop continues - notify new approver on next iteration
    }
  }
}
