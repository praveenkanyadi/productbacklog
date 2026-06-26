# Extra Duty Management (EDM) Standalone App

## Goal
Build a standalone Extra Duty Management application as an AI-agent-enabled workflow system.

## Core capabilities
- employee-initiated extra duty requests
- manager-created extra duty assignments
- multi-level approvals
- delegate/proxy approvers
- enforced pre-approval and hard conflict blocking
- eligibility checks
- automated notifications and reminders
- audit trail
- reporting/export of who worked what
- future readiness for hardware terminal integration

## Product principles
- This is not just a forms app. It is a workflow and execution system.
- Temporal handles orchestration.
- PostgreSQL stores application state.
- Business rules and compliance checks are deterministic.
- AI is used only for:
  - conversational intake
  - explanations
  - recommendations
  - status lookup
- AI must NOT make final approval, eligibility, budget, or compliance decisions.

## Tech stack
Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend:
- Node.js
- TypeScript
- Express

Workflow orchestration:
- Temporal TypeScript SDK

Database:
- PostgreSQL
- Prisma ORM

Notifications:
- email first
- SMS adapter placeholder

## Roles
- Employee
- Manager
- Approver
- Payroll Admin
- System Admin

## Core workflows
1. RequestWorkflow
- employee submits request
- system evaluates eligibility
- if eligible, route through multi-step approval
- if approved, create worked record placeholder
- notify requester and approvers
- allow withdraw while pending

2. ApprovalWorkflow
- multi-step approval
- approve / reject / delegate
- reminders and escalations
- configurable approver chain

3. AssignmentWorkflow
- create draft assignment
- publish
- open
- fill
- close
- cancel

4. ExportWorkflow
- export who worked what
- payroll export batches

## Assignment states
- DRAFT
- PUBLISHED
- OPEN
- FILLED
- CLOSED
- COMPLETED
- CANCELED

## Request states
- DRAFT
- SUBMITTED
- INELIGIBLE
- PENDING_APPROVAL
- APPROVED
- REJECTED
- WITHDRAWN
- CANCELED
- COMPLETED

## Approval step states
- PENDING
- APPROVED
- REJECTED
- DELEGATED
- SKIPPED
- TIMED_OUT

## Core entities
- User
- Assignment
- AssignmentQualification
- EmployeeRequest
- ApprovalWorkflowTemplate
- ApprovalStepTemplate
- ApprovalInstance
- EligibilityEvaluation
- NotificationLog
- WorkedRecord
- AuditEvent

## API modules
- assignments
- requests
- approvals
- workflow templates
- reports/exports

## UI modules
Employee:
- Open Assignments
- Submit Request
- My Requests
- Request Detail / Timeline

Manager:
- Dashboard
- Create Assignment
- Assignment List
- Team Requests
- Approval Inbox

Admin:
- Workflow Template Editor
- Reports / Exports
- Audit Log Viewer