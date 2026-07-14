import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { createSectionDraft, getSectionsForProject, validateSection } from "../controllers/sectionsController.js";

const router = express.Router();

router.post("/:projectId/generate", requireAuth, async (req, res) => {
  try {
    const section = await createSectionDraft(req.params.projectId, req.body.section_type);
    res.status(201).json(section);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    const sections = await getSectionsForProject(req.params.projectId);
    res.json(sections);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/:sectionId/validate", requireAuth, async (req, res) => {
  try {
    const result = await validateSection(req.params.sectionId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
