# EDM Next Steps

Realistic extensions aligned with the current architecture.

---

## 1. Recommendation / Ranking Layer

**What**: Use prior requests, qualifications, and fairness heuristics to rank or recommend assignments for an employee.

**Why**: Helps employees find the right opportunities and improves distribution of extra duty.

**How it fits**: Non-governing. Recommendations feed into the UI; the employee still chooses and submits. The request workflow is unchanged. Could be a separate service or API called before assignment display.

---

## 2. Conversational Agent UI

**What**: Natural-language intake—employee describes what they want; an AI agent structures it into a request (assignment, note, template).

**Why**: Lower friction for submission; useful for mobile or voice.

**How it fits**: AI proposes; human confirms. The agent outputs a structured request (assignmentId, note, templateId); the same create/submit API is used. Approval and eligibility remain deterministic. The agent is an alternative UI to the form.

---

## 3. Terminal Integration

**What**: Integration with hardware terminals or kiosks for clock-in/out and assignment selection.

**Why**: Matches how some extra duty is claimed (e.g., on-site before a shift).

**How it fits**: The terminal becomes another client. It calls the same APIs: list assignments, create request, submit. The workflow is unchanged. May require device auth and a simplified UI. The edm-spec mentions “future readiness for hardware terminal integration.”

---

## 4. Budget and Fairness Optimization

**What**: Visibility into spend and hours per person; caps, alerts, and simple fairness rules (e.g., limits per employee).

**Why**: Prevents over-allocation and supports equitable distribution.

**How it fits**: Eligibility checks can enforce caps. A new activity or service can evaluate “hours this period” or “budget remaining” before approval. The workflow stays the same; eligibility becomes richer. No AI required—rules stay deterministic.

---

## 5. TCP Integration

**What**: Integration with Time and Attendance / TCP (Time Collection Platform) systems for exporting worked records.

**Why**: Payroll and time systems need reliable feeds of who worked what.

**How it fits**: The ExportWorkflow in the spec already targets “export who worked what” and “payroll export batches.” The worked record exists; the next step is formatting and sending to TCP (API, file export, or event). A new worker or cron job can run exports periodically.

---

## Prioritization Notes

- **Conversational agent** and **recommendation layer** add the most user-facing value and align with AI strategy; both are additive to the current workflow.
- **Terminal integration** and **TCP integration** extend the existing execution model without changing core orchestration.
- **Budget and fairness** strengthens compliance and is a natural extension of the eligibility layer.

All of these assume the current stack (Temporal, PostgreSQL, Express, Next.js) and the principle that AI assists but does not govern approvals or eligibility.
