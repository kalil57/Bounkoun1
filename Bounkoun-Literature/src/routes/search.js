import express from "express";
import { handleSearch } from "../controllers/searchController.js";

const router = express.Router();

router.post("/:projectId", handleSearch);

export default router;
