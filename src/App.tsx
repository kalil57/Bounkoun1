import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  Terminal, 
  Activity, 
  FileText, 
  CheckCircle, 
  Play, 
  User, 
  GraduationCap, 
  BookOpen, 
  PenTool, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sliders,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Project, Topic, ResearchQuestion, WorkflowStep, ApiLog, AcademicLevel } from './types';

export default function App() {
  // Navigation / Tab state
  const [activeTab, setActiveTab] = useState<'cockpit' | 'topics' | 'questions' | 'sandbox' | 'logs'>('cockpit');

  // Core Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectDetail, setProjectDetail] = useState<(Project & { topics: Topic[], questions: ResearchQuestion[], steps: WorkflowStep[] }) | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  // UI States
  const [isGenerating, setIsGenerating] = useState<string | null>(null); // 'topics' | 'questions' | 'steps' | null
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [simulatedResponse, setSimulatedResponse] = useState<{
    request: { method: string, url: string, headers: any, body?: any },
    response: { status: number, body: any }
  } | null>(null);

  // Form States for creating a project
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjStudent, setNewProjStudent] = useState('');
  const [newProjLevel, setNewProjLevel] = useState<AcademicLevel>('Master');
  const [newProjDiscipline, setNewProjDiscipline] = useState('');
  const [newProjIdea, setNewProjIdea] = useState('');

  // Form States for adding manually
  const [customTopicTitle, setCustomTopicTitle] = useState('');
  const [customTopicDesc, setCustomTopicDesc] = useState('');
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customQuestionRationale, setCustomQuestionRationale] = useState('');

  // Sandbox simulation selected microservice
  const [sandboxService, setSandboxService] = useState<'literature' | 'writing' | 'validation' | 'stats'>('literature');

  // Fetch all projects initially
  const fetchProjects = async (selectFirst = false) => {
    try {
      const res = await fetch('/api/projects?caller=dashboard');
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setProjects(data);
          if (data.length > 0 && (selectFirst || !selectedProjectId)) {
            setSelectedProjectId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // Fetch details of selected project
  const fetchProjectDetails = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/projects/${id}?caller=dashboard`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setProjectDetail(data);
        }
      }
    } catch (err) {
      console.error('Error fetching project details:', err);
    }
  };

  // Fetch access logs
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setLogs(data);
        }
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  // Lifecycle hooks
  useEffect(() => {
    fetchProjects(true);
    fetchLogs();
    const interval = setInterval(() => {
      fetchLogs();
    }, 4000); // Polling logs for a responsive experience
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    } else {
      setProjectDetail(null);
    }
  }, [selectedProjectId, projects]);

  // Create Project handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle || !newProjStudent || !newProjDiscipline) return;

    try {
      const res = await fetch('/api/projects?caller=dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProjTitle,
          studentName: newProjStudent,
          academicLevel: newProjLevel,
          discipline: newProjDiscipline,
          initialIdea: newProjIdea
        })
      });

      if (res.ok) {
        const created = await res.json();
        setProjects(prev => [...prev, created]);
        setSelectedProjectId(created.id);
        setIsCreatingProject(false);
        // Clear inputs
        setNewProjTitle('');
        setNewProjStudent('');
        setNewProjDiscipline('');
        setNewProjIdea('');
        // Automatically generate workflow steps and topics for this new project
        triggerGeneration(created.id, 'steps');
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  // Delete Project handler
  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project and all its associated steps, topics, and research questions?')) return;
    try {
      const res = await fetch(`/api/projects/${id}?caller=dashboard`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        if (updated.length > 0) {
          setSelectedProjectId(updated[0].id);
        } else {
          setSelectedProjectId('');
        }
      }
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  // Select Topic handler
  const handleSelectTopic = async (topicId: string) => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/select-topic?caller=dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId })
      });
      if (res.ok) {
        fetchProjectDetails(selectedProjectId);
        // Refresh project list to reflect potential status change
        fetchProjects();
      }
    } catch (err) {
      console.error('Error selecting topic:', err);
    }
  };

  // Create manual topic
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !customTopicTitle || !customTopicDesc) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/topics?caller=dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTopicTitle,
          description: customTopicDesc,
          feasibilityScore: 7,
          relevanceScore: 7,
          originalityScore: 7,
          feedback: 'Manually drafted topic.'
        })
      });
      if (res.ok) {
        setCustomTopicTitle('');
        setCustomTopicDesc('');
        fetchProjectDetails(selectedProjectId);
      }
    } catch (err) {
      console.error('Error adding custom topic:', err);
    }
  };

  // Create manual question
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !customQuestionText || !customQuestionRationale) return;
    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/questions?caller=dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: customQuestionText,
          rationale: customQuestionRationale
        })
      });
      if (res.ok) {
        setCustomQuestionText('');
        setCustomQuestionRationale('');
        fetchProjectDetails(selectedProjectId);
      }
    } catch (err) {
      console.error('Error adding custom question:', err);
    }
  };

  // AI Generation trigger
  const triggerGeneration = async (projId: string, type: 'topics' | 'questions' | 'steps') => {
    if (!projId) return;
    setIsGenerating(type);
    try {
      const res = await fetch(`/api/projects/${projId}/${type}/generate?caller=dashboard`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchProjectDetails(projId);
        // Refresh project list since steps generation or status transitions might occur
        fetchProjects();
      } else {
        const errData = await res.json();
        alert(errData.error || `Failed to generate ${type}`);
      }
    } catch (err) {
      console.error(`Error generating ${type}:`, err);
    } finally {
      setIsGenerating(null);
    }
  };

  // Sandbox simulation: execute real REST requests from mock services to core
  const executeSandboxMockCall = async (method: string, url: string, bodyObj?: any) => {
    const fullUrl = `${url}?caller=${sandboxService}`;
    
    // Log the simulated request state in state UI
    const requestDetails = {
      method,
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Caller-Service': sandboxService,
      },
      body: bodyObj
    };

    try {
      const res = await fetch(fullUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: bodyObj ? JSON.stringify(bodyObj) : undefined
      });
      
      const resBody = await res.json();
      setSimulatedResponse({
        request: requestDetails,
        response: {
          status: res.status,
          body: resBody
        }
      });

      // Refresh current UI details
      if (selectedProjectId) {
        fetchProjectDetails(selectedProjectId);
        fetchProjects();
      }
      fetchLogs();
    } catch (err: any) {
      setSimulatedResponse({
        request: requestDetails,
        response: {
          status: 500,
          body: { error: err.message || 'Network simulation error' }
        }
      });
    }
  };

  const clearLogs = async () => {
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error clearing logs:', err);
    }
  };

  // Helpers for Service specific styling
  const getServiceBadge = (service: string) => {
    switch (service) {
      case 'literature':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200">Literature Service</span>;
      case 'writing':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200">Writing Service</span>;
      case 'validation':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">Validation Service</span>;
      case 'stats':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200">Stats Service</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-gray-150 text-gray-700 border border-gray-300">Core Admin</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Completed</span>;
      case 'In Progress':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-800">In Progress</span>;
      case 'Blocked':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Blocked</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 flex flex-col font-sans">
      
      {/* HEADER BAR */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
              <Database className="h-6 w-6" id="header_icon" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Microservice Core</span>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Activity className="h-3 w-3 animate-pulse" /> Live API Active
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-950">bounkoun-core</h1>
              <p className="text-xs text-gray-500 mt-0.5">Thesis Orchestration, Academic Levels & Workflow Governance Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button 
              onClick={() => setIsCreatingProject(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-150"
              id="new_project_btn"
            >
              <Plus className="h-4 w-4" /> New Thesis Project
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT BAR: PROJECT DIRECTORY */}
        <aside className="lg:col-span-4 bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-150 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-gray-500" /> Thesis Projects ({projects.length})
            </h2>
          </div>

          {/* PROJECT LIST */}
          <div className="p-2 space-y-1.5 flex-1 overflow-y-auto max-h-[350px] lg:max-h-[calc(100vh-220px)]">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <HelpCircle className="h-10 w-10 mx-auto stroke-1 mb-2" />
                <p className="text-sm">No thesis projects currently registered.</p>
                <button 
                  onClick={() => setIsCreatingProject(true)}
                  className="mt-3 text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              projects.map((proj) => {
                const isSelected = proj.id === selectedProjectId;
                return (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProjectId(proj.id)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all duration-150 border text-left ${
                      isSelected 
                        ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/10' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        proj.academicLevel === 'PhD' ? 'bg-purple-100 text-purple-800' :
                        proj.academicLevel === 'Master' ? 'bg-blue-100 text-blue-800' :
                        'bg-teal-100 text-teal-800'
                      }`}>
                        {proj.academicLevel}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">ID: {proj.id}</span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-950 mt-1.5 line-clamp-2 leading-snug">
                      {proj.title}
                    </h3>

                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="font-medium truncate">{proj.studentName}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-[11px] text-gray-500 truncate max-w-[150px]">{proj.discipline}</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {proj.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ACTIVE SYSTEM DIAGNOSTICS */}
          <div className="p-4 border-t border-gray-150 bg-gray-50 text-xs">
            <div className="flex items-center justify-between text-gray-600 mb-2">
              <span className="font-semibold">Bounkoun Network Hub</span>
              <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded font-bold">CORE v1.0</span>
            </div>
            <div className="space-y-1.5 font-mono text-gray-500 text-[10px]">
              <div className="flex justify-between">
                <span>POST /api/projects</span>
                <span className="text-emerald-600">Active (201)</span>
              </div>
              <div className="flex justify-between">
                <span>PUT /api/projects/:id/steps/:stepId</span>
                <span className="text-emerald-600">Active (200)</span>
              </div>
              <div className="flex justify-between">
                <span>POST /api/projects/:id/topics/generate</span>
                <span className="text-purple-600 font-semibold">Gemini API Ready</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN COCKPIT WORKSPACE */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          
          {/* CREATE PROJECT MODAL SHIELD */}
          {isCreatingProject && (
            <div className="bg-white border border-indigo-100 rounded-2xl shadow-lg p-5 md:p-6">
              <div className="flex items-center justify-between border-b border-gray-150 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-gray-900">Configure New Thesis Assistant</h3>
                </div>
                <button 
                  onClick={() => setIsCreatingProject(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-semibold bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-md"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Student Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Amadou Diallo"
                      value={newProjStudent}
                      onChange={(e) => setNewProjStudent(e.target.value)}
                      required
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Academic Degree / Level</label>
                    <select
                      value={newProjLevel}
                      onChange={(e) => setNewProjLevel(e.target.value as AcademicLevel)}
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="Bachelor">Bachelor (Standard Thesis Checklist)</option>
                      <option value="Master">Master (Intermediate Research Checklists)</option>
                      <option value="PhD">PhD (Rigorous Academic Milestones)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Academic Discipline</label>
                    <input 
                      type="text" 
                      placeholder="Development Economics, Computer Science, etc."
                      value={newProjDiscipline}
                      onChange={(e) => setNewProjDiscipline(e.target.value)}
                      required
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Thesis Title / working concept</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Socio-Economic Barriers of Mini-Grids"
                      value={newProjTitle}
                      onChange={(e) => setNewProjTitle(e.target.value)}
                      required
                      className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Initial Idea / Abstract Concept (optional)</label>
                  <textarea
                    placeholder="Briefly describe the research questions or data options. Bounkoun will use this description to generate tailored topic proposals."
                    rows={3}
                    value={newProjIdea}
                    onChange={(e) => setNewProjIdea(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  ></textarea>
                </div>

                <div className="bg-indigo-50 p-3.5 rounded-xl flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    <strong>Auto-Provisioning Enabled</strong>: Bounkoun Core will automatically generate customized, sequential workflow steps based on the student's degree level upon creation.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingProject(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                  >
                    Create Project & Initialize
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PROJECT DETAIL SCREEN */}
          {projectDetail ? (
            <div className="space-y-6">
              
              {/* META INFO HEADER */}
              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {projectDetail.discipline}
                      </span>
                      <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                        {projectDetail.academicLevel} Candidate
                      </span>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        ID: {projectDetail.id}
                      </span>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-950 mt-2">
                      {projectDetail.title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Student: <strong className="text-gray-700 font-semibold">{projectDetail.studentName}</strong> • Started {new Date(projectDetail.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <div className="text-right hidden md:block">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Current Status</span>
                      <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mt-1 inline-block">
                        {projectDetail.status}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteProject(projectDetail.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="Delete Thesis"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {projectDetail.initialIdea && (
                  <div className="text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100 leading-relaxed">
                    <span className="font-bold text-gray-700 block uppercase tracking-wider text-[9px] mb-1">Project Concept Abstract</span>
                    {projectDetail.initialIdea}
                  </div>
                )}
              </div>

              {/* TABS SELECTOR */}
              <div className="border-b border-gray-200 bg-white p-2 rounded-xl flex gap-1 shadow-xs">
                <button
                  onClick={() => setActiveTab('cockpit')}
                  className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'cockpit'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Project Cockpit & Timeline
                </button>
                <button
                  onClick={() => setActiveTab('topics')}
                  className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'topics'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Topics Brainstorm ({projectDetail.topics.length})
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-all ${
                    activeTab === 'questions'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Research Questions ({projectDetail.questions.length})
                </button>
                <button
                  onClick={() => setActiveTab('sandbox')}
                  className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'sandbox'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" /> API Playground
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'logs'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" /> Audit Trail
                </button>
              </div>

              {/* ACTIVE TAB VIEW CONTENT */}
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-5 min-h-[400px]">
                
                {/* TAB 1: COCKPIT */}
                {activeTab === 'cockpit' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-950">Milestone Timeline Checklist</h3>
                        <p className="text-xs text-gray-500 mt-1">Sequential workflow steps automatically assigned to Bounkoun services.</p>
                      </div>

                      <button
                        onClick={() => triggerGeneration(projectDetail.id, 'steps')}
                        disabled={isGenerating !== null}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-indigo-150 disabled:opacity-50"
                      >
                        {isGenerating === 'steps' ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        Regenerate Steps (AI)
                      </button>
                    </div>

                    {/* STEPS LIST */}
                    {projectDetail.steps.length === 0 ? (
                      <div className="p-10 text-center border border-dashed border-gray-200 rounded-xl">
                        <HelpCircle className="h-8 w-8 mx-auto text-gray-400 stroke-1 mb-2" />
                        <h4 className="text-sm font-bold text-gray-700">No workflow steps initialized</h4>
                        <p className="text-xs text-gray-500 mt-1">Generate a structured academic plan tailored for this project.</p>
                        <button
                          onClick={() => triggerGeneration(projectDetail.id, 'steps')}
                          className="mt-4 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                        >
                          Generate Now
                        </button>
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-gray-150 ml-4 pl-6 space-y-6 py-2">
                        {projectDetail.steps.map((step, idx) => {
                          const isDone = step.status === 'Completed';
                          const isCurrent = step.status === 'In Progress';
                          return (
                            <div key={step.id} className="relative">
                              {/* Dot Icon */}
                              <span className={`absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white ${
                                isDone 
                                  ? 'bg-emerald-500 text-white' 
                                  : isCurrent 
                                  ? 'bg-indigo-600 text-white animate-pulse' 
                                  : 'bg-gray-150 text-gray-600'
                              }`}>
                                {isDone ? '✓' : step.order}
                              </span>

                              <div className="bg-gray-50/50 hover:bg-gray-50 p-4 rounded-xl border border-gray-150/60 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="space-y-1 text-left">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-bold text-gray-950">{step.title}</h4>
                                    {getStatusBadge(step.status)}
                                  </div>
                                  <p className="text-xs text-gray-600 leading-relaxed max-w-xl">{step.description}</p>
                                  
                                  <div className="pt-2 flex items-center gap-3 text-[10px] text-gray-500">
                                    <span>Engine: {getServiceBadge(step.assignedService)}</span>
                                    <span>•</span>
                                    <span>Updated {new Date(step.updatedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 self-end md:self-auto border-t md:border-t-0 pt-2 md:pt-0">
                                  <span className="text-[10px] text-gray-400 font-mono hidden md:inline">Status Control:</span>
                                  <select
                                    value={step.status}
                                    onChange={async (e) => {
                                      // Real core update
                                      await executeSandboxMockCall('PUT', `/api/projects/${projectDetail.id}/steps/${step.id}`, {
                                        status: e.target.value
                                      });
                                    }}
                                    className="text-xs border border-gray-300 rounded bg-white p-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Blocked">Blocked</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: TOPICS */}
                {activeTab === 'topics' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-950">Thesis Topic Options</h3>
                        <p className="text-xs text-gray-500 mt-1">Brainstorm or register specific thesis topics. Bounkoun critiques each for level feasibility.</p>
                      </div>

                      <button
                        onClick={() => triggerGeneration(projectDetail.id, 'topics')}
                        disabled={isGenerating !== null}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-indigo-150 disabled:opacity-50"
                      >
                        {isGenerating === 'topics' ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        Brainstorm Topics (AI)
                      </button>
                    </div>

                    {/* TOPIC LIST */}
                    {projectDetail.topics.length === 0 ? (
                      <div className="p-10 text-center border border-dashed border-gray-200 rounded-xl">
                        <BookOpen className="h-8 w-8 mx-auto text-gray-400 stroke-1 mb-2" />
                        <h4 className="text-sm font-bold text-gray-700">No topic suggestions registered</h4>
                        <p className="text-xs text-gray-500 mt-1">Let Gemini review the student Abstract Idea and outline 3 clear topics.</p>
                        <button
                          onClick={() => triggerGeneration(projectDetail.id, 'topics')}
                          className="mt-4 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                        >
                          Brainstorm with Bounkoun
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projectDetail.topics.map((topic) => (
                          <div 
                            key={topic.id} 
                            className={`p-4 rounded-xl border flex flex-col justify-between ${
                              topic.selected 
                                ? 'bg-emerald-50/20 border-emerald-300 ring-2 ring-emerald-500/15' 
                                : 'bg-gray-50/50 border-gray-150 hover:border-gray-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] text-gray-400 font-mono">ID: {topic.id}</span>
                                {topic.selected && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                    ✓ Active Research Topic
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-bold text-gray-950 mt-2">{topic.title}</h4>
                              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{topic.description}</p>

                              {/* METRICS */}
                              <div className="grid grid-cols-3 gap-2 mt-4 bg-white p-2.5 rounded-lg border border-gray-100">
                                <div className="text-center">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold block">Feasibility</span>
                                  <span className="text-xs font-bold text-indigo-600">{topic.feasibilityScore}/10</span>
                                </div>
                                <div className="text-center border-x border-gray-100">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold block">Relevance</span>
                                  <span className="text-xs font-bold text-indigo-600">{topic.relevanceScore}/10</span>
                                </div>
                                <div className="text-center">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold block">Originality</span>
                                  <span className="text-xs font-bold text-indigo-600">{topic.originalityScore}/10</span>
                                </div>
                              </div>

                              {topic.feedback && (
                                <div className="mt-3 text-[11px] text-gray-500 bg-gray-100/60 p-2.5 rounded-lg border border-gray-100 leading-normal italic">
                                  <strong>Advisor Note: </strong> {topic.feedback}
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-150/50 flex justify-end">
                              {!topic.selected ? (
                                <button
                                  onClick={() => handleSelectTopic(topic.id)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                  Select Topic
                                </button>
                              ) : (
                                <span className="text-xs text-emerald-600 font-semibold italic flex items-center gap-1">
                                  Selected & Ready
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ADD TOPIC FORM */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Add Custom Topic Proposal</h4>
                      <form onSubmit={handleAddTopic} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-4">
                          <input 
                            type="text" 
                            placeholder="Topic title..." 
                            value={customTopicTitle}
                            onChange={(e) => setCustomTopicTitle(e.target.value)}
                            required
                            className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                          />
                        </div>
                        <div className="md:col-span-6">
                          <input 
                            type="text" 
                            placeholder="Core description and research parameters..." 
                            value={customTopicDesc}
                            onChange={(e) => setCustomTopicDesc(e.target.value)}
                            required
                            className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            className="w-full bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                          >
                            Add Topic
                          </button>
                        </div>
                      </form>
                    </div>

                  </div>
                )}

                {/* TAB 3: QUESTIONS */}
                {activeTab === 'questions' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-950">Hypotheses & Research Questions</h3>
                        <p className="text-xs text-gray-500 mt-1">Formulate testable research queries aligned to the selected thesis topic.</p>
                      </div>

                      <button
                        onClick={() => triggerGeneration(projectDetail.id, 'questions')}
                        disabled={isGenerating !== null}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-lg transition-colors border border-indigo-150 disabled:opacity-50"
                      >
                        {isGenerating === 'questions' ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        Draft Questions (AI)
                      </button>
                    </div>

                    {/* QUESTIONS LIST */}
                    {projectDetail.questions.length === 0 ? (
                      <div className="p-10 text-center border border-dashed border-gray-200 rounded-xl">
                        <PenTool className="h-8 w-8 mx-auto text-gray-400 stroke-1 mb-2" />
                        <h4 className="text-sm font-bold text-gray-700">No research questions added</h4>
                        <p className="text-xs text-gray-500 mt-1">Let Bounkoun review the selected topic parameters and generate logical questions.</p>
                        <button
                          onClick={() => triggerGeneration(projectDetail.id, 'questions')}
                          className="mt-4 bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                        >
                          Draft with Gemini
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {projectDetail.questions.map((q) => (
                          <div key={q.id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-150 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1.5 text-left">
                                <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-800 rounded">
                                  {q.status}
                                </span>
                                <h4 className="text-sm font-bold text-gray-900 leading-snug">
                                  {q.question}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  <strong>Rationale: </strong> {q.rationale}
                                </p>
                                {q.hypothesis && (
                                  <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100">
                                    <strong className="text-indigo-600">H1 Hypothesis: </strong> {q.hypothesis}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={q.status}
                                  onChange={async (e) => {
                                    await executeSandboxMockCall('PUT', `/api/projects/${projectDetail.id}/questions/${q.id}`, {
                                      status: e.target.value
                                    });
                                  }}
                                  className="text-xs border border-gray-300 rounded bg-white p-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                  <option value="Draft">Draft</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Revised">Revised</option>
                                </select>
                                <button
                                  onClick={async () => {
                                    await executeSandboxMockCall('DELETE', `/api/projects/${projectDetail.id}/questions/${q.id}`);
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ADD QUESTION FORM */}
                    <div className="pt-6 border-t border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Add Custom Research Question</h4>
                      <form onSubmit={handleAddQuestion} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <input 
                              type="text" 
                              placeholder="Type research question here..." 
                              value={customQuestionText}
                              onChange={(e) => setCustomQuestionText(e.target.value)}
                              required
                              className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                            />
                          </div>
                          <div>
                            <input 
                              type="text" 
                              placeholder="Methodological rationale / purpose..." 
                              value={customQuestionRationale}
                              onChange={(e) => setCustomQuestionRationale(e.target.value)}
                              required
                              className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                          >
                            Add Question
                          </button>
                        </div>
                      </form>
                    </div>

                  </div>
                )}

                {/* TAB 4: API PLAYGROUND */}
                {activeTab === 'sandbox' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-gray-950">Gateway & REST Sandbox Simulation</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Bounkoun-Core exposes secure endpoints. Simulate validation reviews, stats regressions, or draft approvals from external services.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* SIMULATOR CONTROLS */}
                      <div className="lg:col-span-5 space-y-4">
                        
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150">
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                            1. Select Calling Service
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {['literature', 'writing', 'validation', 'stats'].map((service) => (
                              <button
                                key={service}
                                type="button"
                                onClick={() => setSandboxService(service as any)}
                                className={`p-2.5 text-xs font-bold rounded-lg border capitalize transition-all ${
                                  sandboxService === service 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {service} service
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-150 space-y-3">
                          <span className="block text-xs font-bold text-gray-700 uppercase">
                            2. Trigger Simulated REST Calls
                          </span>

                          <div className="space-y-2">
                            
                            <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-bold">PUT</span>
                                <span className="text-gray-400">Step Status Update</span>
                              </div>
                              <p className="text-[11px] text-gray-600">Simulate literature, writing, stats, or validation updating a step status in Core.</p>
                              
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  onClick={() => {
                                    const step = projectDetail.steps.find(s => s.assignedService === sandboxService);
                                    if (!step) {
                                      alert(`No steps are currently assigned to the '${sandboxService}' service in this project.`);
                                      return;
                                    }
                                    executeSandboxMockCall('PUT', `/api/projects/${projectDetail.id}/steps/${step.id}`, { status: 'In Progress' });
                                  }}
                                  className="bg-gray-800 hover:bg-gray-900 text-white text-[10px] font-bold py-1.5 rounded transition-all"
                                >
                                  Start Step ('In Progress')
                                </button>
                                <button
                                  onClick={() => {
                                    const step = projectDetail.steps.find(s => s.assignedService === sandboxService);
                                    if (!step) {
                                      alert(`No steps are currently assigned to the '${sandboxService}' service in this project.`);
                                      return;
                                    }
                                    executeSandboxMockCall('PUT', `/api/projects/${projectDetail.id}/steps/${step.id}`, { status: 'Completed' });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded transition-all"
                                >
                                  Complete Step ('✓')
                                </button>
                              </div>
                            </div>

                            <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-bold">POST</span>
                                <span className="text-gray-400 font-mono">/select-topic</span>
                              </div>
                              <p className="text-[11px] text-gray-600">Set topic options as active, promoting project lifecycle status.</p>
                              
                              <button
                                onClick={() => {
                                  if (projectDetail.topics.length === 0) {
                                    alert("Please generate or add a topic first.");
                                    return;
                                  }
                                  const targetTopic = projectDetail.topics[0];
                                  executeSandboxMockCall('POST', `/api/projects/${projectDetail.id}/select-topic`, { topicId: targetTopic.id });
                                }}
                                className="w-full bg-gray-800 hover:bg-gray-900 text-white text-[10px] font-bold py-1.5 rounded transition-all"
                              >
                                Select Primary Topic
                              </button>
                            </div>

                            <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-bold">GET</span>
                                <span className="text-gray-400 font-mono">/projects</span>
                              </div>
                              <p className="text-[11px] text-gray-600">Retrieve global project directories and states.</p>
                              
                              <button
                                onClick={() => executeSandboxMockCall('GET', '/api/projects')}
                                className="w-full bg-gray-800 hover:bg-gray-900 text-white text-[10px] font-bold py-1.5 rounded transition-all"
                              >
                                Request Project Directory
                              </button>
                            </div>

                          </div>
                        </div>

                      </div>

                      {/* SANDBOX RESPONSE */}
                      <div className="lg:col-span-7 flex flex-col">
                        <div className="flex-1 bg-[#1a1b26] text-gray-200 p-4 rounded-xl border border-gray-800 shadow-inner flex flex-col justify-between min-h-[300px]">
                          <div>
                            <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
                              <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-emerald-400" />
                                <span className="text-xs uppercase font-bold tracking-wider text-gray-400 font-mono">Real-time Response Logger</span>
                              </div>
                              {simulatedResponse && (
                                <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                                  simulatedResponse.response.status < 300 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-950/40 text-red-300'
                                }`}>
                                  HTTP {simulatedResponse.response.status}
                                </span>
                              )}
                            </div>

                            {simulatedResponse ? (
                              <div className="space-y-4 text-xs font-mono overflow-x-auto max-h-[380px]">
                                <div className="space-y-1">
                                  <span className="text-indigo-400 font-bold block">❯ Simulated Request:</span>
                                  <div className="bg-[#24283b] p-2.5 rounded text-gray-300">
                                    <span className="text-pink-400 font-semibold">{simulatedResponse.request.method}</span> {simulatedResponse.request.url}
                                    <div className="text-[10px] text-gray-400 mt-1">
                                      Headers: {JSON.stringify(simulatedResponse.request.headers, null, 2)}
                                    </div>
                                    {simulatedResponse.request.body && (
                                      <div className="text-[10px] text-gray-400 mt-1 pt-1 border-t border-[#3b4261]">
                                        Payload: {JSON.stringify(simulatedResponse.request.body, null, 2)}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-emerald-400 font-bold block">❯ Gateway Response:</span>
                                  <pre className="bg-[#24283b] p-3 rounded text-gray-300 overflow-x-auto text-[11px] leading-relaxed">
                                    {JSON.stringify(simulatedResponse.response.body, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="p-8 text-center text-gray-500 font-mono text-xs">
                                <Terminal className="h-8 w-8 mx-auto stroke-1 text-gray-600 mb-2" />
                                Waiting to receive microservice REST connection...
                                <p className="text-[10px] text-gray-600 mt-1">Select a calling service and trigger one of the simulation cards to monitor live integration.</p>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-gray-800 pt-3 mt-4 text-[10px] text-gray-500 font-mono flex items-center justify-between">
                            <span>Ingress Port: 3000</span>
                            <span>Secured via X-Caller-Service</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 5: AUDIT TRAIL LOGS */}
                {activeTab === 'logs' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-950">Active API Audit Trail Logs</h3>
                        <p className="text-xs text-gray-500 mt-1">Monitors active REST API connections made to Bounkoun Core by other nodes.</p>
                      </div>

                      <button
                        onClick={clearLogs}
                        className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-150 transition-colors"
                      >
                        Clear Audit Trail
                      </button>
                    </div>

                    {logs.length === 0 ? (
                      <div className="p-10 text-center border border-dashed border-gray-200 rounded-xl">
                        <Activity className="h-8 w-8 mx-auto text-gray-400 stroke-1 mb-2" />
                        <h4 className="text-sm font-bold text-gray-700">Audit trail is currently silent</h4>
                        <p className="text-xs text-gray-500 mt-1">API request logs will populate dynamically as other microservices query the endpoints.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                          <thead className="bg-gray-50 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="px-4 py-3">Timestamp</th>
                              <th className="px-4 py-3">Caller</th>
                              <th className="px-4 py-3">Method</th>
                              <th className="px-4 py-3">Endpoint Path</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Payload Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-150 bg-white font-mono text-gray-600">
                            {logs.map((log) => (
                              <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${
                                    log.callerService === 'literature' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                                    log.callerService === 'writing' ? 'bg-purple-50 text-purple-800 border border-purple-100' :
                                    log.callerService === 'validation' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                                    log.callerService === 'stats' ? 'bg-rose-50 text-rose-800 border border-rose-100' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {log.callerService}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`font-bold ${
                                    log.method === 'GET' ? 'text-blue-600' :
                                    log.method === 'POST' ? 'text-emerald-600' :
                                    log.method === 'PUT' ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {log.method}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-900 select-all font-semibold truncate max-w-[200px]" title={log.url}>
                                  {log.url}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-block font-bold text-[11px] px-1.5 rounded ${
                                    log.statusCode < 300 ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                                  }`}>
                                    {log.statusCode}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[10px] text-gray-400 truncate max-w-[220px]" title={log.payload}>
                                  {log.payload || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-12 text-center flex flex-col items-center justify-center min-h-[450px]">
              <Database className="h-14 w-14 stroke-1 text-indigo-300 animate-bounce" />
              <h3 className="text-lg font-bold text-gray-900 mt-4">Initializing Bounkoun Master Database</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md">
                Configure a new student project context or select an active project from the directory directory panel to unlock workflow checklists and core API parameters.
              </p>
              <button 
                onClick={() => setIsCreatingProject(true)}
                className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow"
              >
                Create New Project
              </button>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
