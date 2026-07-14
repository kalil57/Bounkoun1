import 'dotenv/config';
import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.js";
import projectsRouter from "./routes/projects.js";
import topicRouter from "./routes/topic.js";
import questionRouter from "./routes/question.js";
import workflowRouter from "./routes/workflow.js";
import eventsRouter from "./routes/events.js";
import sectionsRouter from "./routes/sections.js";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/projects", projectsRouter);
app.use("/topic", topicRouter);
app.use("/question", questionRouter);
app.use("/workflow", workflowRouter);
app.use("/events", eventsRouter);
app.use("/sections", sectionsRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Bounkoun Core Service running" });
});

// Error handling middleware for malformed JSON bodies
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  next(err);
});

// Catch-all 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bounkoun Core Service running on port ${PORT}`);
});
