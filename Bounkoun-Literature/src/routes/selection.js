import express from "express";
import { selectPapers, deselectPaper, getSelectedPapers } from "../controllers/selectionController.js";

const router = express.Router();

router.post("/:projectId/select", async (req, res) => {
  try {
    const result = await selectPapers(req.params.projectId, req.body.paper_ids);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:projectId/deselect/:paperId", async (req, res) => {
  try {
    const result = await deselectPaper(req.params.projectId, req.params.paperId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:projectId/selected", async (req, res) => {
  try {
    const result = await getSelectedPapers(req.params.projectId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
