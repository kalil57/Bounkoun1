-- OUTLINES TABLE
CREATE TABLE IF NOT EXISTS outlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  structure JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SECTIONS TABLE
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  outline_id uuid REFERENCES outlines(id),
  section_name TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  chapter_title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- POLISHED OUTPUT TABLE
CREATE TABLE IF NOT EXISTS polished_output (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  input_text TEXT NOT NULL,
  polished_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
