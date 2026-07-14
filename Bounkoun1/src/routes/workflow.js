import express from "express";
import {
  handleGetWorkflow,
  handleCompleteWorkflowStep
} from "../services/workflowService.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const result = await handleGetWorkflow(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/complete-step", async (req, res) => {
  try {
    const result = await handleCompleteWorkflowStep(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
