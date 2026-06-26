/**
 * Debug/inspection endpoints for local E2E validation.
 * Use for verifying DB state after running workflows.
 */
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/worked-records", async (_req, res) => {
  const records = await prisma.workedRecord.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      assignment: { select: { id: true, title: true } },
    },
  });
  res.json(records);
});

router.get("/notification-logs", async (_req, res) => {
  const logs = await prisma.notificationLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
  });
  res.json(logs);
});

router.get("/audit-events", async (req, res) => {
  const entityType = req.query.entityType as string | undefined;
  const entityId = req.query.entityId as string | undefined;
  const where =
    entityType && entityId ? { entityType, entityId } : {};
  const events = await prisma.auditEvent.findMany({
    where,
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
  });
  res.json(events);
});

export default router;
