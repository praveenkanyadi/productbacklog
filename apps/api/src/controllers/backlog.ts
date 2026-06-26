import type { Request, Response } from "express";
import { backlogService } from "../services/backlog.js";
import { backlogRepository } from "../repositories/backlog.js";

type AuthRequest = Request & { userId?: string };

function actor(req: AuthRequest) {
  return {
    actorId: req.userId,
    actorName: req.headers["x-actor-name"] as string | undefined,
    actorRole: req.headers["x-actor-role"] as string | undefined,
  };
}

// ---------------------------------------------------------------------------
// Backlog items
// ---------------------------------------------------------------------------

export async function listItems(req: Request, res: Response) {
  const {
    productId, productAreaId, statusId, initiativeId, ownerId,
    search, roadmapQuarter, churnRisk,
    skip, take, orderBy, orderDir,
  } = req.query as Record<string, string>;

  const result = await backlogService.list({
    productId, productAreaId, statusId, initiativeId, ownerId,
    search, roadmapQuarter, churnRisk,
    skip: skip ? Number(skip) : undefined,
    take: take ? Number(take) : undefined,
    orderBy: orderBy as never,
    orderDir: orderDir as never,
  });
  return res.json(result);
}

export async function getItem(req: Request, res: Response) {
  const item = await backlogService.getById(req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found" });
  return res.json(item);
}

export async function createItem(req: AuthRequest, res: Response) {
  const item = await backlogService.create({ ...req.body, ...actor(req) });
  return res.status(201).json(item);
}

export async function updateItem(req: AuthRequest, res: Response) {
  const item = await backlogService.update(req.params.id, { ...req.body, ...actor(req) });
  if (!item) return res.status(404).json({ error: "Item not found" });
  return res.json(item);
}

export async function deleteItem(req: Request, res: Response) {
  await backlogService.delete(req.params.id);
  return res.status(204).send();
}

export async function submitEngReview(req: AuthRequest, res: Response) {
  const item = await backlogService.submitEngReview(req.params.id, { ...req.body, ...actor(req) });
  if (!item) return res.status(404).json({ error: "Item not found" });
  return res.json(item);
}

export async function publishRanking(req: AuthRequest, res: Response) {
  const { productId, updates } = req.body as { productId: string; updates: { id: string; businessPriority: number }[] };
  if (!productId || !Array.isArray(updates)) {
    return res.status(400).json({ error: "productId and updates[] required" });
  }
  const result = await backlogService.publishRanking(productId, updates, actor(req));
  return res.json(result);
}

export async function addComment(req: AuthRequest, res: Response) {
  const { comment } = req.body as { comment: string };
  if (!comment) return res.status(400).json({ error: "comment required" });
  const activity = await backlogService.addComment(req.params.id, comment, actor(req));
  return res.status(201).json(activity);
}

export async function linkJira(req: AuthRequest, res: Response) {
  const { jiraIssueKey, jiraUrl } = req.body as { jiraIssueKey: string; jiraUrl: string };
  if (!jiraIssueKey || !jiraUrl) {
    return res.status(400).json({ error: "jiraIssueKey and jiraUrl required" });
  }
  const item = await backlogService.linkJira(req.params.id, { jiraIssueKey, jiraUrl }, actor(req));
  return res.json(item);
}

// ---------------------------------------------------------------------------
// Portfolio + taxonomy (read)
// ---------------------------------------------------------------------------

export async function getPortfolio(_req: Request, res: Response) {
  const portfolio = await backlogService.getPortfolio();
  return res.json(portfolio);
}

export async function getTaxonomy(_req: Request, res: Response) {
  const taxonomy = await backlogService.getTaxonomy();
  return res.json(taxonomy);
}

export async function getActivity(req: Request, res: Response) {
  const { itemId, actorId, changeType } = req.query as Record<string, string>;
  const activity = await backlogService.getActivity({ itemId, actorId, changeType });
  return res.json(activity);
}

// ---------------------------------------------------------------------------
// Admin — taxonomy CRUD
// ---------------------------------------------------------------------------

export async function adminUpsertStatus(req: Request, res: Response) {
  const result = await backlogRepository.upsertStatus(req.body);
  return res.json(result);
}

export async function adminUpsertSource(req: Request, res: Response) {
  const result = await backlogRepository.upsertSource(req.body);
  return res.json(result);
}

export async function adminUpsertRelease(req: Request, res: Response) {
  const result = await backlogRepository.upsertRelease(req.body);
  return res.json(result);
}

export async function adminUpsertInitiative(req: Request, res: Response) {
  const result = await backlogRepository.upsertInitiative(req.body);
  return res.json(result);
}

export async function adminUpsertProduct(req: Request, res: Response) {
  const result = await backlogRepository.upsertProduct(req.body);
  return res.json(result);
}

export async function adminUpsertProductArea(req: Request, res: Response) {
  const result = await backlogRepository.upsertProductArea(req.body);
  return res.json(result);
}

export async function adminDeleteProduct(req: Request, res: Response) {
  await backlogRepository.deleteProduct(req.params.id);
  return res.json({ ok: true });
}

export async function adminDeleteProductArea(req: Request, res: Response) {
  await backlogRepository.deleteProductArea(req.params.id);
  return res.json({ ok: true });
}

export async function adminDeleteStatus(req: Request, res: Response) {
  await backlogRepository.deleteStatus(req.params.id);
  return res.json({ ok: true });
}

export async function adminDeleteSource(req: Request, res: Response) {
  await backlogRepository.deleteSource(req.params.id);
  return res.json({ ok: true });
}

export async function adminDeleteRelease(req: Request, res: Response) {
  await backlogRepository.deleteRelease(req.params.id);
  return res.json({ ok: true });
}

export async function adminDeleteInitiative(req: Request, res: Response) {
  await backlogRepository.deleteInitiative(req.params.id);
  return res.json({ ok: true });
}

export async function adminGetConfig(req: Request, res: Response) {
  const values = await backlogRepository.getConfig(req.params.key);
  return res.json({ key: req.params.key, values });
}

export async function adminSetConfig(req: Request, res: Response) {
  const result = await backlogRepository.setConfig(req.params.key, req.body.values);
  return res.json(result);
}
