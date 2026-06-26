import { prisma } from "../lib/prisma.js";

export const approvalTemplateRepository = {
  async list(orgId: string) {
    return prisma.approvalWorkflowTemplate.findMany({
      where: { orgId },
      select: { id: true, name: true },
    });
  },
};
