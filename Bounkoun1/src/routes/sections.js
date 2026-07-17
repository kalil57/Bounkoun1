import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  createOutline,
  getOutline,
  generateDraftForOutlineItem,
  submitSectionData,
  validateSection,
  generateAbstract,
  editSectionContent
} from "../controllers/sectionsController.js";

const router = express.Router();

router.post("/:projectId/outline", requireAuth, async (req, res) => {
  try {
    const outline = await createOutline(req.params.projectId);
    res.status(201).json(outline);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    const outline = await getOutline(req.params.projectId);
    res.json(outline);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/:sectionId/submit-data", requireAuth, async (req, res) => {
  try {
    const result = await submitSectionData(req.params.sectionId, req.body.user_data);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/:sectionId/generate", requireAuth, async (req, res) => {
  try {
    const section = await generateDraftForOutlineItem(req.params.sectionId);
    res.status(200).json(section);
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

router.post("/:projectId/abstract", requireAuth, async (req, res) => {
  try {
    const result = await generateAbstract(req.params.projectId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.patch("/:sectionId/edit", requireAuth, async (req, res) => {
  try {
    const result = await editSectionContent(req.params.sectionId, req.body.content);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
