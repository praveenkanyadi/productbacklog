import { backlogRepository, type BacklogListFilters } from "../repositories/backlog.js";

// ---------------------------------------------------------------------------
// Priority Score computation (0–100)
// ---------------------------------------------------------------------------
function computePriorityScore(data: {
  arrRepresented?: number | null;
  revenueOpportunity?: number | null;
  churnRisk?: string | null;
  isComplianceRequirement?: boolean;
  isCompetitiveGap?: boolean;
  initiativeCount?: number;
  complexity?: string | null;
}): number {
  let score = 0;

  // ARR at risk: 0–30 pts, scaled to $5M ceiling
  const arr = Number(data.arrRepresented ?? 0);
  score += Math.min(30, Math.round((arr / 5_000_000) * 30));

  // Revenue opportunity: 0–15 pts, scaled to $2M ceiling
  const rev = Number(data.revenueOpportunity ?? 0);
  score += Math.min(15, Math.round((rev / 2_000_000) * 15));

  // Churn risk: 0–20 pts
  const churnMap: Record<string, number> = { Critical: 20, High: 15, "Medium-High": 12, Medium: 8, Low: 4, None: 0 };
  score += churnMap[data.churnRisk ?? ""] ?? 0;

  // Strategic initiatives: 5 pts each, max 15
  score += Math.min(15, (data.initiativeCount ?? 0) * 5);

  // Compliance requirement: 10 pts
  if (data.isComplianceRequirement) score += 10;

  // Competitive gap: 5 pts
  if (data.isCompetitiveGap) score += 5;

  // Complexity penalty (inverted): XS=5, S=4, M=3, L=2, XL=1, unknown=3
  const complexityBonus: Record<string, number> = { XS: 5, S: 4, M: 3, L: 2, XL: 1 };
  score += complexityBonus[data.complexity ?? ""] ?? 0;

  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export const backlogService = {
  async list(filters: BacklogListFilters) {
    return backlogRepository.list(filters);
  },

  async getById(id: string) {
    return backlogRepository.findById(id);
  },

  async create(input: {
    title: string;
    description?: string;
    productId: string;
    productAreaId?: string;
    statusId: string;
    sourceId?: string;
    ownerId?: string;
    actorId?: string;
    actorName?: string;
    actorRole?: string;
    initiativeIds?: string[];
    // Customer Impact
    customersImpacted?: number;
    arrRepresented?: number;
    opportunitiesBlocked?: number;
    churnRisk?: string;
    customerSegment?: string;
    vertical?: string;
    customerQuotes?: unknown;
    supportingEvidence?: string;
    // Business Impact
    revenueOpportunity?: number;
    crossSellOpportunity?: string;
    retentionImpact?: string;
    isComplianceRequirement?: boolean;
    isCompetitiveGap?: boolean;
    customerSatisfaction?: string;
    strategicNotes?: string;
    // Product Assessment
    problemStatement?: string;
    discoveryStatus?: string;
    assumptions?: string;
    successMetrics?: string;
    alternativesConsidered?: string;
    productNotes?: string;
    // Engineering Assessment
    estimatedEffort?: string;
    complexity?: string;
    timelineEstimate?: string;
    technicalDependencies?: string;
    risks?: string;
    architectureNotes?: string;
    confidenceLevel?: string;
    // Planning
    targetReleaseId?: string;
    roadmapQuarter?: string;
  }) {
    const { initiativeIds = [], actorId, actorName, actorRole, ...itemData } = input;

    const priorityScore = computePriorityScore({
      arrRepresented: itemData.arrRepresented,
      revenueOpportunity: itemData.revenueOpportunity,
      churnRisk: itemData.churnRisk,
      isComplianceRequirement: itemData.isComplianceRequirement,
      isCompetitiveGap: itemData.isCompetitiveGap,
      initiativeCount: initiativeIds.length,
      complexity: itemData.complexity,
    });

    const item = await backlogRepository.create({
      ...itemData,
      createdById: actorId,
      priorityScore,
      customerQuotes: itemData.customerQuotes as never,
    });

    await backlogRepository.setInitiatives(item.id, initiativeIds);

    await backlogRepository.addActivity({
      itemId: item.id,
      actorId,
      actorName,
      actorRole,
      changeType: "create",
      summary: `${actorName ?? "Someone"} created this backlog item`,
    });

    return backlogRepository.findById(item.id);
  },

  async update(
    id: string,
    input: Record<string, unknown> & { initiativeIds?: string[]; actorId?: string; actorName?: string; actorRole?: string }
  ) {
    const { initiativeIds, actorId, actorName, actorRole, ...fields } = input;

    // Fetch current for diff
    const current = await backlogRepository.findById(id);
    if (!current) return null;

    // Recompute priority score with merged values
    const merged = { ...current, ...fields };
    const priorityScore = computePriorityScore({
      arrRepresented: Number(merged.arrRepresented ?? 0),
      revenueOpportunity: Number(merged.revenueOpportunity ?? 0),
      churnRisk: String(merged.churnRisk ?? ""),
      isComplianceRequirement: Boolean(merged.isComplianceRequirement),
      isCompetitiveGap: Boolean(merged.isCompetitiveGap),
      initiativeCount: initiativeIds?.length ?? current.initiatives.length,
      complexity: String(merged.complexity ?? ""),
    });

    // Build change diff for activity
    const trackFields = ["statusId", "arrRepresented", "churnRisk", "roadmapQuarter", "businessPriority"];
    const changes: { field: string; from: unknown; to: unknown }[] = [];
    for (const f of trackFields) {
      if (f in fields && String(fields[f]) !== String((current as Record<string, unknown>)[f] ?? "")) {
        changes.push({ field: f, from: (current as Record<string, unknown>)[f], to: fields[f] });
      }
    }

    await backlogRepository.update(id, { ...fields, priorityScore, customerQuotes: fields.customerQuotes as never });

    if (initiativeIds !== undefined) {
      await backlogRepository.setInitiatives(id, initiativeIds);
    }

    if (changes.length > 0) {
      const isStatusChange = changes.some((c) => c.field === "statusId");
      await backlogRepository.addActivity({
        itemId: id,
        actorId: String(actorId ?? ""),
        actorName: String(actorName ?? ""),
        actorRole: String(actorRole ?? ""),
        changeType: isStatusChange ? "status_change" : "field_edit",
        summary: isStatusChange
          ? `${actorName ?? "Someone"} changed the status`
          : `${actorName ?? "Someone"} updated ${changes.length} field${changes.length > 1 ? "s" : ""}`,
        changes,
      });
    }

    return backlogRepository.findById(id);
  },

  async delete(id: string) {
    return backlogRepository.delete(id);
  },

  async submitEngReview(
    id: string,
    review: {
      estimatedEffort?: string;
      complexity?: string;
      timelineEstimate?: string;
      technicalDependencies?: string;
      risks?: string;
      architectureNotes?: string;
      confidenceLevel?: string;
      actorId?: string;
      actorName?: string;
      actorRole?: string;
    }
  ) {
    const { actorId, actorName, actorRole, ...reviewFields } = review;
    const item = await backlogRepository.findById(id);
    if (!item) return null;

    const priorityScore = computePriorityScore({
      arrRepresented: Number(item.arrRepresented ?? 0),
      revenueOpportunity: Number(item.revenueOpportunity ?? 0),
      churnRisk: item.churnRisk,
      isComplianceRequirement: item.isComplianceRequirement,
      isCompetitiveGap: item.isCompetitiveGap,
      initiativeCount: item.initiatives.length,
      complexity: reviewFields.complexity ?? item.complexity,
    });

    await backlogRepository.update(id, {
      ...reviewFields,
      engReviewedById: actorId,
      engReviewedAt: new Date(),
      priorityScore,
    });

    await backlogRepository.addActivity({
      itemId: id,
      actorId,
      actorName,
      actorRole,
      changeType: "eng_review",
      summary: `${actorName ?? "Engineering"} submitted an engineering assessment`,
      changes: reviewFields,
    });

    return backlogRepository.findById(id);
  },

  async publishRanking(
    productId: string,
    updates: { id: string; businessPriority: number }[],
    actor: { actorId?: string; actorName?: string; actorRole?: string }
  ) {
    await backlogRepository.bulkUpdateRank(updates);

    const now = new Date();
    await Promise.all(
      updates.map(({ id }) =>
        backlogRepository.update(id, { rankPublishedAt: now, rankPublishedById: actor.actorId })
      )
    );

    // Log one activity per item moved
    for (const update of updates) {
      await backlogRepository.addActivity({
        itemId: update.id,
        actorId: actor.actorId,
        actorName: actor.actorName,
        actorRole: actor.actorRole,
        changeType: "rank_change",
        summary: `${actor.actorName ?? "PM"} set rank to #${update.businessPriority}`,
        changes: { rank: update.businessPriority },
      });
    }

    return { updated: updates.length };
  },

  async addComment(
    id: string,
    comment: string,
    actor: { actorId?: string; actorName?: string; actorRole?: string }
  ) {
    return backlogRepository.addActivity({
      itemId: id,
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      changeType: "comment",
      summary: `${actor.actorName ?? "Someone"} commented`,
      comment,
    });
  },

  async linkJira(
    id: string,
    jiraData: { jiraIssueKey: string; jiraUrl: string },
    actor: { actorId?: string; actorName?: string; actorRole?: string }
  ) {
    await backlogRepository.update(id, { ...jiraData, jiraCreatedAt: new Date() });
    await backlogRepository.addActivity({
      itemId: id,
      actorId: actor.actorId,
      actorName: actor.actorName,
      actorRole: actor.actorRole,
      changeType: "jira_export",
      summary: `${actor.actorName ?? "Someone"} created Jira ticket ${jiraData.jiraIssueKey}`,
      changes: jiraData,
    });
    return backlogRepository.findById(id);
  },

  async getPortfolio() {
    return backlogRepository.getPortfolio();
  },

  async getTaxonomy() {
    return backlogRepository.getTaxonomy();
  },

  async getActivity(filters: { itemId?: string; actorId?: string; changeType?: string }) {
    return backlogRepository.listActivity(filters);
  },
};
