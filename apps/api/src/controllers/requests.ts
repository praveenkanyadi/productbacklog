import type { Request, Response } from "express";
import { requestService } from "../services/requests.js";
import {
  createRequestSchema,
  submitRequestParamsSchema,
  getRequestParamsSchema,
  withdrawRequestParamsSchema,
} from "../schemas/requests.js";

export async function listRequests(req: Request, res: Response) {
  const employeeId = (req.query.employeeId as string) ?? "";
  const orgId = (req.query.orgId as string) ?? "";
  if (!employeeId || !orgId) {
    return res.status(400).json({ error: "employeeId and orgId query params required" });
  }
  const requests = await requestService.listByEmployee(employeeId, orgId);
  return res.status(200).json(requests);
}

export async function createRequest(req: Request, res: Response) {
  const parsed = createRequestSchema.safeParse({ body: req.body });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const actorId = (req as Request & { userId?: string }).userId;
  const request = await requestService.create(parsed.data.body, actorId);
  return res.status(201).json(request);
}

export async function submitRequest(req: Request, res: Response) {
  const parsed = submitRequestParamsSchema.safeParse({
    params: req.params,
    body: req.body,
  });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const actorId = (req as Request & { userId?: string }).userId;
  const result = await requestService.submit(
    parsed.data.params.id,
    parsed.data.body.approvalTemplateId,
    actorId
  );

  if (!result) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (result.alreadySubmitted) {
    return res.status(200).json(result.request);
  }

  return res.status(200).json(result.request);
}

export async function withdrawRequest(req: Request, res: Response) {
  const parsed = withdrawRequestParamsSchema.safeParse({ params: req.params });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const result = await requestService.withdraw(parsed.data.params.id);
  if (!result) {
    return res.status(404).json({ error: "Request not found" });
  }
  if (result.notWithdrawable) {
    return res.status(400).json({ error: result.reason });
  }

  return res.status(200).json(result.request);
}

export async function getRequest(req: Request, res: Response) {
  const parsed = getRequestParamsSchema.safeParse({ params: req.params });
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const request = await requestService.getDetailById(parsed.data.params.id);
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  return res.status(200).json(request);
}
