import { Router } from "express";
import * as c from "../controllers/backlog.js";

const router = Router();

// Backlog items
router.get("/", c.listItems);
router.post("/", c.createItem);
router.post("/rank", c.publishRanking);
router.get("/portfolio", c.getPortfolio);
router.get("/taxonomy", c.getTaxonomy);
router.get("/activity", c.getActivity);

router.get("/:id", c.getItem);
router.put("/:id", c.updateItem);
router.delete("/:id", c.deleteItem);
router.post("/:id/eng-review", c.submitEngReview);
router.post("/:id/comment", c.addComment);
router.post("/:id/jira", c.linkJira);

// Admin taxonomy
router.post("/admin/statuses", c.adminUpsertStatus);
router.post("/admin/sources", c.adminUpsertSource);
router.post("/admin/releases", c.adminUpsertRelease);
router.post("/admin/initiatives", c.adminUpsertInitiative);
router.post("/admin/products", c.adminUpsertProduct);
router.delete("/admin/products/:id", c.adminDeleteProduct);
router.post("/admin/product-areas", c.adminUpsertProductArea);
router.delete("/admin/product-areas/:id", c.adminDeleteProductArea);
router.delete("/admin/statuses/:id", c.adminDeleteStatus);
router.delete("/admin/sources/:id", c.adminDeleteSource);
router.delete("/admin/releases/:id", c.adminDeleteRelease);
router.delete("/admin/initiatives/:id", c.adminDeleteInitiative);
router.get("/admin/config/:key", c.adminGetConfig);
router.put("/admin/config/:key", c.adminSetConfig);

export default router;
