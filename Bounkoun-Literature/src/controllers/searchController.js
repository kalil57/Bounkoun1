import { performLiteratureSearch } from "../services/literatureService.js";
import { validateSearchQuery } from "../utils/validators.js";
import { searchOpenAlex } from "../services/openAlexService.js";
import { searchCrossRef } from "../services/crossRefService.js";

function normalizeTitle(title) {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTitleSimilarity(title1, title2) {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  const words1 = norm1.split(" ");
  const words2 = norm2.split(" ");

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

export function deduplicatePapers(papers) {
  const unique = [];
  for (const paper of papers) {
    let isDuplicate = false;
    for (const existing of unique) {
      if (getTitleSimilarity(paper.title, existing.title) > 0.8) {
        isDuplicate = true;
        // Merge abstract and authors if missing in existing
        if (!existing.abstract && paper.abstract) {
          existing.abstract = paper.abstract;
        }
        if ((!existing.authors || existing.authors.length === 0) && paper.authors && paper.authors.length > 0) {
          existing.authors = paper.authors;
        }
        break;
      }
    }
    if (!isDuplicate) {
      unique.push(paper);
    }
  }
  return unique;
}

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
    const [openAlexResults, crossRefResults] = await Promise.all([
      searchOpenAlex(query).catch(err => {
        console.error("OpenAlex search failed, continuing:", err.message);
        return [];
      }),
      searchCrossRef(query).catch(err => {
        console.error("CrossRef search failed, continuing:", err.message);
        return [];
      })
    ]);

    const merged = [...openAlexResults, ...crossRefResults];
    const deduplicated = deduplicatePapers(merged);

    const results = await performLiteratureSearch(projectId, query, deduplicated);
    res.status(201).json(results);
  } catch (error) {
    console.error("Search controller error:", error);
    res.status(500).json({ error: error.message });
  }
}

