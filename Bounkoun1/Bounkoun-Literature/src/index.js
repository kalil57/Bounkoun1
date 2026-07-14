import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import searchRouter from "./routes/search.js";
import papersRouter from "./routes/papers.js";
import citationsRouter from "./routes/citations.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/search", searchRouter);
app.use("/papers", papersRouter);
app.use("/citations", citationsRouter);

// Health check route
app.get("/", (req, res) => {
  res.json({ status: "Bounkoun Literature Service running" });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bounkoun Literature Service running on port ${PORT}`);
});
