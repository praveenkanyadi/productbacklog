import { Router } from "express";
import * as assignmentsController from "../controllers/assignments.js";

const router = Router();

router.get("/", assignmentsController.listAssignments);
router.get("/:id", assignmentsController.getAssignment);

export default router;
