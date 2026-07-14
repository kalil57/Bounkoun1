import express from "express";
import { handleGetSummary } from "../controllers/papersController.js";

const router = express.Router();

router.get("/:paperId/summary", handleGetSummary);

export default router;
