# EDM Local Run Guide

End-to-end validation for the Extra Duty Management workflow.

## A. Local Run Commands

Run these in separate terminals (or use a process manager).

### 1. Start infrastructure (Docker)

```bash
docker compose up -d
```

This starts:
- **Postgres** on `localhost:5432` (user: edm, password: edm, db: edm)
- **Temporal** on `localhost:7233`
- **Temporal UI** on `http://localhost:8080`

### 2. Set environment

```bash
export DATABASE_URL="postgresql://edm:edm@localhost:5432/edm"
```

### 3. Push schema & seed data

```bash
npm run db:seed -w packages/shared
```

### 4. Start API

```bash
DATABASE_URL="postgresql://edm:edm@localhost:5432/edm" npm run dev:api
```

API runs at `http://localhost:3001`.

### 5. Start worker

```bash
DATABASE_URL="postgresql://edm:edm@localhost:5432/edm" EDM_REMINDER_THRESHOLD_MS=30000 npm run dev:worker
```

Optional: `EDM_REMINDER_THRESHOLD_MS=30000` (30 seconds) for reminder testing. Omit for 24h default.

### 6. Start web

```bash
npm run dev:web
```

Web runs at `http://localhost:3000`.

---

## B. Demo Users

For demo flow, use the **View as:** switcher in the nav to change roles. No auth required.

| Role      | ID     | Email                |
|-----------|--------|----------------------|
| Employee  | user-1 | demo@example.com     |
| Approver  | user-2 | manager@example.com  |
| Delegatee | user-3 | delegatee@example.com |

See [DEMO.md](./DEMO.md) for the full demo script.

## C. Seed Data

The seed creates:

| Type      | ID      | Description                    |
|-----------|---------|--------------------------------|
| Org       | org-1   | Test organization              |
| Employee  | user-1  | Demo User (matches mock auth)  |
| Manager   | user-2  | Manager User (approver)        |
| Template  | tpl-1   | Standard Approval (1 step)     |
| Step      | step-1  | Manager approval step          |
| Assignment| asn-1   | Weekend Shift - Main Campus (OPEN) |
| Delegatee | user-3  | Delegatee User (for delegation tests) |

The approval step uses `approverConfig: { defaultApproverId: "user-2" }` so the manager receives the approval task.

### Reminder (local dev)

Set a short reminder interval for testing:

```bash
export EDM_REMINDER_THRESHOLD_MS=30000   # 30 seconds (default: 24h)
```

Start the worker with this env var to test reminder notifications.

---

## D. Happy-Path Test Plan

### 1. Employee sees open assignment

- Open http://localhost:3000/assignments
- You should see **Weekend Shift - Main Campus** (asn-1)
- Click **View / Request**

### 2. Employee creates and submits request

- On the assignment detail page (`/assignments/asn-1`), add a note (optional)
- Select template **Standard Approval** from the dropdown
- Click **Create & Submit Request**
- You should be redirected to the request detail page

### 3. Approval appears in pending approvals

- Open http://localhost:3000/approvals
- You should see the request pending approval (ApprovalInstance is org-wide)

### 4. Approver approves

- On `/approvals`, click **Approve** on the pending request
- The workflow receives the signal and completes

### 5. Request detail shows approved timeline

- Open http://localhost:3000/requests (My Requests)
- Open the request
- The status should be **APPROVED** and the timeline should show the approval step

### 6. Worked record exists

```bash
curl http://localhost:3001/api/debug/worked-records
```

Expect a `WorkedRecord` for the completed request.

### 7. Audit events and notification logs

```bash
curl http://localhost:3001/api/debug/audit-events
curl http://localhost:3001/api/debug/notification-logs
```

Expect `request_created`, `request_submitted`, `request_approved`, `approval_assigned`, `approval_step_approved`, etc.

---

## E. Verification Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/debug/worked-records` | List recent WorkedRecords |
| `GET /api/debug/notification-logs` | List recent NotificationLog entries |
| `GET /api/debug/audit-events` | List recent AuditEvents (optional: `?entityType=X&entityId=Y`) |

---

## F. Non-Happy-Path Scenario Tests

### Delegation

1. Create and submit a request (happy-path steps 1–2).
2. Go to `/approvals`, find the pending approval.
3. Click **Delegate**, enter `user-3` in the User ID field, click **Send**.
4. The approval is reassigned to user-3. The same card stays in the list (approval still pending).
5. Click **Approve** (as any user – the signal is accepted).
6. Verify: request detail shows DELEGATED in the timeline; audit events include `approval_delegated` and `approval_assigned`; notification logs include `approval_delegated_to` and `approval_request`.

### Reminder

1. Create and submit a request.
2. Start the worker with `EDM_REMINDER_THRESHOLD_MS=30000` (30 seconds).
3. Do **not** approve. Wait ~30 seconds.
4. Check notification logs: `curl http://localhost:3001/api/debug/notification-logs`
5. Expect `approval_reminder` type for the approver.
6. Then approve to complete the flow.

### Withdraw while pending

1. Create and submit a request.
2. Go to the request detail page (`/requests/<id>`).
3. Click **Withdraw Request**.
4. Status should change to **WITHDRAWN**.
5. Verify: amber notice “Request withdrawn” appears; audit events include `request_withdrawn`; notification logs include `request_withdrawn`; approval no longer appears in `/approvals` (workflow cancelled).

---

## Troubleshooting

- **Assignments list empty**: Ensure seed ran and assignment `asn-1` has status OPEN.
- **No approval template in dropdown**: Seed creates `tpl-1` for org-1; ensure API uses org-1.
- **Workflow not advancing**: Ensure the worker is running and connected to Temporal.
- **Temporal connection refused**: Ensure `docker compose up` has completed and Temporal is healthy on port 7233.
