/**
 * Status styling for badges across the app.
 * Request, assignment, and approval step statuses.
 */

export type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "INELIGIBLE"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN"
  | "CANCELED"
  | "COMPLETED";

export type AssignmentStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "OPEN"
  | "FILLED"
  | "CLOSED"
  | "COMPLETED"
  | "CANCELED";

export type ApprovalStepStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "DELEGATED"
  | "SKIPPED"
  | "TIMED_OUT";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";
export type StatusStyle = { variant: BadgeVariant; label?: string };

export function requestStatusVariant(status: string): StatusStyle {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
      return { variant: "default" };
    case "REJECTED":
    case "INELIGIBLE":
    case "WITHDRAWN":
    case "CANCELED":
      return { variant: "destructive" };
    case "PENDING_APPROVAL":
      return { variant: "secondary", label: "Pending approval" };
    case "SUBMITTED":
      return { variant: "secondary", label: "Submitted" };
    case "DRAFT":
      return { variant: "outline", label: "Draft" };
    default:
      return { variant: "secondary" };
  }
}

export function assignmentStatusVariant(status: string): StatusStyle {
  switch (status) {
    case "OPEN":
      return { variant: "default", label: "Open" };
    case "PUBLISHED":
      return { variant: "secondary", label: "Published" };
    case "FILLED":
      return { variant: "default", label: "Filled" };
    case "CLOSED":
    case "COMPLETED":
      return { variant: "secondary", label: status };
    case "DRAFT":
      return { variant: "outline", label: "Draft" };
    case "CANCELED":
      return { variant: "destructive", label: "Canceled" };
    default:
      return { variant: "secondary" };
  }
}

export function approvalStepStatusVariant(status: string): StatusStyle {
  switch (status) {
    case "APPROVED":
    case "SKIPPED":
      return { variant: "default" };
    case "REJECTED":
    case "INELIGIBLE":
    case "TIMED_OUT":
      return { variant: "destructive" };
    case "DELEGATED":
      return { variant: "secondary", label: "Delegated" };
    case "PENDING":
    default:
      return { variant: "outline", label: "Pending" };
  }
}
