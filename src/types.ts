export type AcademicLevel = 'Bachelor' | 'Master' | 'PhD';

export interface Project {
  id: string;
  title: string;
  studentName: string;
  academicLevel: AcademicLevel;
  academic_level?: string; // support PostgreSQL snake_case naming
  discipline: string;
  status: 'Topic Selection' | 'Proposal' | 'Literature Review' | 'Methodology' | 'Writing' | 'Validation' | 'Completed';
  initialIdea?: string;
  createdAt: string;
  updatedAt: string;
  user_id?: string; // support mocked user identification
  topic?: string; // selected topic field as requested
}

export interface Topic {
  id: string;
  projectId: string;
  title: string;
  description: string;
  selected: boolean;
  feasibilityScore: number; // 1-10
  relevanceScore: number;   // 1-10
  originalityScore: number; // 1-10
  feedback?: string;
}

export interface ResearchQuestion {
  id: string;
  projectId: string;
  question: string;
  rationale: string;
  hypothesis?: string;
  status: 'Draft' | 'Approved' | 'Revised';
  is_final?: boolean; // support checking for final questions
}

export interface WorkflowStep {
  id: string;
  projectId: string;
  project_id?: string; // support PostgreSQL snake_case mapping
  title: string;
  step_name?: string; // support user specified field
  description: string;
  assignedService: 'literature' | 'writing' | 'validation' | 'stats' | 'core';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked';
  is_completed?: boolean; // support user specified field
  order: number;
  updatedAt: string;
  completed_at?: string | null; // support user specified field
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  callerService: string; // 'literature' | 'writing' | 'validation' | 'stats' | 'external'
  payload?: string;
  statusCode: number;
}
