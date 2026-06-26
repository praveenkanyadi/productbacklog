# EDM Demo Talk Track

Practical scripts and key moments for internal stakeholder demos.

---

## 2-Minute Version

> “EDM is a workflow system for extra duty requests and approvals. The core flow: an employee sees open assignments, submits a request, and it enters an approval workflow. The approver sees it in their inbox, can approve, reject, or delegate. The timeline shows every step; the audit trail records who did what and when. This isn’t a form—it’s durable workflow orchestration with Temporal. AI can layer on top for conversational intake and recommendations, but approvals stay human. I’ll walk through the flow.”

*[Run demo: open assignments → submit request → switch to approver → approve → view timeline → show audit]*

> “That’s the end-to-end loop. Every action is logged. The workflow survives restarts. Delegation and reminders are built in. This is the execution layer that turns insights into outcomes.”

---

## 5-Minute Version

> “EDM solves a common problem: extra duty is often managed through email and spreadsheets. Requests get lost, approvals stall, and there’s no clear audit trail. EDM treats this as a workflow problem, not a forms problem.”

*[Show assignments]*

> “Here are open assignments. An employee selects one, adds a note, chooses an approval template, and submits. The request enters a Temporal workflow—durable orchestration that survives restarts and failures.”

*[Submit request]*

> “Now we switch to the approver. They see the request in their inbox. They can approve, reject, or delegate to someone else. Delegation reassigns the approval without losing context. Reminders can be sent if approvals sit too long.”

*[Approve]*

> “After approval, the request shows a full timeline—who approved, when, and in what order. There’s also an audit trail: every action, with actor and timestamp. That matters for compliance and payroll.”

*[Show audit/notifications]*

> “AI fits in assistive roles: conversational intake, explanations, recommendations. The workflow handles execution; AI doesn’t make approval or eligibility decisions. That keeps things deterministic and auditable. This architecture—agent plus workflow plus compliance—is what we’re building toward.”

---

## Key Moments to Call Out

| Moment | What to say |
|--------|-------------|
| **Before submit** | “The employee is acting as user-1. We use a View-as switcher for the demo; in production this would be real auth.” |
| **After submit** | “The request is now in a Temporal workflow. If the worker crashes, it resumes where it left off.” |
| **Switch to approver** | “We switch to the manager. They see all pending approvals for the org.” |
| **Approve** | “One click sends a signal into the workflow. The workflow updates state and completes.” |
| **Timeline** | “Every step is recorded. You can see who approved, when, and in what order.” |
| **Audit / notifications** | “These are the raw audit events and notification logs. In production these feed compliance reporting and actual email/SMS.” |

---

## What to Say About…

### Workflow Orchestration

> “We use Temporal for orchestration. Workflows are durable—they survive restarts, retries, and failures. The request flow runs as a workflow; the approval flow runs as a workflow. They coordinate via signals and queries. This isn’t request-response; it’s long-running execution.”

### Approvals

> “Approvals are human-in-the-loop. The workflow pauses until someone approves or rejects. The approver chain is configurable per template. We support multi-step approval; today’s demo uses a single step.”

### Delegation

> “If the approver is out, they can delegate to someone else. The workflow reassigns the approval; the delegatee gets the task. The timeline records the delegation. No context is lost.”

### Reminders

> “If an approval sits too long, we send a reminder. The reminder interval is configurable—for local testing we use 30 seconds; in production it might be 24 hours. Reminders are logged and can drive email or SMS.”

### Audit Trail

> “Every significant action—create, submit, approve, reject, delegate, withdraw—is written to an audit table with actor, timestamp, and entity. That gives a full history for compliance, payroll, and dispute resolution.”

### AI Agent Future

> “AI fits in assistive roles: conversational intake so employees can describe what they need in plain language; explanations of eligibility and rejection reasons; recommendations for assignments or approvers. AI does not approve, reject, or declare eligibility. Those decisions stay human and deterministic. The workflow executes; AI helps users get there faster.”
