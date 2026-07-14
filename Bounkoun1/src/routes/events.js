import express from "express";
import { logEvent, getEventsForProject } from "../controllers/eventsController.js";

const router = express.Router();

router.post("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await logEvent(projectId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await getEventsForProject(projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
