import type { Request, Response } from "express";
import { approvalTemplateService } from "../services/approval-templates.js";

export async function listTemplates(req: Request, res: Response) {
  const orgId = (req.query.orgId as string) ?? "";
  if (!orgId) {
    return res.status(400).json({ error: "orgId query param required" });
  }
  const templates = await approvalTemplateService.list(orgId);
  return res.status(200).json(templates);
}
