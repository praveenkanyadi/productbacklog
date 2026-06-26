import type { Request, Response } from "express";
import { assignmentService } from "../services/assignments.js";

export async function listAssignments(req: Request, res: Response) {
  const orgId = (req.query.orgId as string) ?? "";
  if (!orgId) {
    return res.status(400).json({ error: "orgId query param required" });
  }
  const assignments = await assignmentService.listOpen(orgId);
  return res.status(200).json(assignments);
}

export async function getAssignment(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "id required" });
  }
  const assignment = await assignmentService.getById(id);
  if (!assignment) {
    return res.status(404).json({ error: "Assignment not found" });
  }
  return res.status(200).json(assignment);
}
