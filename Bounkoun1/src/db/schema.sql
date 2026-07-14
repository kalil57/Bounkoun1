-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  title TEXT NOT NULL,
  discipline TEXT,
  academic_level TEXT NOT NULL,
  selected_topic TEXT,
  status TEXT DEFAULT 'topic_pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- RESEARCH QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS research_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  text TEXT NOT NULL,
  is_final BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- WORKFLOW STEPS TABLE
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  step_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP
);

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_research_questions_project_id ON research_questions(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_project_id ON workflow_steps(project_id);
CREATE INDEX IF NOT EXISTS idx_events_project_id ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
