/**
 * Approval activities
 *
 * OWNS:
 * - Creating approval runtime records from template (after eligibility passes)
 * - Loading approval context (steps, current state)
 * - Resolving approver for a step (by role/config or delegated assignee)
 * - Persisting approval decisions (APPROVED, REJECTED)
 * - Persisting delegation and reassignment
 *
 * Called by: RequestWorkflow, ApprovalWorkflow
 */

import { ApprovalStepStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type {
  ApprovalContext,
  ApprovalWorkflowInput,
  LoadedApprovalContext,
  ApprovalStepInfo,
} from "../lib/types.js";

export interface ApproverInfo {
  approverId: string;
  stepOrder: number;
}

type StepHistoryEntry = {
  stepOrder: number;
  status: string;
  approverId?: string;
  completedAt?: string;
  note?: string;
  delegatedToUserId?: string;
};

/**
 * Create approval runtime records from template.
 * Called by RequestWorkflow after eligibility passes.
 * Returns approval context needed by ApprovalWorkflow.
 */
export async function createApprovalInstancesFromTemplate(
  requestId: string,
  approvalTemplateId: string,
  orgId: string
): Promise<ApprovalContext> {
  const template = await prisma.approvalWorkflowTemplate.findUnique({
    where: { id: approvalTemplateId },
    include: { stepTemplates: { orderBy: { stepOrder: "asc" } } },
  });
  if (!template) throw new Error(`Template not found: ${approvalTemplateId}`);

  const firstStepOrder = template.stepTemplates[0]?.stepOrder ?? 1;

  const instance = await prisma.approvalInstance.create({
    data: {
      orgId,
      requestId,
      templateId: approvalTemplateId,
      currentStepOrder: firstStepOrder,
      currentStepStatus: ApprovalStepStatus.PENDING,
    },
  });
  return { approvalInstanceId: instance.id };
}

/**
 * Load approval steps and current state from ApprovalInstance and template.
 * Returns steps, currentStepOrder, and assignedApproverId (if step was delegated).
 */
export async function loadApprovalContext(
  input: ApprovalWorkflowInput
): Promise<LoadedApprovalContext> {
  const instance = await prisma.approvalInstance.findUnique({
    where: { id: input.approvalInstanceId },
    include: {
      template: {
        include: { stepTemplates: { orderBy: { stepOrder: "asc" } } },
      },
    },
  });
  if (!instance) throw new Error(`ApprovalInstance not found: ${input.approvalInstanceId}`);

  const steps: ApprovalStepInfo[] = instance.template.stepTemplates.map((s) => ({
    stepOrder: s.stepOrder,
    approverRole: s.approverRole ?? undefined,
  }));

  let currentStepAssignedApproverId: string | undefined;
  const history = (instance.stepsHistory as StepHistoryEntry[] | null) ?? [];
  const lastForStep = [...history].reverse().find((h) => h.stepOrder === instance.currentStepOrder);
  if (lastForStep?.status === "DELEGATED" && lastForStep.delegatedToUserId) {
    currentStepAssignedApproverId = lastForStep.delegatedToUserId;
  }

  return {
    steps,
    currentStepOrder: instance.currentStepOrder,
    currentStepAssignedApproverId,
  };
}

/**
 * Resolve the approver for the current step.
 * Uses assignedApproverId if step was delegated, else resolves from approverConfig.defaultApproverId.
 */
export async function resolveApprover(
  approvalInstanceId: string,
  stepOrder: number,
  templateId: string,
  _orgId: string,
  assignedApproverId?: string
): Promise<string | null> {
  if (assignedApproverId) return assignedApproverId;

  const step = await prisma.approvalStepTemplate.findFirst({
    where: { templateId, stepOrder },
  });
  if (!step?.approverConfig || typeof step.approverConfig !== "object") return null;

  const config = step.approverConfig as { defaultApproverId?: string };
  return config.defaultApproverId ?? null;
}

/**
 * Persist approval decision (APPROVED or REJECTED).
 * On APPROVED, advances currentStepOrder. Updates stepsHistory.
 */
export async function persistApprovalDecision(
  approvalInstanceId: string,
  stepOrder: number,
  status: "APPROVED" | "REJECTED",
  approverId: string,
  note?: string
): Promise<void> {
  const instance = await prisma.approvalInstance.findUnique({
    where: { id: approvalInstanceId },
  });
  if (!instance) throw new Error(`ApprovalInstance not found: ${approvalInstanceId}`);

  const history = (instance.stepsHistory as StepHistoryEntry[] | null) ?? [];
  const entry: StepHistoryEntry = {
    stepOrder,
    status,
    approverId,
    completedAt: new Date().toISOString(),
    note,
  };
  const newHistory = [...history, entry];

  const isApproved = status === "APPROVED";
  const template = await prisma.approvalWorkflowTemplate.findUnique({
    where: { id: instance.templateId },
    include: { stepTemplates: { orderBy: { stepOrder: "asc" } } },
  });
  const nextStep = template?.stepTemplates.find((s) => s.stepOrder > stepOrder);
  const nextStepOrder = nextStep?.stepOrder ?? instance.currentStepOrder + 1;

  await prisma.approvalInstance.update({
    where: { id: approvalInstanceId },
    data: {
      stepsHistory: newHistory as object,
      ...(isApproved
        ? {
            currentStepOrder: nextStepOrder,
            currentStepStatus: nextStep ? ApprovalStepStatus.PENDING : ApprovalStepStatus.APPROVED,
          }
        : { currentStepStatus: ApprovalStepStatus.REJECTED }),
    },
  });
}

/**
 * Persist delegation and reassign current step to delegated user.
 */
export async function delegateApproval(
  approvalInstanceId: string,
  stepOrder: number,
  delegatedToUserId: string
): Promise<void> {
  const instance = await prisma.approvalInstance.findUnique({
    where: { id: approvalInstanceId },
  });
  if (!instance) throw new Error(`ApprovalInstance not found: ${approvalInstanceId}`);

  const history = (instance.stepsHistory as StepHistoryEntry[] | null) ?? [];
  const entry: StepHistoryEntry = {
    stepOrder,
    status: "DELEGATED",
    completedAt: new Date().toISOString(),
    delegatedToUserId,
  };
  const newHistory = [...history, entry];

  await prisma.approvalInstance.update({
    where: { id: approvalInstanceId },
    data: {
      stepsHistory: newHistory as object,
      currentStepStatus: ApprovalStepStatus.PENDING,
    },
  });
}

export async function getNextApprover(
  input: ApprovalWorkflowInput
): Promise<ApproverInfo | null> {
  // Placeholder: kept for backward compat; resolveApprover is preferred
  return null;
}

export async function recordApprovalStep(
  approvalInstanceId: string,
  stepOrder: number,
  status: string
): Promise<void> {
  // Placeholder: persistApprovalDecision / delegateApproval are preferred
}
