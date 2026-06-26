import type { Request, Response } from "express";
import { approvalService } from "../services/approvals.js";
import {
  approveBodySchema,
  rejectBodySchema,
  delegateBodySchema,
  approvalParamsSchema,
} from "../schemas/approvals.js";

export async function getPendingApprovals(req: Request, res: Response) {
  const orgId = (req.query.orgId as string) ?? "";
  const userId = (req as Request & { userId?: string }).userId;

  if (!orgId) {
    return res.status(400).json({ error: "orgId query param required" });
  }

  const approvals = await approvalService.getPending(orgId, userId);
  return res.status(200).json(approvals);
}

export async function approve(req: Request, res: Response) {
  const paramsParsed = approvalParamsSchema.safeParse({ params: req.params });
  const bodyParsed = approveBodySchema.safeParse({ body: req.body ?? {} });
  if (!paramsParsed.success || !bodyParsed.success) {
    const err = !paramsParsed.success ? paramsParsed.error.flatten() : bodyParsed.error!.flatten();
    return res.status(400).json({ error: err });
  }

  const actorId = (req as Request & { userId?: string }).userId ?? "";
  const result = await approvalService.approve(
    paramsParsed.data.params.id,
    actorId,
    bodyParsed.data.body.note
  );

  if (!result) {
    return res.status(404).json({ error: "Approval not found" });
  }

  return res.status(200).json(result);
}

export async function reject(req: Request, res: Response) {
  const paramsParsed = approvalParamsSchema.safeParse({ params: req.params });
  const bodyParsed = rejectBodySchema.safeParse({ body: req.body ?? {} });
  if (!paramsParsed.success || !bodyParsed.success) {
    const err = !paramsParsed.success ? paramsParsed.error.flatten() : bodyParsed.error!.flatten();
    return res.status(400).json({ error: err });
  }

  const actorId = (req as Request & { userId?: string }).userId ?? "";
  const result = await approvalService.reject(
    paramsParsed.data.params.id,
    actorId,
    bodyParsed.data.body.note
  );

  if (!result) {
    return res.status(404).json({ error: "Approval not found" });
  }

  return res.status(200).json(result);
}

export async function delegate(req: Request, res: Response) {
  const paramsParsed = approvalParamsSchema.safeParse({ params: req.params });
  const bodyParsed = delegateBodySchema.safeParse({ body: req.body ?? {} });
  if (!paramsParsed.success || !bodyParsed.success) {
    const err = !paramsParsed.success ? paramsParsed.error.flatten() : bodyParsed.error!.flatten();
    return res.status(400).json({ error: err });
  }

  const actorId = (req as Request & { userId?: string }).userId ?? "";
  const result = await approvalService.delegate(
    paramsParsed.data.params.id,
    actorId,
    bodyParsed.data.body.delegatedToUserId
  );

  if (!result) {
    return res.status(404).json({ error: "Approval not found" });
  }

  return res.status(200).json(result);
}
