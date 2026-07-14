import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import outlineRouter from "./routes/outline.js";
import sectionsRouter from "./routes/sections.js";
import chaptersRouter from "./routes/chapters.js";
import polishRouter from "./routes/polish.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Mounting Routes
app.use("/outline", outlineRouter);
app.use("/sections", sectionsRouter);
app.use("/chapters", chaptersRouter);
app.use("/polish", polishRouter);

// Health Check Route
app.get("/", (req, res) => {
  res.json({ status: "Bounkoun Writing Engine running" });
});

// Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bounkoun Writing Engine running on port ${PORT}`);
});
