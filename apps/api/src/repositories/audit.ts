import { prisma } from "../lib/prisma.js";

export const auditRepository = {
  async create(data: {
    orgId: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: Record<string, unknown>;
  }) {
    return prisma.auditEvent.create({
      data: {
        orgId: data.orgId,
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes as object | undefined,
      },
    });
  },

  async findByEntity(
    entityType: string,
    entityId: string,
    limit = 20
  ) {
    return prisma.auditEvent.findMany({
      where: { entityType, entityId },
      include: { actor: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
