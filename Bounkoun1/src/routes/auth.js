import express from "express";
import { signup, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const result = await signup(req.body.email, req.body.password);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const result = await login(req.body.email, req.body.password);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

export default router;
