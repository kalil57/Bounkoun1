import express from "express";
import { handleWriteChapter } from "../controllers/chaptersController.js";

const router = express.Router();

router.post("/:projectId", handleWriteChapter);

export default router;
