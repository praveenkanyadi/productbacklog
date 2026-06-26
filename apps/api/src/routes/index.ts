import { Router } from "express";
import assignmentsRouter from "./assignments.js";
import requestsRouter from "./requests.js";
import approvalsRouter from "./approvals.js";
import approvalTemplatesRouter from "./approval-templates.js";
import debugRouter from "./debug.js";
import backlogRouter from "./backlog.js";

const router = Router();

router.use("/assignments", assignmentsRouter);
router.use("/requests", requestsRouter);
router.use("/approvals", approvalsRouter);
router.use("/approval-templates", approvalTemplatesRouter);
router.use("/debug", debugRouter);
router.use("/backlog", backlogRouter);

export default router;
