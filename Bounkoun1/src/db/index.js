import pkg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const { Pool } = pkg;
dotenv.config();

const isProductionDb = !!process.env.DATABASE_URL;

let dbPool = null;
let mockDb = {
  users: [
    { id: "user_123", email: "kaliljamal57@gmail.com", full_name: "Kalil Jamal", created_at: new Date() }
  ],
  projects: [],
  research_questions: [],
  workflow_steps: [],
  events: []
};

// Initialize connection pool if configured
if (isProductionDb) {
  console.log("🔌 Connecting to production Supabase PostgreSQL...");
  dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("supabase.co") ? { rejectUnauthorized: false } : false
  });
  
  dbPool.on("error", (err) => {
    console.error("❌ Unexpected database pool error:", err);
  });
} else {
  console.log("ℹ️ DATABASE_URL not detected. Initializing local in-memory/JSON DB fallback for development.");
}

/**
 * Execute a query on the Supabase Postgres database.
 * If no connection string is provided, runs queries on the local mock/JSON store.
 * @param {string} text - SQL query text
 * @param {any[]} params - Parameter values
 * @returns {Promise<{ rows: any[] }>}
 */
export async function query(text, params = []) {
  if (isProductionDb && dbPool) {
    try {
      const res = await dbPool.query(text, params);
      return res;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

  // FALLBACK ORCHESTRATION STATE ENGINE (For seamless local/dev usage)
  const queryStr = text.toLowerCase().trim();
  
  // 1. SELECT projects
  if (queryStr.startsWith("select") && queryStr.includes("from projects")) {
    if (queryStr.includes("where id =")) {
      const id = params[0];
      const proj = mockDb.projects.find(p => p.id === id);
      return { rows: proj ? [proj] : [] };
    }
    const userId = params[0] || "user_123";
    const projs = mockDb.projects.filter(p => p.user_id === userId);
    return { rows: projs };
  }

  // 2. SELECT workflow_steps
  if (queryStr.startsWith("select") && queryStr.includes("from workflow_steps")) {
    const projectId = params[0];
    const steps = mockDb.workflow_steps
      .filter(s => s.project_id === projectId)
      .sort((a, b) => a.order - b.order);
    return { rows: steps };
  }

  // 3. INSERT INTO projects
  if (queryStr.startsWith("insert into projects")) {
    const [id, title, student_name, academic_level, discipline, initial_idea, user_id] = params;
    const newProj = {
      id,
      title,
      student_name,
      academic_level,
      discipline,
      status: "Topic Selection",
      initial_idea,
      topic: null,
      user_id,
      created_at: new Date(),
      updated_at: new Date()
    };
    mockDb.projects.push(newProj);
    return { rows: [newProj] };
  }

  // 4. INSERT INTO workflow_steps
  if (queryStr.startsWith("insert into workflow_steps")) {
    const [id, project_id, step_name, description, assigned_service, status, is_completed, order] = params;
    const newStep = {
      id,
      project_id,
      step_name,
      description,
      assigned_service,
      status,
      is_completed,
      completed_at: null,
      order,
      updated_at: new Date()
    };
    mockDb.workflow_steps.push(newStep);
    return { rows: [newStep] };
  }

  // 5. UPDATE projects SET topic
  if (queryStr.includes("update projects") && queryStr.includes("set topic")) {
    const [topic, status, id] = params;
    const proj = mockDb.projects.find(p => p.id === id);
    if (proj) {
      proj.topic = topic;
      proj.status = status;
      proj.updated_at = new Date();
    }
    return { rows: proj ? [proj] : [] };
  }

  // 6. UPDATE workflow_steps SET is_completed
  if (queryStr.includes("update workflow_steps") && queryStr.includes("set is_completed")) {
    const [is_completed, status, completed_at, project_id, step_name] = params;
    const step = mockDb.workflow_steps.find(s => s.project_id === project_id && s.step_name === step_name);
    if (step) {
      step.is_completed = is_completed;
      step.status = status;
      step.completed_at = completed_at;
      step.updated_at = new Date();
    }
    return { rows: step ? [step] : [] };
  }

  // 7. INSERT INTO research_questions
  if (queryStr.startsWith("insert into research_questions")) {
    const [id, project_id, question, rationale, status, is_final] = params;
    const newQ = {
      id,
      project_id,
      question,
      rationale,
      status,
      is_final,
      created_at: new Date()
    };
    mockDb.research_questions.push(newQ);
    return { rows: [newQ] };
  }

  // 8. INSERT INTO events
  if (queryStr.startsWith("insert into events")) {
    const [id, project_id, event_type, payload] = params;
    const newEv = {
      id,
      project_id,
      event_type,
      payload: typeof payload === "string" ? JSON.parse(payload) : payload,
      timestamp: new Date()
    };
    mockDb.events.push(newEv);
    return { rows: [newEv] };
  }

  return { rows: [] };
}
