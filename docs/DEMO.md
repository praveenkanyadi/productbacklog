# EDM Demo Script

Step-by-step script for running the Extra Duty Management demo locally.

## Prerequisites

- Docker running
- Node.js 20+
- See [LOCAL-RUN.md](./LOCAL-RUN.md) for full setup

## Quick Start

### 1. Reset to clean state

```bash
export DATABASE_URL="postgresql://edm:edm@localhost:5432/edm"
npm run demo:reset
```

### 2. Start services (3 terminals)

**Terminal 1 – API**
```bash
DATABASE_URL="postgresql://edm:edm@localhost:5432/edm" npm run dev:api
```

**Terminal 2 – Worker**
```bash
DATABASE_URL="postgresql://edm:edm@localhost:5432/edm" npm run dev:worker
```

**Terminal 3 – Web**
```bash
npm run dev:web
```

### 3. Start infrastructure (if not already running)

```bash
docker compose up -d
```

---

## Demo Flow

### Step 1: Open assignments (as Employee)

1. Go to http://localhost:3000/assignments
2. Ensure **View as: Demo User** (employee) is selected in the nav
3. You should see **Weekend Shift - Main Campus**
4. Click **View / Request**

### Step 2: Create and submit request

1. Add an optional note
2. Select **Standard Approval** from the template dropdown
3. Click **Create & Submit Request**
4. You are redirected to the request detail page

### Step 3: Switch to approver

1. In the nav bar, click **Manager User** (under "View as:")
2. The page reloads – you are now acting as the approver

### Step 4: Approve the request

1. Go to **Pending Approvals** (or http://localhost:3000/approvals)
2. You should see the request you just submitted
3. Click **Approve**
4. The request disappears from the list (approved)

### Step 5: View request detail and timeline

1. Switch back to **Demo User** (employee) in the nav
2. Go to **My Requests**
3. Click the request
4. Status should be **APPROVED**, timeline shows the approval step

### Step 6: Show audit and notifications

Run in a terminal:

```bash
curl http://localhost:3001/api/debug/audit-events
curl http://localhost:3001/api/debug/notification-logs
```

Expect `request_created`, `request_submitted`, `request_approved`, `approval_assigned`, etc.

---

## Demo Checklist

- [ ] Infrastructure running (Docker)
- [ ] Database reset (`npm run demo:reset`)
- [ ] API, Worker, Web all running
- [ ] Employee submits request
- [ ] Switch to approver
- [ ] Approver approves
- [ ] Request detail shows approved status
- [ ] Audit events and notification logs populated

---

## Demo Users

| Role      | ID     | Email              | Use for                    |
|-----------|--------|--------------------|----------------------------|
| Employee  | user-1 | demo@example.com   | Submit requests, view My Requests |
| Approver  | user-2 | manager@example.com| Approve, reject, delegate  |
| Delegatee | user-3 | delegatee@example.com | Delegation tests only  |

**No auth required.** Use the **View as:** links in the nav to switch users. The app uses mock users for demo only.

---

## Known Limitations

- **No real authentication** – demo users are switched via nav; anyone can act as any user
- **Single org** – seed data uses `org-1` only
- **Approvals are org-wide** – approver sees all pending approvals in the org, not filtered by assignment
- **Notifications** – logged to database only; no email/SMS sent

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Assignments empty | Run `npm run demo:reset` |
| No template in dropdown | Ensure seed ran; template `tpl-1` is for org-1 |
| Approval list empty | Ensure worker is running; switch to **Manager User** |
| Workflow not advancing | Check worker is connected to Temporal (port 7233) |
