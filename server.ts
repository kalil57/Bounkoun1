import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Project, Topic, ResearchQuestion, WorkflowStep, ApiLog, AcademicLevel } from "./src/types";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Database file path
const DB_FILE = path.join(process.cwd(), "bounkoun_db.json");

// In-memory request logs
let apiLogs: ApiLog[] = [];

// Helper to log requests to bounkoun-core REST API
function logApiRequest(method: string, url: string, caller: string, payload?: string, statusCode = 200) {
  const newLog: ApiLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    method,
    url,
    callerService: caller,
    payload: payload ? (payload.length > 300 ? payload.substring(0, 300) + "..." : payload) : undefined,
    statusCode,
  };
  apiLogs.unshift(newLog);
  if (apiLogs.length > 100) {
    apiLogs = apiLogs.slice(0, 100);
  }
}

// Initial seed data
const initialProjects: Project[] = [
  {
    id: "proj_1",
    title: "AI-Powered Adaptive Feedback in Higher Education",
    studentName: "Amadou Diallo",
    academicLevel: "Master",
    discipline: "Computer Science & Education",
    status: "Proposal",
    initialIdea: "Design an intelligent tutoring agent that reads students' drafts and gives real-time pedagogical feedback based on Bloom's Taxonomy.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "proj_2",
    title: "Socio-Economic Barriers to Renewable Energy Adoption in Rural West Africa",
    studentName: "Fatoumata Kamara",
    academicLevel: "PhD",
    discipline: "Development Economics",
    status: "Topic Selection",
    initialIdea: "Analyzing why smallholder communities reject solar mini-grids despite high subsidies.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const initialTopics: Topic[] = [
  {
    id: "topic_1",
    projectId: "proj_1",
    title: "Large Language Models as Diagnostic Academic Assessors",
    description: "Evaluating the alignment of generative AI diagnostics against senior human evaluator scores in undergraduate CS coursework.",
    selected: true,
    feasibilityScore: 8,
    relevanceScore: 9,
    originalityScore: 7,
    feedback: "High feasibility due to open-source LLM availability. Ensure strict anonymity of training coursework to adhere to institutional guidelines."
  },
  {
    id: "topic_2",
    projectId: "proj_1",
    title: "Visual Cognitive Maps for Prompt Engineering",
    description: "Developing a node-based UI that translates cognitive scaffolds into visual prompt graphs to guide thesis writing.",
    selected: false,
    feasibilityScore: 6,
    relevanceScore: 8,
    originalityScore: 9,
    feedback: "Highly original but frontend development overhead may be high for a Master thesis. Scope should focus on a lightweight prototype."
  },
  {
    id: "topic_3",
    projectId: "proj_2",
    title: "Trust, Tariffs, and Tenancy: Landlord-Tenant Dynamics in Mini-Grid Integration",
    description: "An empirical investigation of the landlord-tenant dilemma regarding long-term micro-utility investments in peri-urban markets.",
    selected: false,
    feasibilityScore: 7,
    relevanceScore: 9,
    originalityScore: 9,
    feedback: "Excellent focus. PhD rigor requires a strong game-theoretic framework paired with multi-regional survey data."
  }
];

const initialQuestions: ResearchQuestion[] = [
  {
    id: "q_1",
    projectId: "proj_1",
    question: "To what extent do LLM-generated pedagogical feedbacks improve subsequent drafting quality in student coursework?",
    rationale: "Directly measures the practical utility and educational impact of the proposed system.",
    hypothesis: "Students utilizing LLM cognitive feedback show a 15% higher score improvement in logic and synthesis during the final draft than control groups.",
    status: "Approved"
  },
  {
    id: "q_2",
    projectId: "proj_1",
    question: "How does the alignment of AI-generated feedback with Bloom's Taxonomy vary across different disciplines?",
    rationale: "Ensures the system generalizes beyond computer science into other scientific fields.",
    status: "Draft"
  }
];

const initialSteps: WorkflowStep[] = [
  {
    id: "step_1",
    projectId: "proj_1",
    title: "Literature Review on Intelligent Tutoring Systems",
    description: "Synthesize findings regarding cognitive tutoring architectures and feedback mechanisms.",
    assignedService: "literature",
    status: "Completed",
    order: 1,
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "step_2",
    projectId: "proj_1",
    title: "Define Feedback Taxonomy & Scaffolds",
    description: "Develop the prompt rules mapping student draft metrics to specific Bloom's taxonomy categories.",
    assignedService: "core",
    status: "In Progress",
    order: 2,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "step_3",
    projectId: "proj_1",
    title: "Prototype Writing Evaluation Route",
    description: "Implement API integration with LLM backend for structural text parsing.",
    assignedService: "writing",
    status: "Pending",
    order: 3,
    updatedAt: new Date().toISOString()
  },
  {
    id: "step_4",
    projectId: "proj_1",
    title: "Human-in-the-Loop Validation Survey",
    description: "Obtain validation scores from university professors reviewing the alignment of generated feedback.",
    assignedService: "validation",
    status: "Pending",
    order: 4,
    updatedAt: new Date().toISOString()
  },
  {
    id: "step_5",
    projectId: "proj_1",
    title: "Statistical Quality Audit",
    description: "Run ANOVA and descriptive statistical reviews on student draft scores before and after AI scaffold usage.",
    assignedService: "stats",
    status: "Pending",
    order: 5,
    updatedAt: new Date().toISOString()
  }
];

// Load database
let db = {
  projects: initialProjects,
  topics: initialTopics,
  questions: initialQuestions,
  steps: initialSteps,
  events: [] as any[],
};

if (fs.existsSync(DB_FILE)) {
  try {
    const fileData = fs.readFileSync(DB_FILE, "utf-8");
    db = JSON.parse(fileData);
    if (!db.events) {
      db.events = [];
    }
    console.log("Successfully loaded database from", DB_FILE);
  } catch (error) {
    console.error("Error reading database file, using defaults:", error);
  }
} else {
  saveDatabase();
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving database file:", error);
  }
}

// Lazy-initialize Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Gemini features will run in mock mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Mock responses for when API Key is missing or empty
function getMockTopics(discipline: string, level: string, idea: string): any[] {
  return [
    {
      title: `Optimized Quantitative Analysis for ${discipline}`,
      description: `A systematic approach to evaluating ${idea || "academic questions"} within the specific constraints of ${level}-level research.`,
      feasibilityScore: 8,
      relevanceScore: 9,
      originalityScore: 7,
      feedback: `This is highly feasible for a ${level} thesis. It focuses on well-established paradigms within ${discipline} while utilizing modern statistical metrics.`
    },
    {
      title: `The Socio-Technical Impact of Generative AI on ${discipline}`,
      description: `Exploring how modern intelligent systems are shifting the research boundary for students and experts in ${discipline}.`,
      feasibilityScore: 7,
      relevanceScore: 8,
      originalityScore: 8,
      feedback: `Very timely topic. For a ${level} thesis, you should establish clear variables and map out empirical validation early.`
    },
    {
      title: `Comparative Framework of Methodological Standards in ${discipline}`,
      description: `A rigorous comparative study analyzing qualitative versus quantitative frameworks to model: ${idea || "the primary thesis idea"}.`,
      feasibilityScore: 6,
      relevanceScore: 8,
      originalityScore: 9,
      feedback: `Highly original. Excellent fit for ${level} depth. Needs structured workflow steps across stats and validation services.`
    }
  ];
}

function getMockQuestions(level: string, topicTitle: string): any[] {
  return [
    {
      question: `How does the adoption of ${topicTitle} affect the efficiency of downstream academic evaluations?`,
      rationale: `This addresses the core efficiency metrics of the system, which is a major focal point in modern research.`,
      hypothesis: level !== "Bachelor" ? `The deployment of this framework yields a statistically significant 20% reduction in evaluation cycles.` : undefined,
    },
    {
      question: `What are the primary structural bottlenecks when scaling ${topicTitle} across non-technical disciplines?`,
      rationale: `Identifies generalizability issues and maps out critical friction points for future scholars.`,
    }
  ];
}

function getMockSteps(level: AcademicLevel, topicTitle: string): any[] {
  const steps: any[] = [];
  
  // Lit review always comes first
  steps.push({
    title: "Academic Literature Mapping",
    description: `Synthesize historical literature and current research trends directly impacting: ${topicTitle}.`,
    assignedService: "literature",
    order: 1
  });

  if (level === "Bachelor") {
    steps.push(
      {
        title: "Experimental Methodology Draft",
        description: "Draft a basic structured framework outlining variables and key assumptions.",
        assignedService: "writing",
        order: 2
      },
      {
        title: "Basic Peer Evaluation Checklist",
        description: "Request a review check to validate the feasibility of primary hypotheses.",
        assignedService: "validation",
        order: 3
      },
      {
        title: "Descriptive Data Summary",
        description: "Execute basic statistical checks (means, standard deviations, distribution metrics).",
        assignedService: "stats",
        order: 4
      },
      {
        title: "Final Synthesis & Formatting",
        description: "Assemble the chapters, update references, and finalize the thesis body.",
        assignedService: "core",
        order: 5
      }
    );
  } else if (level === "Master") {
    steps.push(
      {
        title: "Comprehensive Research Proposal Draft",
        description: "Construct a formal research proposal with a clear problem definition.",
        assignedService: "writing",
        order: 2
      },
      {
        title: "Expert Validation Panel Review",
        description: "Deploy the validation survey to faculty experts and parse alignment scores.",
        assignedService: "validation",
        order: 3
      },
      {
        title: "Hypothesis Testing and Core Diagnostics",
        description: "Run structural regression controls and predictive validations on sample pools.",
        assignedService: "stats",
        order: 4
      },
      {
        title: "Thesis Draft Assembly",
        description: "Consolidate the lit review, empirical data, and analysis chapters into a coherent draft.",
        assignedService: "writing",
        order: 5
      },
      {
        title: "Core Editorial Verification",
        description: "Perform plagiarism and formatting audits against university specifications.",
        assignedService: "core",
        order: 6
      }
    );
  } else { // PhD
    steps.push(
      {
        title: "Ethics Board / IRB Approval Process",
        description: "Prepare and submit the formal IRB proposal detailing human participant protection protocols.",
        assignedService: "core",
        order: 2
      },
      {
        title: "Construct Empirical Research Instrument",
        description: "Build robust, double-blind questionnaires or experimental software interfaces.",
        assignedService: "writing",
        order: 3
      },
      {
        title: "Multi-stage Validation Framework Audit",
        description: "Utilize both qualitative expert consensus and structural construct validity checks.",
        assignedService: "validation",
        order: 4
      },
      {
        title: "Advanced Multivariable Statistical Modeling",
        description: "Deploy structural equation modeling (SEM) or advanced multivariate regression models.",
        assignedService: "stats",
        order: 5
      },
      {
        title: "Academic Journal Article Submission",
        description: "Draft and format a condensed version of the findings for submission to an indexed journal.",
        assignedService: "writing",
        order: 6
      },
      {
        title: "Comprehensive Dissertation Assembly",
        description: "Synthesize all doctoral papers and literature chapters into the final doctoral dissertation.",
        assignedService: "core",
        order: 7
      }
    );
  }
  return steps;
}


// Helper to initialize default workflow steps: Topic, ResearchQuestion, Literature, Methodology, Findings, Conclusion
function initializeDefaultWorkflowSteps(projectId: string) {
  const stepNames = ["Topic", "ResearchQuestion", "Literature", "Methodology", "Findings", "Conclusion"];
  const services: Record<string, "literature" | "writing" | "validation" | "stats" | "core"> = {
    Topic: "core",
    ResearchQuestion: "core",
    Literature: "literature",
    Methodology: "writing",
    Findings: "stats",
    Conclusion: "writing"
  };
  const descriptions: Record<string, string> = {
    Topic: "Brainstorm and select the core research topic.",
    ResearchQuestion: "Formulate a clear and testable research question.",
    Literature: "Search, synthesize, and review related literature and academic papers.",
    Methodology: "Define the research methodology, data collection, and analysis frameworks.",
    Findings: "Execute data analysis, statistical modeling, and document research findings.",
    Conclusion: "Consolidate the chapters and write up final conclusions and future scopes."
  };

  stepNames.forEach((stepName, index) => {
    const stepId = `step_${stepName.toLowerCase()}_${Date.now()}_${index}`;
    const newStep: WorkflowStep = {
      id: stepId,
      projectId: projectId,
      project_id: projectId,
      title: stepName,
      step_name: stepName,
      description: descriptions[stepName],
      assignedService: services[stepName],
      status: "Pending",
      is_completed: false,
      order: index + 1,
      updatedAt: new Date().toISOString(),
      completed_at: null
    };
    db.steps.push(newStep);
  });
  saveDatabase();
}

// Helpers for mock suggestions & validations
function getSuggestedTopicsMock(interest: string, academicLevel: string): string[] {
  const cleanInterest = interest || "Modern Technology";
  if (academicLevel === "PhD") {
    return [
      `An Epistemological Inquiry into the Ontological Foundations of ${cleanInterest}`,
      `A Multi-Agent Dynamic Model of ${cleanInterest} Ecosystems in High-Frequency Environments`,
      `The Socio-Technical Paradox of ${cleanInterest}: Empirical Paradigms and Systemic Thresholds`,
      `Theoretical Reconstruction of ${cleanInterest} in Decentered Global Networks`
    ];
  } else if (academicLevel === "Master") {
    return [
      `A Comparative Analysis of ${cleanInterest} in Developing Markets`,
      `Optimizing ${cleanInterest} Frameworks Using Applied Machine Learning Models`,
      `The Mediating Role of Organizational Culture on the Implementation of ${cleanInterest}`,
      `A Mixed-Methods Investigation of Stakeholder Trust in ${cleanInterest} Systems`
    ];
  } else {
    return [
      `The Impact of ${cleanInterest} on Small and Medium Enterprises`,
      `Exploring the Barriers to Adopting ${cleanInterest} in Modern Workplaces`,
      `A Descriptive Case Study of ${cleanInterest} in Urban Education`,
      `Understanding Consumer Perceptions of ${cleanInterest}: A Survey Study`
    ];
  }
}

function getSuggestedQuestionsMock(topic: string, academicLevel: string): string[] {
  const cleanTopic = topic || "the chosen academic research topic";
  if (academicLevel === "PhD") {
    return [
      `How does the integration of ${cleanTopic} alter the underlying systemic thresholds of decentralization?`,
      `To what extent can a multi-dimensional construct resolve the paradigm conflict inherent in ${cleanTopic}?`,
      `Under what conditions does ${cleanTopic} generate positive externalities in high-volatility environments?`,
      `What are the long-term ontological shifts in stakeholder governance under ${cleanTopic}?`
    ];
  } else if (academicLevel === "Master") {
    return [
      `What is the mediating effect of regulatory alignment on the relationship between ${cleanTopic} and organizational efficiency?`,
      `How can empirical predictive models be formulated to evaluate the performance of ${cleanTopic}?`,
      `To what degree does ${cleanTopic} foster sustainable growth among early-stage startups?`,
      `What are the critical success factors governing the lifecycle of ${cleanTopic} integrations?`
    ];
  } else {
    return [
      `To what extent does ${cleanTopic} impact daily operational outputs?`,
      `What are the primary operational challenges encountered when implementing ${cleanTopic}?`,
      `How do academic practitioners perceive the utility and feasibility of ${cleanTopic}?`,
      `What is the direct relationship between ${cleanTopic} and student retention rates?`
    ];
  }
}

function validateQuestionMock(question: string, academicLevel: string): { is_valid: boolean; feedback: string } {
  if (!question || question.trim().length < 15) {
    return {
      is_valid: false,
      feedback: "The question is too brief. A high-quality academic research question must be specific, contextualized, and fully formulated."
    };
  }
  if (!question.trim().endsWith("?")) {
    return {
      is_valid: false,
      feedback: "The research question must be phrased as a question and end with a question mark (?)."
    };
  }
  if (academicLevel === "PhD" && question.length < 30) {
    return {
      is_valid: false,
      feedback: "For a PhD level thesis, the research question requires greater depth, indicating theoretical integration or systemic complexity."
    };
  }
  return {
    is_valid: true,
    feedback: `Excellent! The question is clear, highly feasible, and demonstrates appropriate rigor and alignment with the expectations of a ${academicLevel} level dissertation.`
  };
}


// --- REST API ENDPOINTS ---

// New endpoints for events logging, Topic/Question suggest, select, validate, and Workflow complete-step

// 0. Log Event for Project
app.post("/projects/:id/events", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const { event_type, payload } = req.body;

  if (!event_type) {
    logApiRequest("POST", `/projects/${id}/events`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: event_type" });
  }

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/projects/${id}/events`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const newEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    project_id: id,
    event_type,
    payload: payload || {},
    timestamp: new Date().toISOString()
  };

  db.events.push(newEvent);
  saveDatabase();

  console.log(`[EVENT LOGGED] Project ${id} - Type: ${event_type}`, payload);

  logApiRequest("POST", `/projects/${id}/events`, caller, JSON.stringify(newEvent));
  res.status(201).json({ success: true, event: newEvent });
});

app.post("/api/projects/:id/events", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const { event_type, payload } = req.body;

  if (!event_type) {
    logApiRequest("POST", `/api/projects/${id}/events`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: event_type" });
  }

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/api/projects/${id}/events`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const newEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    project_id: id,
    event_type,
    payload: payload || {},
    timestamp: new Date().toISOString()
  };

  db.events.push(newEvent);
  saveDatabase();

  console.log(`[EVENT LOGGED] Project ${id} - Type: ${event_type}`, payload);

  logApiRequest("POST", `/api/projects/${id}/events`, caller, JSON.stringify(newEvent));
  res.status(201).json({ success: true, event: newEvent });
});

// 1. Topic Suggest
app.post("/projects/:id/topic/suggest", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const interest = req.body.interest || "";

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/projects/${id}/topic/suggest`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const academicLevel = project.academic_level || project.academicLevel || "Bachelor";
  const suggestions = getSuggestedTopicsMock(interest, academicLevel);

  logApiRequest("POST", `/projects/${id}/topic/suggest`, caller, JSON.stringify(req.body));
  res.json(suggestions);
});

app.post("/api/projects/:id/topic/suggest", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const interest = req.body.interest || "";

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/api/projects/${id}/topic/suggest`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const academicLevel = project.academic_level || project.academicLevel || "Bachelor";
  const suggestions = getSuggestedTopicsMock(interest, academicLevel);

  logApiRequest("POST", `/api/projects/${id}/topic/suggest`, caller, JSON.stringify(req.body));
  res.json(suggestions);
});

// 2. Topic Select
app.post("/projects/:id/topic/select", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const topic = req.body.topic;

  if (!topic) {
    logApiRequest("POST", `/projects/${id}/topic/select`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: topic" });
  }

  const projectIndex = db.projects.findIndex((p) => p.id === id);
  if (projectIndex === -1) {
    logApiRequest("POST", `/projects/${id}/topic/select`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  db.projects[projectIndex].topic = topic;
  if (db.projects[projectIndex].status === "Topic Selection") {
    db.projects[projectIndex].status = "Proposal";
  }
  db.projects[projectIndex].updatedAt = new Date().toISOString();

  // Also complete the "Topic" workflow step if it exists
  const topicStep = db.steps.find((s) => (s.projectId === id || s.project_id === id) && (s.step_name === "Topic" || s.title === "Topic"));
  if (topicStep) {
    topicStep.is_completed = true;
    topicStep.status = "Completed";
    topicStep.completed_at = new Date().toISOString();
    topicStep.updatedAt = new Date().toISOString();
  }

  saveDatabase();

  logApiRequest("POST", `/projects/${id}/topic/select`, caller, JSON.stringify(req.body));
  res.json({ success: true, project: db.projects[projectIndex] });
});

app.post("/api/projects/:id/topic/select", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const topic = req.body.topic;

  if (!topic) {
    logApiRequest("POST", `/api/projects/${id}/topic/select`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: topic" });
  }

  const projectIndex = db.projects.findIndex((p) => p.id === id);
  if (projectIndex === -1) {
    logApiRequest("POST", `/api/projects/${id}/topic/select`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  db.projects[projectIndex].topic = topic;
  if (db.projects[projectIndex].status === "Topic Selection") {
    db.projects[projectIndex].status = "Proposal";
  }
  db.projects[projectIndex].updatedAt = new Date().toISOString();

  // Also complete the "Topic" workflow step if it exists
  const topicStep = db.steps.find((s) => (s.projectId === id || s.project_id === id) && (s.step_name === "Topic" || s.title === "Topic"));
  if (topicStep) {
    topicStep.is_completed = true;
    topicStep.status = "Completed";
    topicStep.completed_at = new Date().toISOString();
    topicStep.updatedAt = new Date().toISOString();
  }

  saveDatabase();

  logApiRequest("POST", `/api/projects/${id}/topic/select`, caller, JSON.stringify(req.body));
  res.json({ success: true, project: db.projects[projectIndex] });
});

// 3. Question Suggest
app.post("/projects/:id/question/suggest", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/projects/${id}/question/suggest`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const topic = project.topic || "chosen topic";
  const academicLevel = project.academic_level || project.academicLevel || "Bachelor";
  const suggestions = getSuggestedQuestionsMock(topic, academicLevel);

  logApiRequest("POST", `/projects/${id}/question/suggest`, caller);
  res.json(suggestions);
});

app.post("/api/projects/:id/question/suggest", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/api/projects/${id}/question/suggest`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const topic = project.topic || "chosen topic";
  const academicLevel = project.academic_level || project.academicLevel || "Bachelor";
  const suggestions = getSuggestedQuestionsMock(topic, academicLevel);

  logApiRequest("POST", `/api/projects/${id}/question/suggest`, caller);
  res.json(suggestions);
});

// 4. Question Select
app.post("/projects/:id/question/select", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const question = req.body.question;

  if (!question) {
    logApiRequest("POST", `/projects/${id}/question/select`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: question" });
  }

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/projects/${id}/question/select`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const newQ: ResearchQuestion = {
    id: `q_${Date.now()}`,
    projectId: id,
    question,
    rationale: "Selected as final research question by the user.",
    status: "Approved",
    is_final: true,
  };

  db.questions.push(newQ);

  // Also complete the "ResearchQuestion" workflow step if it exists
  const rqStep = db.steps.find((s) => (s.projectId === id || s.project_id === id) && (s.step_name === "ResearchQuestion" || s.title === "ResearchQuestion"));
  if (rqStep) {
    rqStep.is_completed = true;
    rqStep.status = "Completed";
    rqStep.completed_at = new Date().toISOString();
    rqStep.updatedAt = new Date().toISOString();
  }

  saveDatabase();

  logApiRequest("POST", `/projects/${id}/question/select`, caller, JSON.stringify(newQ));
  res.status(201).json({ success: true, question: newQ });
});

app.post("/api/projects/:id/question/select", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const question = req.body.question;

  if (!question) {
    logApiRequest("POST", `/api/projects/${id}/question/select`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: question" });
  }

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/api/projects/${id}/question/select`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const newQ: ResearchQuestion = {
    id: `q_${Date.now()}`,
    projectId: id,
    question,
    rationale: "Selected as final research question by the user.",
    status: "Approved",
    is_final: true,
  };

  db.questions.push(newQ);

  // Also complete the "ResearchQuestion" workflow step if it exists
  const rqStep = db.steps.find((s) => (s.projectId === id || s.project_id === id) && (s.step_name === "ResearchQuestion" || s.title === "ResearchQuestion"));
  if (rqStep) {
    rqStep.is_completed = true;
    rqStep.status = "Completed";
    rqStep.completed_at = new Date().toISOString();
    rqStep.updatedAt = new Date().toISOString();
  }

  saveDatabase();

  logApiRequest("POST", `/api/projects/${id}/question/select`, caller, JSON.stringify(newQ));
  res.status(201).json({ success: true, question: newQ });
});

// 5. Question Validate
app.post("/projects/:id/question/validate", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const question = req.body.question;

  if (!question) {
    logApiRequest("POST", `/projects/${id}/question/validate`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: question" });
  }

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/projects/${id}/question/validate`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const academicLevel = project.academic_level || project.academicLevel || "Bachelor";
  const validationResult = validateQuestionMock(question, academicLevel);

  logApiRequest("POST", `/projects/${id}/question/validate`, caller, JSON.stringify(req.body));
  res.json(validationResult);
});

app.post("/api/projects/:id/question/validate", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const question = req.body.question;

  if (!question) {
    logApiRequest("POST", `/api/projects/${id}/question/validate`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: question" });
  }

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/api/projects/${id}/question/validate`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const academicLevel = project.academic_level || project.academicLevel || "Bachelor";
  const validationResult = validateQuestionMock(question, academicLevel);

  logApiRequest("POST", `/api/projects/${id}/question/validate`, caller, JSON.stringify(req.body));
  res.json(validationResult);
});

// 6. Workflow GET
app.get("/projects/:id/workflow", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("GET", `/projects/${id}/workflow`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const steps = db.steps.filter((s) => s.projectId === id || s.project_id === id).sort((a, b) => a.order - b.order);

  logApiRequest("GET", `/projects/${id}/workflow`, caller);
  res.json(steps);
});

app.get("/api/projects/:id/workflow", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("GET", `/api/projects/${id}/workflow`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const steps = db.steps.filter((s) => s.projectId === id || s.project_id === id).sort((a, b) => a.order - b.order);

  logApiRequest("GET", `/api/projects/${id}/workflow`, caller);
  res.json(steps);
});

// 7. Workflow Complete Step
app.post("/projects/:id/workflow/complete-step", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const step_name = req.body.step_name;

  if (!step_name) {
    logApiRequest("POST", `/projects/${id}/workflow/complete-step`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: step_name" });
  }

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/projects/${id}/workflow/complete-step`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const step = db.steps.find((s) => (s.projectId === id || s.project_id === id) && (s.step_name === step_name || s.title === step_name));
  if (!step) {
    logApiRequest("POST", `/projects/${id}/workflow/complete-step`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: `Workflow step not found: ${step_name}` });
  }

  step.is_completed = true;
  step.status = "Completed";
  step.completed_at = new Date().toISOString();
  step.updatedAt = new Date().toISOString();

  saveDatabase();

  logApiRequest("POST", `/projects/${id}/workflow/complete-step`, caller, JSON.stringify(req.body));
  res.json({ success: true, step });
});

app.post("/api/projects/:id/workflow/complete-step", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const step_name = req.body.step_name;

  if (!step_name) {
    logApiRequest("POST", `/api/projects/${id}/workflow/complete-step`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: step_name" });
  }

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/api/projects/${id}/workflow/complete-step`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const step = db.steps.find((s) => (s.projectId === id || s.project_id === id) && (s.step_name === step_name || s.title === step_name));
  if (!step) {
    logApiRequest("POST", `/api/projects/${id}/workflow/complete-step`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: `Workflow step not found: ${step_name}` });
  }

  step.is_completed = true;
  step.status = "Completed";
  step.completed_at = new Date().toISOString();
  step.updatedAt = new Date().toISOString();

  saveDatabase();

  logApiRequest("POST", `/api/projects/${id}/workflow/complete-step`, caller, JSON.stringify(req.body));
  res.json({ success: true, step });
});


// 1. PROJECTS

// GET all projects (and list all projects for a user) - Unprefixed
app.get("/projects", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const userId = (req.query.user_id as string) || "user_123";
  logApiRequest("GET", `/projects?user_id=${userId}`, caller);
  
  // Ensure existing seeded projects have a default user_id so they appear for user_123
  db.projects.forEach((p) => {
    if (!p.user_id) {
      p.user_id = "user_123";
    }
  });
  saveDatabase();

  const userProjects = db.projects.filter((p) => p.user_id === userId);
  res.json(userProjects);
});

// GET all projects - Prefix api/
app.get("/api/projects", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  logApiRequest("GET", "/api/projects", caller);
  res.json(db.projects);
});

// GET specific project details - Unprefixed
app.get("/projects/:id", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("GET", `/projects/${id}`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const topics = db.topics.filter((t) => t.projectId === id);
  const questions = db.questions.filter((q) => q.projectId === id);
  const steps = db.steps.filter((s) => s.projectId === id || s.project_id === id).sort((a, b) => a.order - b.order);

  logApiRequest("GET", `/projects/${id}`, caller);
  res.json({
    ...project,
    topics,
    questions,
    steps,
  });
});

// GET specific project details - Prefix api/
app.get("/api/projects/:id", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("GET", `/api/projects/${id}`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const topics = db.topics.filter((t) => t.projectId === id);
  const questions = db.questions.filter((q) => q.projectId === id);
  const steps = db.steps.filter((s) => s.projectId === id || s.project_id === id).sort((a, b) => a.order - b.order);

  logApiRequest("GET", `/api/projects/${id}`, caller);
  res.json({
    ...project,
    topics,
    questions,
    steps,
  });
});

// POST create project - Unprefixed
app.post("/projects", async (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const title = req.body.title;
  const discipline = req.body.discipline;
  const academic_level = req.body.academic_level || req.body.academicLevel;
  const student_name = req.body.student_name || req.body.studentName || "Amadou Diallo";
  const initial_idea = req.body.initial_idea || req.body.initialIdea || "";
  const user_id = req.body.user_id || "user_123";

  if (!title || !discipline || !academic_level) {
    logApiRequest("POST", "/projects", caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required fields: title, discipline, academic_level" });
  }

  const projectId = `proj_${Date.now()}`;
  const newProject: Project = {
    id: projectId,
    title,
    studentName: student_name,
    academicLevel: academic_level as AcademicLevel,
    academic_level: academic_level,
    discipline,
    status: "Topic Selection",
    initialIdea: initial_idea,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user_id: user_id,
  };

  db.projects.push(newProject);
  initializeDefaultWorkflowSteps(projectId);
  saveDatabase();

  logApiRequest("POST", "/projects", caller, JSON.stringify(newProject));
  res.status(201).json(newProject);
});

// POST create project - Prefix api/
app.post("/api/projects", async (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const title = req.body.title;
  const discipline = req.body.discipline;
  const academic_level = req.body.academic_level || req.body.academicLevel;
  const student_name = req.body.student_name || req.body.studentName || "Amadou Diallo";
  const initial_idea = req.body.initial_idea || req.body.initialIdea || "";
  const user_id = req.body.user_id || "user_123";

  if (!title || !discipline || !academic_level) {
    logApiRequest("POST", "/api/projects", caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required fields: title, discipline, academic_level (or academicLevel)" });
  }

  const projectId = `proj_${Date.now()}`;
  const newProject: Project = {
    id: projectId,
    title,
    studentName: student_name,
    academicLevel: academic_level as AcademicLevel,
    academic_level: academic_level,
    discipline,
    status: "Topic Selection",
    initialIdea: initial_idea,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user_id: user_id,
  };

  db.projects.push(newProject);
  initializeDefaultWorkflowSteps(projectId);
  saveDatabase();

  logApiRequest("POST", "/api/projects", caller, JSON.stringify(newProject));
  res.status(201).json(newProject);
});

// PUT update project
app.put("/api/projects/:id", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const { title, studentName, academicLevel, discipline, status, initialIdea } = req.body;

  const projectIndex = db.projects.findIndex((p) => p.id === id);
  if (projectIndex === -1) {
    logApiRequest("PUT", `/api/projects/${id}`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const updatedProject = {
    ...db.projects[projectIndex],
    title: title !== undefined ? title : db.projects[projectIndex].title,
    studentName: studentName !== undefined ? studentName : db.projects[projectIndex].studentName,
    academicLevel: academicLevel !== undefined ? academicLevel : db.projects[projectIndex].academicLevel,
    discipline: discipline !== undefined ? discipline : db.projects[projectIndex].discipline,
    status: status !== undefined ? status : db.projects[projectIndex].status,
    initialIdea: initialIdea !== undefined ? initialIdea : db.projects[projectIndex].initialIdea,
    updatedAt: new Date().toISOString(),
  };

  db.projects[projectIndex] = updatedProject;
  saveDatabase();

  logApiRequest("PUT", `/api/projects/${id}`, caller, JSON.stringify(req.body));
  res.json(updatedProject);
});

// DELETE project
app.delete("/api/projects/:id", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;

  const initialCount = db.projects.length;
  db.projects = db.projects.filter((p) => p.id !== id);
  
  if (db.projects.length === initialCount) {
    logApiRequest("DELETE", `/api/projects/${id}`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  // Cascading deletion
  db.topics = db.topics.filter((t) => t.projectId !== id);
  db.questions = db.questions.filter((q) => q.projectId !== id);
  db.steps = db.steps.filter((s) => s.projectId !== id);
  
  saveDatabase();

  logApiRequest("DELETE", `/api/projects/${id}`, caller);
  res.json({ message: "Project and associated items deleted successfully" });
});


// 2. TOPICS
// GET topics for a project
app.get("/api/projects/:id/topics", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const topics = db.topics.filter((t) => t.projectId === id);
  logApiRequest("GET", `/api/projects/${id}/topics`, caller);
  res.json(topics);
});

// POST add a custom topic
app.post("/api/projects/:id/topics", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const { title, description, feasibilityScore, relevanceScore, originalityScore, feedback } = req.body;

  if (!title || !description) {
    logApiRequest("POST", `/api/projects/${id}/topics`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required fields: title, description" });
  }

  const newTopic: Topic = {
    id: `topic_${Date.now()}`,
    projectId: id,
    title,
    description,
    selected: false,
    feasibilityScore: Number(feasibilityScore) || 5,
    relevanceScore: Number(relevanceScore) || 5,
    originalityScore: Number(originalityScore) || 5,
    feedback: feedback || "",
  };

  db.topics.push(newTopic);
  saveDatabase();

  logApiRequest("POST", `/api/projects/${id}/topics`, caller, JSON.stringify(newTopic));
  res.status(201).json(newTopic);
});

// POST select topic
app.post("/api/projects/:id/select-topic", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const { topicId } = req.body;

  if (!topicId) {
    logApiRequest("POST", `/api/projects/${id}/select-topic`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required field: topicId" });
  }

  // Unselect all other topics for this project
  db.topics = db.topics.map((t) => {
    if (t.projectId === id) {
      return { ...t, selected: t.id === topicId };
    }
    return t;
  });

  // Automatically transition project status to 'Proposal'
  const projectIndex = db.projects.findIndex((p) => p.id === id);
  if (projectIndex !== -1 && db.projects[projectIndex].status === "Topic Selection") {
    db.projects[projectIndex].status = "Proposal";
    db.projects[projectIndex].updatedAt = new Date().toISOString();
  }

  saveDatabase();

  logApiRequest("POST", `/api/projects/${id}/select-topic`, caller, JSON.stringify(req.body));
  res.json({ message: "Topic selected successfully and project status promoted.", topics: db.topics.filter(t => t.projectId === id) });
});

// POST generate topics using Gemini
app.post("/api/projects/:id/topics/generate", async (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/api/projects/${id}/topics/generate`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Run in mock mode
    const mockTopics = getMockTopics(project.discipline, project.academicLevel, project.initialIdea || "");
    const generated: Topic[] = mockTopics.map((t, idx) => ({
      id: `topic_ai_${Date.now()}_${idx}`,
      projectId: id,
      title: t.title,
      description: t.description,
      selected: false,
      feasibilityScore: t.feasibilityScore,
      relevanceScore: t.relevanceScore,
      originalityScore: t.originalityScore,
      feedback: t.feedback,
    }));

    db.topics.push(...generated);
    saveDatabase();
    logApiRequest("POST", `/api/projects/${id}/topics/generate`, caller, "Mock generated topics (API Key missing)");
    return res.json(generated);
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an elite academic advisor. Based on the following project information:
Discipline: ${project.discipline}
Academic Level: ${project.academicLevel} (rigor must correspond to this level)
Initial Idea: ${project.initialIdea || "None provided"}

Generate exactly 3 highly compelling research topic options.
For each topic, provide:
1. Title (academic, specific, and clear)
2. Detailed description outlining the scope and core questions
3. Feasibility Score (1-10)
4. Relevance Score (1-10)
5. Originality Score (1-10)
6. A paragraph of constructive feedback outlining methodological steps and potential challenges for a ${project.academicLevel} student.

Return the result STRICTLY as a JSON array matching this structure:
[
  {
    "title": "Topic Title Here",
    "description": "Topic description...",
    "feasibilityScore": 8,
    "relevanceScore": 9,
    "originalityScore": 7,
    "feedback": "Methodological feedback..."
  }
]
Do not include any markdown wrap or text outside of the JSON payload.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const parsed = JSON.parse(text);

    const generated: Topic[] = parsed.map((t: any, idx: number) => ({
      id: `topic_ai_${Date.now()}_${idx}`,
      projectId: id,
      title: t.title,
      description: t.description,
      selected: false,
      feasibilityScore: Number(t.feasibilityScore) || 7,
      relevanceScore: Number(t.relevanceScore) || 7,
      originalityScore: Number(t.originalityScore) || 7,
      feedback: t.feedback || "",
    }));

    db.topics.push(...generated);
    saveDatabase();

    logApiRequest("POST", `/api/projects/${id}/topics/generate`, caller, `Gemini generated ${generated.length} topics successfully.`);
    res.json(generated);
  } catch (error: any) {
    console.error("Gemini Topic Generation Error:", error);
    // Fallback to mock
    const mockTopics = getMockTopics(project.discipline, project.academicLevel, project.initialIdea || "");
    const generated: Topic[] = mockTopics.map((t, idx) => ({
      id: `topic_ai_err_${Date.now()}_${idx}`,
      projectId: id,
      title: t.title,
      description: t.description,
      selected: false,
      feasibilityScore: t.feasibilityScore,
      relevanceScore: t.relevanceScore,
      originalityScore: t.originalityScore,
      feedback: `Generated in safety fallback. Note: Gemini encountered an issue (${error.message || error}). ${t.feedback}`,
    }));
    db.topics.push(...generated);
    saveDatabase();
    logApiRequest("POST", `/api/projects/${id}/topics/generate`, caller, `Error generating topics, fell back to mock. Error: ${error.message}`);
    res.json(generated);
  }
});


// 3. RESEARCH QUESTIONS
// GET questions for a project
app.get("/api/projects/:id/questions", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const questions = db.questions.filter((q) => q.projectId === id);
  logApiRequest("GET", `/api/projects/${id}/questions`, caller);
  res.json(questions);
});

// POST add a custom question
app.post("/api/projects/:id/questions", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const { question, rationale, hypothesis } = req.body;

  if (!question || !rationale) {
    logApiRequest("POST", `/api/projects/${id}/questions`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required fields: question, rationale" });
  }

  const newQuestion: ResearchQuestion = {
    id: `q_${Date.now()}`,
    projectId: id,
    question,
    rationale,
    hypothesis: hypothesis || undefined,
    status: "Draft",
  };

  db.questions.push(newQuestion);
  saveDatabase();

  logApiRequest("POST", `/api/projects/${id}/questions`, caller, JSON.stringify(newQuestion));
  res.status(201).json(newQuestion);
});

// PUT update research question
app.put("/api/projects/:id/questions/:qId", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id, qId } = req.params;
  const { question, rationale, hypothesis, status } = req.body;

  const qIdx = db.questions.findIndex((q) => q.id === qId && q.projectId === id);
  if (qIdx === -1) {
    logApiRequest("PUT", `/api/projects/${id}/questions/${qId}`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Research question not found in this project" });
  }

  const updatedQ = {
    ...db.questions[qIdx],
    question: question !== undefined ? question : db.questions[qIdx].question,
    rationale: rationale !== undefined ? rationale : db.questions[qIdx].rationale,
    hypothesis: hypothesis !== undefined ? hypothesis : db.questions[qIdx].hypothesis,
    status: status !== undefined ? status : db.questions[qIdx].status,
  };

  db.questions[qIdx] = updatedQ;
  saveDatabase();

  logApiRequest("PUT", `/api/projects/${id}/questions/${qId}`, caller, JSON.stringify(req.body));
  res.json(updatedQ);
});

// DELETE research question
app.delete("/api/projects/:id/questions/:qId", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id, qId } = req.params;

  const initialCount = db.questions.length;
  db.questions = db.questions.filter((q) => !(q.id === qId && q.projectId === id));

  if (db.questions.length === initialCount) {
    logApiRequest("DELETE", `/api/projects/${id}/questions/${qId}`, caller, undefined, 404);
    return res.status(404).json({ error: "Research question not found" });
  }

  saveDatabase();
  logApiRequest("DELETE", `/api/projects/${id}/questions/${qId}`, caller);
  res.json({ message: "Research question deleted successfully" });
});

// POST generate research questions using Gemini
app.post("/api/projects/:id/questions/generate", async (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/api/projects/${id}/questions/generate`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const selectedTopic = db.topics.find((t) => t.projectId === id && t.selected);
  if (!selectedTopic) {
    logApiRequest("POST", `/api/projects/${id}/questions/generate`, caller, undefined, 400);
    return res.status(400).json({ error: "No topic has been selected yet. Please select a topic first." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    const mockQs = getMockQuestions(project.academicLevel, selectedTopic.title);
    const generated: ResearchQuestion[] = mockQs.map((q, idx) => ({
      id: `q_ai_${Date.now()}_${idx}`,
      projectId: id,
      question: q.question,
      rationale: q.rationale,
      hypothesis: q.hypothesis,
      status: "Draft",
    }));

    db.questions.push(...generated);
    saveDatabase();
    logApiRequest("POST", `/api/projects/${id}/questions/generate`, caller, "Mock generated questions (API Key missing)");
    return res.json(generated);
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an elite research advisor advising a ${project.academicLevel} student.
Discipline: ${project.discipline}
Research Topic: ${selectedTopic.title}
Topic Details: ${selectedTopic.description}

Generate exactly 2 high-quality research questions corresponding to the academic rigor of a ${project.academicLevel} student.
For each question, provide:
1. The question (must be clear, researchable, and focused)
2. Rationale (why this question is theoretically or practically significant)
3. Hypothesis (ONLY if academic level is Master or PhD, suggesting a testable research hypothesis)

Return the result STRICTLY as a JSON array matching this structure:
[
  {
    "question": "What is the relationship between...",
    "rationale": "This question seeks to uncover...",
    "hypothesis": "It is hypothesized that..." (optional, omit for Bachelor)
  }
]
Do not include any markdown wrap or text outside of the JSON payload.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const parsed = JSON.parse(text);

    const generated: ResearchQuestion[] = parsed.map((q: any, idx: number) => ({
      id: `q_ai_${Date.now()}_${idx}`,
      projectId: id,
      question: q.question,
      rationale: q.rationale,
      hypothesis: q.hypothesis || undefined,
      status: "Draft",
    }));

    db.questions.push(...generated);
    saveDatabase();

    logApiRequest("POST", `/api/projects/${id}/questions/generate`, caller, `Gemini generated ${generated.length} questions successfully.`);
    res.json(generated);
  } catch (error: any) {
    console.error("Gemini Question Generation Error:", error);
    // Fallback
    const mockQs = getMockQuestions(project.academicLevel, selectedTopic.title);
    const generated: ResearchQuestion[] = mockQs.map((q, idx) => ({
      id: `q_ai_err_${Date.now()}_${idx}`,
      projectId: id,
      question: q.question,
      rationale: q.rationale,
      hypothesis: q.hypothesis,
      status: "Draft",
    }));
    db.questions.push(...generated);
    saveDatabase();
    logApiRequest("POST", `/api/projects/${id}/questions/generate`, caller, `Error generating questions, fell back to mock. Error: ${error.message}`);
    res.json(generated);
  }
});


// 4. WORKFLOW STEPS (CRITICAL end points for literature, writing, validation, stats services)
// GET all steps for a project
app.get("/api/projects/:id/steps", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const steps = db.steps.filter((s) => s.projectId === id).sort((a, b) => a.order - b.order);
  logApiRequest("GET", `/api/projects/${id}/steps`, caller);
  res.json(steps);
});

// POST add custom step
app.post("/api/projects/:id/steps", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;
  const { title, description, assignedService, order } = req.body;

  if (!title || !description || !assignedService) {
    logApiRequest("POST", `/api/projects/${id}/steps`, caller, JSON.stringify(req.body), 400);
    return res.status(400).json({ error: "Missing required fields: title, description, assignedService" });
  }

  const newStep: WorkflowStep = {
    id: `step_${Date.now()}`,
    projectId: id,
    title,
    description,
    assignedService,
    status: "Pending",
    order: Number(order) || (db.steps.filter((s) => s.projectId === id).length + 1),
    updatedAt: new Date().toISOString(),
  };

  db.steps.push(newStep);
  saveDatabase();

  logApiRequest("POST", `/api/projects/${id}/steps`, caller, JSON.stringify(newStep));
  res.status(201).json(newStep);
});

// PUT update step (This is the primary hook other services like validation, stats call)
app.put("/api/projects/:id/steps/:stepId", (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id, stepId } = req.params;
  const { status, title, description, assignedService, order } = req.body;

  const stepIdx = db.steps.findIndex((s) => s.id === stepId && s.projectId === id);
  if (stepIdx === -1) {
    logApiRequest("PUT", `/api/projects/${id}/steps/${stepId}`, caller, JSON.stringify(req.body), 404);
    return res.status(404).json({ error: "Workflow step not found in this project" });
  }

  const updatedStep = {
    ...db.steps[stepIdx],
    status: status !== undefined ? status : db.steps[stepIdx].status,
    title: title !== undefined ? title : db.steps[stepIdx].title,
    description: description !== undefined ? description : db.steps[stepIdx].description,
    assignedService: assignedService !== undefined ? assignedService : db.steps[stepIdx].assignedService,
    order: order !== undefined ? Number(order) : db.steps[stepIdx].order,
    updatedAt: new Date().toISOString(),
  };

  db.steps[stepIdx] = updatedStep;

  // Let's also dynamically update the project status if certain key service steps are completed!
  const projectIndex = db.projects.findIndex((p) => p.id === id);
  if (projectIndex !== -1) {
    const project = db.projects[projectIndex];
    // Simple state-machine promotion
    if (caller === "literature" && status === "Completed" && project.status === "Proposal") {
      db.projects[projectIndex].status = "Literature Review";
    } else if (caller === "writing" && status === "Completed" && project.status === "Literature Review") {
      db.projects[projectIndex].status = "Methodology";
    } else if (caller === "stats" && status === "Completed" && project.status === "Methodology") {
      db.projects[projectIndex].status = "Writing";
    } else if (caller === "validation" && status === "Completed" && project.status === "Writing") {
      db.projects[projectIndex].status = "Validation";
    }
    db.projects[projectIndex].updatedAt = new Date().toISOString();
  }

  saveDatabase();

  logApiRequest("PUT", `/api/projects/${id}/steps/${stepId}`, caller, JSON.stringify(req.body));
  res.json(updatedStep);
});

// POST generate custom steps based on Academic rigor
app.post("/api/projects/:id/steps/generate", async (req, res) => {
  const caller = (req.query.caller as string) || "external";
  const { id } = req.params;

  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    logApiRequest("POST", `/api/projects/${id}/steps/generate`, caller, undefined, 404);
    return res.status(404).json({ error: "Project not found" });
  }

  const selectedTopic = db.topics.find((t) => t.projectId === id && t.selected);
  const topicTitle = selectedTopic ? selectedTopic.title : project.title;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    const mockSteps = getMockSteps(project.academicLevel, topicTitle);
    const generated: WorkflowStep[] = mockSteps.map((s, idx) => ({
      id: `step_ai_${Date.now()}_${idx}`,
      projectId: id,
      title: s.title,
      description: s.description,
      assignedService: s.assignedService,
      status: "Pending",
      order: s.order,
      updatedAt: new Date().toISOString(),
    }));

    db.steps = db.steps.filter((s) => s.projectId !== id); // clear existing steps on regenerate
    db.steps.push(...generated);
    saveDatabase();
    logApiRequest("POST", `/api/projects/${id}/steps/generate`, caller, "Mock generated workflow steps (API Key missing)");
    return res.json(generated);
  }

  try {
    const ai = getGeminiClient();
    const prompt = `You are an elite PhD Academic coordinator. Plan out the perfect microservice-orchestrated workflow steps for a student thesis project.
Discipline: ${project.discipline}
Academic Level: ${project.academicLevel}
Topic Title: ${topicTitle}

You must assign each step to one of these core microservices:
- 'literature': Search, summarize, and map out academic theories and sources
- 'writing': Draft, format, check references, and structure chapters
- 'validation': Expert double-blind checks, qualitative code verification, and feedback reviews
- 'stats': Quantitative analysis, regression models, SPSS/R computations, descriptive statistics, hypothesis testings
- 'core': Admin tasks, IRB ethics approvals, advisor checkpoints, defense prep

Provide a chronological sequence of steps.
- For a Bachelor level, create exactly 5 steps focusing on simple checkpoints.
- For a Master level, create exactly 6-7 steps with moderate complexity.
- For a PhD level, create exactly 7-8 steps with extremely high rigor (including IRB approval, journal submission, defense).

For each step provide:
1. Title (brief and directive)
2. Description (clear academic task instruction)
3. assignedService (one of: literature, writing, validation, stats, core)
4. order (1, 2, 3...)

Return the result STRICTLY as a JSON array matching this structure:
[
  {
    "title": "Conduct Systematic Literature Search",
    "description": "Gather 20 key indexed publications on...",
    "assignedService": "literature",
    "order": 1
  }
]
Do not include any markdown wrap or text outside of the JSON payload.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const parsed = JSON.parse(text);

    const generated: WorkflowStep[] = parsed.map((s: any, idx: number) => ({
      id: `step_ai_${Date.now()}_${idx}`,
      projectId: id,
      title: s.title,
      description: s.description,
      assignedService: s.assignedService || "core",
      status: "Pending",
      order: Number(s.order) || (idx + 1),
      updatedAt: new Date().toISOString(),
    }));

    db.steps = db.steps.filter((s) => s.projectId !== id); // overwrite old steps
    db.steps.push(...generated);
    saveDatabase();

    logApiRequest("POST", `/api/projects/${id}/steps/generate`, caller, `Gemini generated ${generated.length} workflow steps successfully.`);
    res.json(generated);
  } catch (error: any) {
    console.error("Gemini Step Generation Error:", error);
    // Fallback
    const mockSteps = getMockSteps(project.academicLevel, topicTitle);
    const generated: WorkflowStep[] = mockSteps.map((s, idx) => ({
      id: `step_ai_err_${Date.now()}_${idx}`,
      projectId: id,
      title: s.title,
      description: s.description,
      assignedService: s.assignedService,
      status: "Pending",
      order: s.order,
      updatedAt: new Date().toISOString(),
    }));
    db.steps = db.steps.filter((s) => s.projectId !== id);
    db.steps.push(...generated);
    saveDatabase();
    logApiRequest("POST", `/api/projects/${id}/steps/generate`, caller, `Error generating steps, fell back to mock. Error: ${error.message}`);
    res.json(generated);
  }
});


// 5. DIAGNOSTICS & SYSTEM LOGS
app.get("/api/logs", (req, res) => {
  res.json(apiLogs);
});

app.post("/api/logs/clear", (req, res) => {
  apiLogs = [];
  res.json({ message: "Logs cleared" });
});


// --- OPENAPI SPECIFICATION & SWAGGER UI DOCS ---

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Bounkoun Core API",
    description: "Orchestration Microservice for academic thesis workflow, project progression, research questions validation, and event streaming logs.",
    version: "1.0.0"
  },
  servers: [
    {
      url: "/",
      description: "Local dev server"
    }
  ],
  paths: {
    "/projects": {
      get: {
        summary: "List all projects",
        description: "Fetch a list of active research projects filtered by user (defaults to mock user_id: 'user_123').",
        parameters: [
          {
            name: "user_id",
            in: "query",
            description: "The user identifier to list projects for",
            required: false,
            schema: {
              type: "string",
              default: "user_123"
            }
          }
        ],
        responses: {
          "200": {
            description: "Successful query",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Project"
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create a new project",
        description: "Creates a new thesis project and automatically initializes default workflow steps (Topic, ResearchQuestion, Literature, Methodology, Findings, Conclusion).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "discipline", "academic_level"],
                properties: {
                  title: {
                    type: "string",
                    example: "Decentralized Federated Learning"
                  },
                  discipline: {
                    type: "string",
                    example: "Computer Science"
                  },
                  academic_level: {
                    type: "string",
                    enum: ["Bachelor", "Master", "PhD"],
                    example: "Master"
                  },
                  student_name: {
                    type: "string",
                    example: "Amadou Diallo"
                  },
                  initial_idea: {
                    type: "string",
                    example: "A privacy-preserving approach for clinical datasets."
                  },
                  user_id: {
                    type: "string",
                    example: "user_123"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Project created and default steps initialized successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Project"
                }
              }
            }
          }
        }
      }
    },
    "/projects/{id}": {
      get: {
        summary: "Get single project detail",
        description: "Returns the project metadata, along with full loaded lists of suggested topics, questions, and sorted workflow steps.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "Single project detail package loaded",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          },
          "404": {
            description: "Project not found"
          }
        }
      }
    },
    "/projects/{id}/topic/suggest": {
      post: {
        summary: "Suggest academic topics",
        description: "Returns 3-4 compelling suggested research topics based on general text field interest and project's academic level.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  interest: {
                    type: "string",
                    example: "Privacy preserving machine learning"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Suggested topics generated",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "string"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/projects/{id}/topic/select": {
      post: {
        summary: "Select research topic",
        description: "Saves the chosen topic onto the project model, promotes project status to 'Proposal', and automatically completes the Topic workflow step.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["topic"],
                properties: {
                  topic: {
                    type: "string",
                    example: "Comparative Analysis of Federated Learning in Healthcare Systems"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Topic updated successfully"
          }
        }
      }
    },
    "/projects/{id}/question/suggest": {
      post: {
        summary: "Suggest research questions",
        description: "Generates 3-4 candidate academic questions corresponding to the selected project topic and the degree difficulty level.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "Questions suggested successfully"
          }
        }
      }
    },
    "/projects/{id}/question/select": {
      post: {
        summary: "Finalize research question",
        description: "Saves the chosen question as an active ResearchQuestion model with is_final = true, and auto-completes the ResearchQuestion step.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["question"],
                properties: {
                  question: {
                    type: "string",
                    example: "How can privacy-preserving parameters balance clinical dataset utility in high-performance federated setups?"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Question finalized successfully"
          }
        }
      }
    },
    "/projects/{id}/question/validate": {
      post: {
        summary: "Validate research question alignment",
        description: "Reviews if a drafted research question is sufficiently clear, feasible, and matches the rigor expectations of the academic level.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["question"],
                properties: {
                  question: {
                    type: "string",
                    example: "Is federated learning good?"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Rigor feedback report generated"
          }
        }
      }
    },
    "/projects/{id}/workflow": {
      get: {
        summary: "Get workflow steps",
        description: "Returns list of all default or generated workflow steps for the project with active statuses and completion logs.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        responses: {
          "200": {
            description: "List of steps sorted chronologically"
          }
        }
      }
    },
    "/projects/{id}/workflow/complete-step": {
      post: {
        summary: "Complete specific step",
        description: "Marks a specific workflow step as completed, setting is_completed = true and completed_at to the current server timestamp.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["step_name"],
                properties: {
                  step_name: {
                    type: "string",
                    example: "Literature"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Step completion logged successfully"
          }
        }
      }
    },
    "/projects/{id}/events": {
      post: {
        summary: "Post structured tracking event",
        description: "Accepts real-time events from student interfaces (such as project_created, topic_selected, question_finalized) and saves them to the logging stack.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string"
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["event_type"],
                properties: {
                  event_type: {
                    type: "string",
                    example: "question_finalized"
                  },
                  payload: {
                    type: "object",
                    example: {
                      selected_question: "How can privacy-preserving parameters balance clinical dataset utility?",
                      confidence_level: "High",
                      user_agent: "Mozilla/5.0"
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Event logged successfully"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Project: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          studentName: { type: "string" },
          academicLevel: { type: "string" },
          academic_level: { type: "string" },
          discipline: { type: "string" },
          status: { type: "string" },
          initialIdea: { type: "string" },
          topic: { type: "string" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
          user_id: { type: "string" }
        }
      }
    }
  }
};

app.get("/openapi.json", (req, res) => {
  res.json(openApiSpec);
});

app.get("/api/openapi.json", (req, res) => {
  res.json(openApiSpec);
});

app.get("/docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Bounkoun Core API - Swagger UI Documentation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; background-color: #fafafa; }
        .header { background-color: #0f172a; padding: 16px 24px; color: #fff; display: flex; align-items: center; justify-content: space-between; font-family: sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { margin: 0; font-size: 1.25rem; font-weight: 600; letter-spacing: -0.025em; }
        .header a { color: #38bdf8; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
        .header a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎓 Bounkoun Core Orchestrator - Interactive API Docs</h1>
        <a href="/" target="_self">← Go to Interactive Console</a>
      </div>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            layout: "BaseLayout",
            defaultModelsExpandDepth: -1
          });
        };
      </script>
    </body>
    </html>
  `);
});


// --- VITE MIDDLEWARE CONFIGURATION ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bounkoun Core running on http://localhost:${PORT}`);
  });
}

startServer();
