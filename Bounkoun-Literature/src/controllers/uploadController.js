import { supabase } from "../db/supabaseClient.js";
import { extractPaperMetadata } from "../services/aiService.js";
import pdfParse from "pdf-parse";

export async function handleUpload(req, res) {
  try {
    const { projectId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const parsed = await pdfParse(req.file.buffer);
    const text = parsed.text.slice(0, 8000);

    const metadata = await extractPaperMetadata(text);

    const { data, error } = await supabase
      .from("papers")
      .insert({
        project_id: projectId,
        openalex_id: `user-upload-${Date.now()}`,
        title: metadata.title || req.file.originalname,
        abstract: metadata.abstract || null,
        authors: metadata.authors || [],
        year: metadata.year || null,
        concepts: [],
        url: null,
        is_selected: true,
        selected_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
