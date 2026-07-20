import express from "express";
import multer from "multer";
import { handleUpload } from "../controllers/uploadController.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const router = express.Router();

router.post("/:projectId", upload.single("file"), handleUpload);

export default router;
