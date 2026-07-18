import axios from "axios";

export async function searchCrossRef(query) {
  try {
    const email = "kaliljamal57@gmail.com";
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=20&mailto=${email}`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "BounkounLiteratureService/1.0.0"
      }
    });

    const items = response.data?.message?.items || [];
    return items.map(item => {
      const title = item.title && item.title.length > 0 ? item.title[0] : "Untitled Paper";
      
      let abstract = null;
      if (item.abstract) {
        // Strip simple JATS XML/HTML tags
        abstract = item.abstract.replace(/<\/?[^>]+(>|$)/g, "").trim();
      }

      const authors = (item.author || []).map(a => {
        return [a.given, a.family].filter(Boolean).join(" ");
      }).filter(Boolean);

      let year = null;
      const dateParts = item["published-print"]?.["date-parts"] 
        || item["published-online"]?.["date-parts"] 
        || item["issued"]?.["date-parts"]
        || item["created"]?.["date-parts"];
      if (dateParts && dateParts[0] && dateParts[0][0]) {
        year = Number(dateParts[0][0]) || null;
      }

      const paperUrl = item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : "");

      return {
        openalex_id: item.DOI || "",
        title: title,
        abstract: abstract,
        authors: authors,
        year: year,
        concepts: [],
        url: paperUrl
      };
    });
  } catch (error) {
    console.error("Error searching CrossRef:", error.message);
    throw new Error(`CrossRef search failed: ${error.message}`);
  }
}
