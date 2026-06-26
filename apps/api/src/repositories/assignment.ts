import { AssignmentStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const assignmentRepository = {
  async findOpenOrPublished(orgId: string) {
    return prisma.assignment.findMany({
      where: {
        orgId,
        status: { in: [AssignmentStatus.OPEN, AssignmentStatus.PUBLISHED] },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  },

  async findById(id: string) {
    return prisma.assignment.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
  },
};
