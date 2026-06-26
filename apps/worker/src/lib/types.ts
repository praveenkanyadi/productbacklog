/**
 * Shared types for workflows and activities.
 * Keeps workflow code deterministic by using only serializable payloads.
 * Source: docs/edm-spec.md, packages/shared/prisma/schema.prisma
 */

// -----------------------------------------------------------------------------
// Request Workflow
// -----------------------------------------------------------------------------

/**
 * Thin workflow input - API must pass only these fields.
 * employeeId, assignmentId, approvalInstanceId, templateId must NOT be workflow input.
 * Those come from getRequestContext(requestId) and createApprovalInstancesFromTemplate().
 */
export interface RequestWorkflowInput {
  requestId: string;
  approvalTemplateId: string;
  orgId: string;
  initiatedByUserId: string;
}

export interface RequestWorkflowResult {
  requestId: string;
  status: "approved" | "rejected" | "ineligible" | "withdrawn";
}

/** Returned by getRequestContext - requester, assignment, fields for notifications and worked record */
export interface RequestContext {
  employeeId: string;
  assignmentId: string;
}

/** Returned by createApprovalInstancesFromTemplate - approval context for ApprovalWorkflow */
export interface ApprovalContext {
  approvalInstanceId: string;
}

// -----------------------------------------------------------------------------
// Approval Workflow
// -----------------------------------------------------------------------------

export interface ApprovalWorkflowInput {
  approvalInstanceId: string;
  requestId: string;
  templateId: string;
  orgId: string;
}

export interface ApprovalWorkflowResult {
  approvalInstanceId: string;
  status: "approved" | "rejected";
}

/** Step info from approval template */
export interface ApprovalStepInfo {
  stepOrder: number;
  approverRole?: string;
}

/** Returned by loadApprovalContext - steps, current state, assigned approver (if delegated) */
export interface LoadedApprovalContext {
  steps: ApprovalStepInfo[];
  currentStepOrder: number;
  currentStepAssignedApproverId?: string;
}

/** Signal payloads for approval decisions */
export interface ApprovalApprovePayload {
  note?: string;
}

export interface ApprovalRejectPayload {
  note?: string;
}

export interface ApprovalDelegatePayload {
  delegatedToUserId: string;
}

// -----------------------------------------------------------------------------
// Assignment Workflow
// -----------------------------------------------------------------------------

export interface AssignmentWorkflowInput {
  assignmentId: string;
  orgId: string;
}

export interface AssignmentWorkflowResult {
  assignmentId: string;
  status: string;
}

// -----------------------------------------------------------------------------
// Export Workflow
// -----------------------------------------------------------------------------

export interface ExportWorkflowInput {
  orgId: string;
  startDate: string;
  endDate: string;
}

export interface ExportWorkflowResult {
  exportId: string;
  recordCount: number;
}
