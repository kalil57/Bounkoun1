import express from "express";
import { handlePolishText } from "../controllers/polishController.js";

const router = express.Router();

router.post("/:projectId", handlePolishText);

export default router;
