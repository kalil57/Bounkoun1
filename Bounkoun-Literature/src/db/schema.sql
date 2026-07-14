-- LITERATURE SEARCH LOGS
CREATE TABLE IF NOT EXISTS literature_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  query TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PAPERS TABLE
CREATE TABLE IF NOT EXISTS papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  openalex_id TEXT NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  authors TEXT[],
  year INT,
  concepts JSONB,
  url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CITATIONS TABLE
CREATE TABLE IF NOT EXISTS citations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id uuid REFERENCES papers(id),
  citation_text TEXT NOT NULL,
  relevance_score INT,
  created_at TIMESTAMP DEFAULT NOW()
);
