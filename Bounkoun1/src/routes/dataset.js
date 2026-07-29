import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { handleDatasetUpload, getProjectDatasets } from "../controllers/datasetController.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = express.Router();

router.post("/:projectId/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const result = await handleDatasetUpload(req.params.projectId, req.file);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:projectId", requireAuth, async (req, res) => {
  try {
    const result = await getProjectDatasets(req.params.projectId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
