import { prisma } from "../lib/prisma.js";

export const notificationRepository = {
  async create(data: {
    orgId: string;
    userId: string;
    type: string;
    channel: string;
    status: string;
    requestId?: string;
    assignmentId?: string;
    summary?: string;
  }) {
    return prisma.notificationLog.create({
      data: {
        orgId: data.orgId,
        userId: data.userId,
        type: data.type,
        channel: data.channel,
        status: data.status,
        requestId: data.requestId,
        assignmentId: data.assignmentId,
        summary: data.summary,
      },
    });
  },
};
