import { Router } from "express";
import * as approvalsController from "../controllers/approvals.js";

const router = Router();

router.get("/pending", approvalsController.getPendingApprovals);
router.post("/:id/approve", approvalsController.approve);
router.post("/:id/reject", approvalsController.reject);
router.post("/:id/delegate", approvalsController.delegate);

export default router;
