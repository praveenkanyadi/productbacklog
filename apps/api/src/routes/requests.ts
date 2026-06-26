import { Router } from "express";
import * as requestsController from "../controllers/requests.js";

const router = Router();

router.get("/", requestsController.listRequests);
router.post("/", requestsController.createRequest);
router.post("/:id/submit", requestsController.submitRequest);
router.post("/:id/withdraw", requestsController.withdrawRequest);
router.get("/:id", requestsController.getRequest);

export default router;
