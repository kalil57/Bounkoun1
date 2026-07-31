import { supabase } from "../db/supabaseClient.js";
import { AppError } from "../utils/AppError.js";
import { analyzeDataset, computeCorrelations } from "../utils/datasetAnalyzer.js";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export async function handleDatasetUpload(projectId, file) {
  if (!file) throw new AppError(400, "No file uploaded");

  let rows = [];
  const filename = file.originalname.toLowerCase();

  if (filename.endsWith(".csv") || filename.endsWith(".tsv")) {
    const text = file.buffer.toString("utf-8");
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, dynamicTyping: false });
    rows = parsed.data;
  } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
  } else {
    throw new AppError(400, "Unsupported file type. Please upload a CSV, TSV, or Excel file.");
  }

  if (rows.length === 0) {
    throw new AppError(400, "The uploaded file contains no data rows.");
  }

  const MAX_ROWS = 5000;
  if (rows.length > MAX_ROWS) {
    rows = rows.slice(0, MAX_ROWS);
  }

  const analysis = analyzeDataset(rows);
  const correlations = computeCorrelations(rows, analysis.columns);

  const { data, error } = await supabase
    .from("datasets")
    .insert({
      project_id: projectId,
      filename: file.originalname,
      row_count: analysis.row_count,
      columns: analysis.columns,
      summary: analysis.summary,
      correlations,
      data: rows
    })
    .select("id, project_id, filename, row_count, columns, summary, correlations, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getProjectDatasets(projectId) {
  const { data, error } = await supabase
    .from("datasets")
    .select("id, project_id, filename, row_count, columns, summary, correlations, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getDatasetPoints(datasetId, col1, col2) {
  if (!col1 || !col2) {
    throw new AppError(400, "Both col1 and col2 query parameters are required");
  }

  const { data: dataset, error } = await supabase
    .from("datasets")
    .select("data")
    .eq("id", datasetId)
    .single();

  if (error || !dataset) throw new AppError(404, "Dataset not found");

  const points = dataset.data
    .map((row) => ({ x: row[col1], y: row[col2] }))
    .filter((p) => p.x !== null && p.x !== undefined && p.x !== "" && p.y !== null && p.y !== undefined && p.y !== "")
    .map((p) => ({ x: Number(p.x), y: Number(p.y) }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y));

  return points;
}
