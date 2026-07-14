import { performLiteratureSearch } from "../services/literatureService.js";
import { validateSearchQuery } from "../utils/validators.js";

export async function handleSearch(req, res) {
  const { projectId } = req.params;
  const { query } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "Missing required parameter: projectId" });
  }

  if (!validateSearchQuery(query)) {
    return res.status(400).json({ error: "Query must be at least 2 characters long" });
  }

  try {
    const results = await performLiteratureSearch(projectId, query);
    res.status(201).json(results);
  } catch (error) {
    console.error("Search controller error:", error);
    res.status(500).json({ error: error.message });
  }
}
