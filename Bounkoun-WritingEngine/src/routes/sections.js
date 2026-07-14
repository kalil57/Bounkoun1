import express from "express";
import { handleWriteSection } from "../controllers/sectionsController.js";

const router = express.Router();

router.post("/:projectId", handleWriteSection);

export default router;
