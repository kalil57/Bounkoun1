import express from "express";
import { handleCreateOutline } from "../controllers/outlineController.js";

const router = express.Router();

router.post("/:projectId", handleCreateOutline);

export default router;
