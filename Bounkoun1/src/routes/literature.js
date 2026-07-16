import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { generateRecommendation, getRecommendation } from "../controllers/literatureController.js";

const router = express.Router();

router.post("/:projectId/recommend", requireAuth, async (req, res) => {
  try {
    const result = await generateRecommendation(req.params.projectId);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:projectId/recommend", async (req, res) => {
  try {
    const result = await getRecommendation(req.params.projectId);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
