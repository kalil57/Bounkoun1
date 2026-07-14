import express from "express";
import { handleGenerateCitations } from "../controllers/citationsController.js";

const router = express.Router();

router.post("/:paperId", handleGenerateCitations);

export default router;
