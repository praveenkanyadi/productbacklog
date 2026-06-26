# EDM Product Positioning

## Product Positioning

Extra Duty Management (EDM) is a standalone workflow system for employee-initiated extra duty requests and approvals. Unlike forms-based tools, EDM uses durable workflow orchestration—Temporal—so that requests move through multi-step approvals, delegation, reminders, and audit without manual handoffs or lost state. Business rules (eligibility, approval chains, conflict checks) are deterministic and auditable. AI is used to assist—conversational intake, explanations, recommendations—but never to make final approval, eligibility, or compliance decisions.

## Target User / Buyer

- **Primary**: Operations leads, payroll admins, HR ops in shift-based organizations (healthcare, public safety, hospitality, logistics).
- **Secondary**: Managers who approve extra duty and need delegation, reminders, and visibility into pending work.

## Key Problem Solved

Extra duty is often managed through spreadsheets, email, or ad hoc processes. Requests get lost, approvals stall, delegation is unclear, and there is no reliable record of who approved what. Organizations need a system that routes requests through the right approval chain, surfaces pending work, supports delegation and reminders, and maintains a full audit trail for compliance and payroll.

## What Makes This Different

- **Workflow-first**: Uses Temporal for durable orchestration—workflows survive restarts, retries, and failures.
- **Human-in-the-loop**: Approvals, rejections, and delegations are explicit human decisions, not automated.
- **Deterministic compliance**: Eligibility, conflict checks, and approval rules are codified and repeatable.
- **Full audit trail**: Every action—create, submit, approve, delegate, withdraw—is recorded with actor and timestamp.
- **AI as assistant, not decision-maker**: AI can explain, recommend, and streamline intake, but critical decisions remain human.

## Why AI Is Relevant Here

AI fits EDM in assistive, non-governing roles:

- **Conversational intake**: Employees describe what they need in natural language; AI structures it into a request.
- **Explanations**: AI explains eligibility outcomes, rejection reasons, and next steps.
- **Recommendations**: AI can suggest assignments or approvers based on history and fairness.
- **Status lookup**: AI answers “where is my request?” or “what’s pending?” without digging through the UI.

AI does *not* approve, reject, declare eligibility, or make budget decisions. That keeps compliance deterministic and auditable.

## Strategy: Agent + Workflow + Compliance

EDM fits a broader strategy of **agent + workflow + compliance**:

1. **Agent**: An AI layer helps users interact and get guidance.
2. **Workflow**: Temporal orchestrates durable, resumable processes that execute reliably.
3. **Compliance**: Business rules are explicit, deterministic, and auditable.

The execution layer—workflows—is the bridge between AI insights and real outcomes. AI can recommend; the workflow executes and records. This architecture is reusable: same pattern for other domains (time-off, expense approvals, etc.).
