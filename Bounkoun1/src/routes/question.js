import express from "express";
import {
  handleSuggestResearchQuestion,
  handleSelectResearchQuestion,
  handleValidateResearchQuestion
} from "../services/questionService.js";

const router = express.Router();

router.post("/:id/suggest", async (req, res) => {
  try {
    const result = await handleSuggestResearchQuestion(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/select", async (req, res) => {
  try {
    const result = await handleSelectResearchQuestion(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/validate", async (req, res) => {
  try {
    const result = await handleValidateResearchQuestion(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
