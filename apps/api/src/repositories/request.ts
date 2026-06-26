import { RequestStatus, RequestType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const requestRepository = {
  async create(data: {
    orgId: string;
    employeeId: string;
    assignmentId: string;
    requestType?: RequestType;
    note?: string;
    status?: RequestStatus;
  }) {
    return prisma.employeeRequest.create({
      data: {
        orgId: data.orgId,
        employeeId: data.employeeId,
        assignmentId: data.assignmentId,
        requestType: data.requestType ?? "EXTRA_DUTY",
        note: data.note,
        status: data.status ?? "DRAFT",
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        assignment: { select: { id: true, title: true } },
      },
    });
  },

  async findByEmployee(employeeId: string, orgId: string) {
    return prisma.employeeRequest.findMany({
      where: { employeeId, orgId },
      include: {
        assignment: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.employeeRequest.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        assignment: { select: { id: true, title: true } },
        approvalInstance: true,
      },
    });
  },

  async findByIdForDetail(id: string) {
    return prisma.employeeRequest.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            scheduledAt: true,
            payType: true,
            payAmount: true,
            status: true,
          },
        },
        eligibilityEvaluations: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        approvalInstance: {
          include: {
            template: {
              include: {
                stepTemplates: { orderBy: { stepOrder: "asc" } },
              },
            },
          },
        },
      },
    });
  },

  async updateStatus(id: string, status: RequestStatus) {
    return prisma.employeeRequest.update({
      where: { id },
      data: { status },
    });
  },

  async updateWorkflowIds(id: string, workflowId: string, runId: string) {
    return prisma.employeeRequest.update({
      where: { id },
      data: { workflowId, runId },
    });
  },
};
