import axios from "axios";

export function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return "";
  const words = [];
  try {
    for (const [word, positions] of Object.entries(invertedIndex)) {
      if (Array.isArray(positions)) {
        for (const pos of positions) {
          words[pos] = word;
        }
      }
    }
    return words.filter(Boolean).join(" ");
  } catch (error) {
    console.error("Error reconstructing abstract:", error);
    return "";
  }
}

export async function searchOpenAlex(query) {
  try {
    const email = "kaliljamal57@gmail.com";
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&mailto=${email}&per_page=100`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "BounkounLiteratureService/1.0.0"
      }
    });

    const results = response.data.results || [];
    return results.map(work => {
      const abstract = reconstructAbstract(work.abstract_inverted_index);
      const authors = (work.authorships || []).map(auth => auth.author?.display_name).filter(Boolean);
      const concepts = (work.concepts || []).map(c => ({
        name: c.display_name,
        score: c.score
      }));
      const paperUrl = work.primary_location?.landing_page_url || work.doi || "";

      return {
        openalex_id: work.id || "",
        title: work.title || "Untitled Paper",
        abstract: abstract || "",
        authors: authors,
        year: work.publication_year || null,
        concepts: concepts,
        url: paperUrl
      };
    });
  } catch (error) {
    console.error("Error searching OpenAlex:", error.message);
    throw new Error(`OpenAlex search failed: ${error.message}`);
  }
}
