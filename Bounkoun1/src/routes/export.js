import express from "express";
import { exportMarkdown, exportDocx } from "../controllers/exportController.js";

const router = express.Router();

router.get("/:projectId/markdown", async (req, res) => {
  try {
    const md = await exportMarkdown(req.params.projectId);
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="thesis-${req.params.projectId}.md"`);
    res.send(md);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:projectId/docx", async (req, res) => {
  try {
    const buffer = await exportDocx(req.params.projectId);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="thesis-${req.params.projectId}.docx"`);
    res.send(buffer);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
