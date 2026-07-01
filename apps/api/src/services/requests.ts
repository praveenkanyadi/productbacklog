import { RequestStatus } from "@prisma/client";
import { requestRepository } from "../repositories/request.js";
import { auditRepository } from "../repositories/audit.js";
import { prisma } from "../lib/prisma.js";
import { getTemporalClient, workflows, signals, TASK_QUEUE } from "../lib/temporal.js";
import type { CreateRequestInput } from "../schemas/requests.js";
type RequestWorkflowInput = Record<string, unknown>;

/** Step in approval timeline (shaped for API) */
export interface ApprovalTimelineStep {
  stepOrder: number;
  label: string;
  status: string;
  approverName?: string;
  actedAt?: string;
  note?: string;
}

/** Request detail DTO */
export interface RequestDetailDto {
  id: string;
  status: string;
  note: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  employee: { id: string; name: string; email: string };
  assignment: {
    id: string;
    title: string;
    location: string | null;
    scheduledAt: string;
    payType: string;
    payAmount: string;
    status: string;
  };
  eligibility: { eligible: boolean; reason: string | null } | null;
  approvalTimeline: ApprovalTimelineStep[];
  auditEvents: { action: string; actorName: string | null; createdAt: string }[];
}

function buildApprovalTimeline(
  approvalInstance: {
    currentStepOrder: number;
    currentStepStatus: string;
    stepsHistory: unknown;
    template?: {
      stepTemplates: { stepOrder: number; approverRole: string | null }[];
    };
  } | null,
  approverNames: Map<string, string>
): ApprovalTimelineStep[] {
  if (!approvalInstance?.template?.stepTemplates?.length) {
    if (!approvalInstance) return [];
    const stepsHistory = parseStepsHistory(approvalInstance.stepsHistory);
    if (stepsHistory.length === 0) {
      return [
        {
          stepOrder: approvalInstance.currentStepOrder,
          label: `Step ${approvalInstance.currentStepOrder}`,
          status: approvalInstance.currentStepStatus,
        },
      ];
    }
    return stepsHistory.map((s) => ({
      stepOrder: s.stepOrder,
      label: `Step ${s.stepOrder}`,
      status: s.status,
      approverName: s.approverId ? approverNames.get(s.approverId) ?? undefined : undefined,
      actedAt: s.completedAt,
      note: s.note,
    }));
  }

  const steps = approvalInstance.template.stepTemplates;
  const stepsHistory = parseStepsHistory(approvalInstance.stepsHistory);
  const historyByStep = new Map(
    stepsHistory.map((s) => [s.stepOrder, s])
  );
  const { currentStepOrder, currentStepStatus } = approvalInstance;

  return steps.map((t) => {
    const h = historyByStep.get(t.stepOrder);
    if (h) {
      return {
        stepOrder: t.stepOrder,
        label: t.approverRole ?? `Step ${t.stepOrder}`,
        status: h.status,
        approverName: h.approverId ? approverNames.get(h.approverId) ?? undefined : undefined,
        actedAt: h.completedAt,
        note: h.note,
      };
    }
    let status: string;
    if (t.stepOrder < currentStepOrder) {
      status = "APPROVED";
    } else if (t.stepOrder === currentStepOrder) {
      status = currentStepStatus;
    } else {
      status = "PENDING";
    }
    return {
      stepOrder: t.stepOrder,
      label: t.approverRole ?? `Step ${t.stepOrder}`,
      status,
    };
  });
}

function parseStepsHistory(
  raw: unknown
): { stepOrder: number; status: string; approverId?: string; completedAt?: string; note?: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => x && typeof x === "object")
    .map((x) => ({
      stepOrder: Number(x.stepOrder) || 0,
      status: String(x.status ?? ""),
      approverId: typeof x.approverId === "string" ? x.approverId : undefined,
      completedAt: typeof x.completedAt === "string" ? x.completedAt : x.completedAt instanceof Date ? x.completedAt.toISOString() : undefined,
      note: typeof x.note === "string" ? x.note : undefined,
    }))
    .filter((x) => x.stepOrder >= 0 && x.status);
}

export const requestService = {
  async create(input: CreateRequestInput, actorId?: string) {
    const request = await requestRepository.create({
      orgId: input.orgId,
      employeeId: input.employeeId,
      assignmentId: input.assignmentId,
      requestType: input.requestType,
      note: input.note,
      status: "DRAFT",
    });

    await auditRepository.create({
      orgId: input.orgId,
      actorId,
      action: "request_created",
      entityType: "EmployeeRequest",
      entityId: request.id,
      changes: { assignmentId: input.assignmentId },
    });

    return request;
  },

  async listByEmployee(employeeId: string, orgId: string) {
    return requestRepository.findByEmployee(employeeId, orgId);
  },

  async getById(id: string) {
    const request = await requestRepository.findById(id);
    if (!request) return null;
    return request;
  },

  async getDetailById(id: string): Promise<RequestDetailDto | null> {
    const request = await requestRepository.findByIdForDetail(id);
    if (!request) return null;

    const approverIds = new Set<string>();
    const ai = request.approvalInstance;
    if (ai?.stepsHistory && Array.isArray(ai.stepsHistory)) {
      for (const s of ai.stepsHistory as { approverId?: string }[]) {
        if (typeof s?.approverId === "string" && s.approverId !== "system") {
          approverIds.add(s.approverId);
        }
      }
    }
    const approverNames = new Map<string, string>();
    if (approverIds.size > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: [...approverIds] } },
        select: { id: true, name: true },
      });
      for (const u of users) approverNames.set(u.id, u.name);
    }

    const [requestAudit, approvalAudit] = await Promise.all([
      auditRepository.findByEntity("EmployeeRequest", id, 20),
      ai?.id
        ? auditRepository.findByEntity("ApprovalInstance", ai.id, 20)
        : Promise.resolve([]),
    ]);
    const auditEvents = [...requestAudit, ...approvalAudit].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    ).slice(0, 20);

    const latestEval = request.eligibilityEvaluations[0];
    const eligibility = latestEval
      ? { eligible: latestEval.eligible, reason: latestEval.reason }
      : null;

    const approvalTimeline = buildApprovalTimeline(
      ai
        ? {
            currentStepOrder: ai.currentStepOrder,
            currentStepStatus: ai.currentStepStatus,
            stepsHistory: ai.stepsHistory,
            template: ai.template
              ? {
                  stepTemplates: ai.template.stepTemplates.map((s) => ({
                    stepOrder: s.stepOrder,
                    approverRole: s.approverRole,
                  })),
                }
              : undefined,
          }
        : null,
      approverNames
    );

    const rejectedStep = approvalTimeline.find((s) => s.status === "REJECTED");
    const rejectionReason = request.status === "REJECTED" && rejectedStep?.note
      ? rejectedStep.note
      : null;

    return {
      id: request.id,
      status: request.status,
      note: request.note,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      employee: request.employee,
      assignment: {
        id: request.assignment.id,
        title: request.assignment.title,
        location: request.assignment.location,
        scheduledAt: request.assignment.scheduledAt.toISOString(),
        payType: request.assignment.payType,
        payAmount: String(request.assignment.payAmount),
        status: request.assignment.status,
      },
      eligibility,
      rejectionReason: rejectionReason ?? undefined,
      approvalTimeline,
      auditEvents: auditEvents.map((e) => ({
        action: e.action,
        actorName: e.actor?.name ?? null,
        createdAt: e.createdAt.toISOString(),
        entityType: e.entityType,
      })),
    };
  },

  async submit(id: string, approvalTemplateId: string, initiatedByUserId?: string) {
    const request = await requestRepository.findById(id);
    if (!request) return null;

    if (request.status !== "DRAFT") {
      return { request, alreadySubmitted: true };
    }

    await requestRepository.updateStatus(id, RequestStatus.SUBMITTED);

    const client = await getTemporalClient();
    const workflowId = `request-${id}`;
    const workflowInput: RequestWorkflowInput = {
      requestId: id,
      approvalTemplateId,
      orgId: request.orgId,
      initiatedByUserId: initiatedByUserId ?? request.employeeId,
    };
    const handle = await client.workflow.start(workflows.RequestWorkflow, {
      workflowId,
      taskQueue: TASK_QUEUE,
      args: [workflowInput],
    });

    const runId = "firstExecutionRunId" in handle ? handle.firstExecutionRunId : undefined;
    if (runId) {
      await requestRepository.updateWorkflowIds(id, workflowId, runId);
    }

    return { request: await requestRepository.findById(id), alreadySubmitted: false };
  },

  async withdraw(id: string): Promise<
    | { request: Awaited<ReturnType<typeof requestRepository.findById>>; notWithdrawable?: false }
    | { notWithdrawable: true; reason: string }
    | null
  > {
    const request = await requestRepository.findById(id);
    if (!request) return null;

    if (request.status !== "PENDING_APPROVAL") {
      return {
        notWithdrawable: true,
        reason: `Request cannot be withdrawn (status: ${request.status})`,
      };
    }

    if (!request.workflowId) {
      return {
        notWithdrawable: true,
        reason: "Request has no active workflow",
      };
    }

    const client = await getTemporalClient();
    const handle = client.workflow.getHandle(request.workflowId);
    await handle.signal(signals.requestWithdraw);

    return { request: await requestRepository.findById(id) };
  },
};
