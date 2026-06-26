import { Router } from "express";
import * as approvalTemplatesController from "../controllers/approval-templates.js";

const router = Router();

router.get("/", approvalTemplatesController.listTemplates);

export default router;
