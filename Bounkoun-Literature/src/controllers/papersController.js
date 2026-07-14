import { summarizePaper } from "../services/literatureService.js";

export async function handleGetSummary(req, res) {
  const { paperId } = req.params;

  if (!paperId) {
    return res.status(400).json({ error: "Missing required parameter: paperId" });
  }

  try {
    const summaryData = await summarizePaper(paperId);
    res.json(summaryData);
  } catch (error) {
    console.error("Papers controller error:", error);
    res.status(500).json({ error: error.message });
  }
}
