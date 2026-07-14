import express from "express";
import { handleSuggestTopics, handleSelectTopic } from "../services/topicService.js";

const router = express.Router();

router.post("/:id/suggest", async (req, res) => {
  try {
    const result = await handleSuggestTopics(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/select", async (req, res) => {
  try {
    const result = await handleSelectTopic(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
