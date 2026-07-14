import { generateCitations } from "../services/literatureService.js";

export async function handleGenerateCitations(req, res) {
  const { paperId } = req.params;

  if (!paperId) {
    return res.status(400).json({ error: "Missing required parameter: paperId" });
  }

  try {
    const citations = await generateCitations(paperId);
    res.status(201).json(citations);
  } catch (error) {
    console.error("Citations controller error:", error);
    res.status(500).json({ error: error.message });
  }
}
