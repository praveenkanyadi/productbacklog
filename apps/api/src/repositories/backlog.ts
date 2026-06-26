import { prisma } from "../lib/prisma.js";

const ITEM_LIST_INCLUDE = {
  product: { select: { id: true, name: true } },
  productArea: { select: { id: true, name: true } },
  status: { select: { id: true, name: true, color: true } },
  source: { select: { id: true, name: true } },
  targetRelease: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true } },
  initiatives: { include: { initiative: { select: { id: true, name: true, color: true } } } },
} as const;

const ITEM_DETAIL_INCLUDE = {
  ...ITEM_LIST_INCLUDE,
  createdBy: { select: { id: true, name: true } },
  engReviewedBy: { select: { id: true, name: true } },
  rankPublishedBy: { select: { id: true, name: true } },
  activities: {
    orderBy: { createdAt: "desc" as const },
    take: 50,
    include: { actor: { select: { id: true, name: true } } },
  },
} as const;

export interface BacklogListFilters {
  productId?: string;
  productAreaId?: string;
  statusId?: string;
  initiativeId?: string;
  ownerId?: string;
  search?: string;
  roadmapQuarter?: string;
  churnRisk?: string;
  skip?: number;
  take?: number;
  orderBy?: "priorityScore" | "businessPriority" | "createdAt" | "arrRepresented";
  orderDir?: "asc" | "desc";
}

export const backlogRepository = {
  async list(filters: BacklogListFilters = {}) {
    const {
      productId, productAreaId, statusId, initiativeId, ownerId,
      search, roadmapQuarter, churnRisk,
      skip = 0, take = 50,
      orderBy = "businessPriority", orderDir = "asc",
    } = filters;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (productId) where.productId = productId;
    if (productAreaId) where.productAreaId = productAreaId;
    if (statusId) where.statusId = statusId;
    if (ownerId) where.ownerId = ownerId;
    if (roadmapQuarter) where.roadmapQuarter = roadmapQuarter;
    if (churnRisk) where.churnRisk = churnRisk;
    if (search) where.title = { contains: search, mode: "insensitive" };
    if (initiativeId) where.initiatives = { some: { initiativeId } };

    const [items, total] = await Promise.all([
      prisma.backlogItem.findMany({
        where,
        include: ITEM_LIST_INCLUDE,
        orderBy: [
          { [orderBy]: orderDir === "asc" ? "asc" : "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take,
      }),
      prisma.backlogItem.count({ where }),
    ]);

    return { items, total };
  },

  async findById(id: string) {
    return prisma.backlogItem.findUnique({
      where: { id },
      include: ITEM_DETAIL_INCLUDE,
    });
  },

  async create(data: Parameters<typeof prisma.backlogItem.create>[0]["data"]) {
    return prisma.backlogItem.create({
      data,
      include: ITEM_LIST_INCLUDE,
    });
  },

  async update(id: string, data: Parameters<typeof prisma.backlogItem.update>[0]["data"]) {
    return prisma.backlogItem.update({
      where: { id },
      data,
      include: ITEM_LIST_INCLUDE,
    });
  },

  async delete(id: string) {
    return prisma.backlogItem.delete({ where: { id } });
  },

  async setInitiatives(itemId: string, initiativeIds: string[]) {
    await prisma.backlogItemInitiative.deleteMany({ where: { itemId } });
    if (initiativeIds.length > 0) {
      await prisma.backlogItemInitiative.createMany({
        data: initiativeIds.map((initiativeId) => ({ itemId, initiativeId })),
        skipDuplicates: true,
      });
    }
  },

  async bulkUpdateRank(updates: { id: string; businessPriority: number }[]) {
    await Promise.all(
      updates.map(({ id, businessPriority }) =>
        prisma.backlogItem.update({ where: { id }, data: { businessPriority } })
      )
    );
  },

  // Portfolio hierarchy
  async getPortfolio() {
    return prisma.backlogPortfolio.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            productAreas: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
  },

  // Taxonomy
  async getTaxonomy() {
    const [statuses, sources, releases, initiatives] = await Promise.all([
      prisma.backlogStatus.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.backlogSource.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.backlogTargetRelease.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.strategicInitiative.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return { statuses, sources, releases, initiatives };
  },

  // Activity
  async addActivity(data: {
    itemId: string;
    actorId?: string;
    actorName?: string;
    actorRole?: string;
    changeType: string;
    summary: string;
    changes?: unknown;
    comment?: string;
  }) {
    return prisma.backlogActivity.create({ data: { ...data, changes: data.changes as never } });
  },

  async listActivity(filters: { itemId?: string; actorId?: string; changeType?: string } = {}) {
    return prisma.backlogActivity.findMany({
      where: {
        ...(filters.itemId && { itemId: filters.itemId }),
        ...(filters.actorId && { actorId: filters.actorId }),
        ...(filters.changeType && { changeType: filters.changeType }),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        item: { select: { id: true, title: true, productId: true, product: { select: { name: true } } } },
        actor: { select: { id: true, name: true } },
      },
    });
  },

  // Admin - CRUD for taxonomy
  async upsertStatus(data: { id?: string; name: string; color?: string; sortOrder?: number; isDefault?: boolean }) {
    if (data.id) {
      return prisma.backlogStatus.update({ where: { id: data.id }, data });
    }
    return prisma.backlogStatus.create({ data: { name: data.name, color: data.color, sortOrder: data.sortOrder ?? 0, isDefault: data.isDefault ?? false } });
  },

  async upsertSource(data: { id?: string; name: string; sortOrder?: number }) {
    if (data.id) {
      return prisma.backlogSource.update({ where: { id: data.id }, data });
    }
    return prisma.backlogSource.create({ data: { name: data.name, sortOrder: data.sortOrder ?? 0 } });
  },

  async upsertRelease(data: { id?: string; name: string; sortOrder?: number }) {
    if (data.id) {
      return prisma.backlogTargetRelease.update({ where: { id: data.id }, data });
    }
    return prisma.backlogTargetRelease.create({ data: { name: data.name, sortOrder: data.sortOrder ?? 0 } });
  },

  async upsertInitiative(data: { id?: string; name: string; color?: string; sortOrder?: number }) {
    if (data.id) {
      return prisma.strategicInitiative.update({ where: { id: data.id }, data });
    }
    return prisma.strategicInitiative.create({ data: { name: data.name, color: data.color, sortOrder: data.sortOrder ?? 0 } });
  },

  async upsertProduct(data: { id?: string; portfolioId: string; name: string; sortOrder?: number }) {
    if (data.id) {
      return prisma.backlogProduct.update({ where: { id: data.id }, data });
    }
    return prisma.backlogProduct.create({ data: { portfolioId: data.portfolioId, name: data.name, sortOrder: data.sortOrder ?? 0 } });
  },

  async upsertProductArea(data: { id?: string; productId: string; name: string; sortOrder?: number }) {
    if (data.id) {
      return prisma.backlogProductArea.update({ where: { id: data.id }, data });
    }
    return prisma.backlogProductArea.create({ data: { productId: data.productId, name: data.name, sortOrder: data.sortOrder ?? 0 } });
  },

  async deleteProduct(id: string) {
    return prisma.backlogProduct.delete({ where: { id } });
  },

  async deleteProductArea(id: string) {
    return prisma.backlogProductArea.delete({ where: { id } });
  },

  async deleteStatus(id: string) {
    return prisma.backlogStatus.delete({ where: { id } });
  },

  async deleteSource(id: string) {
    return prisma.backlogSource.delete({ where: { id } });
  },

  async deleteRelease(id: string) {
    return prisma.backlogTargetRelease.delete({ where: { id } });
  },

  async deleteInitiative(id: string) {
    return prisma.strategicInitiative.delete({ where: { id } });
  },

  async getConfig(key: string): Promise<string[]> {
    const row = await prisma.backlogConfig.findUnique({ where: { key } });
    return (row?.values as string[]) ?? [];
  },

  async setConfig(key: string, values: string[]) {
    return prisma.backlogConfig.upsert({
      where: { key },
      update: { values },
      create: { key, values },
    });
  },
};
