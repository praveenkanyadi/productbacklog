import { ApprovalStepStatus, RequestStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const approvalRepository = {
  async findPendingForOrg(orgId: string, _userId?: string) {
    const where = {
      orgId,
      currentStepStatus: ApprovalStepStatus.PENDING,
      request: { status: RequestStatus.PENDING_APPROVAL },
    };
    return prisma.approvalInstance.findMany({
      where,
      include: {
        request: {
          include: {
            employee: { select: { id: true, name: true } },
            assignment: { select: { id: true, title: true } },
          },
        },
        template: true,
      },
    });
  },

  async findById(id: string) {
    return prisma.approvalInstance.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            employee: { select: { id: true, name: true } },
            assignment: { select: { id: true, title: true } },
          },
        },
      },
    });
  },

  async findByRequestId(requestId: string) {
    return prisma.approvalInstance.findUnique({
      where: { requestId },
    });
  },
};
