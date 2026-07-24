import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { createProject, getProjectById, getAllProjects, updateStylePreference } from "../controllers/projectsController.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const project = await createProject(req.body, req.user.id);
    res.status(201).json(project);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await getProjectById(req.params.id);
    res.status(200).json(project);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const projects = await getAllProjects(req.user.id);
    res.status(200).json(projects);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.patch("/:id/style-preference", requireAuth, async (req, res) => {
  try {
    const { style_preference, citation_style, formality_preset, writing_language } = req.body;
    const result = await updateStylePreference(req.params.id, {
      style_preference,
      citation_style,
      formality_preset,
      writing_language
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
