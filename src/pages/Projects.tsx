import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Plus, BookOpen, ChevronRight, Loader2, RefreshCw } from "lucide-react";

interface Project {
  id: string;
  title: string;
  discipline: string;
  academic_level: "Bachelor" | "Master" | "PhD";
  status: string;
  created_at: string;
}

export default function Projects() {
  const { token, apiBaseUrl } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New project modal/form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [academicLevel, setAcademicLevel] = useState<"Bachelor" | "Master" | "PhD">("Bachelor");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to retrieve project list.");
      }

      const data = await res.json();
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching your projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !discipline || !academicLevel) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          discipline,
          academic_level: academicLevel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not create the thesis project.");
      }

      // Add newly created project to local state
      setProjects((prev) => [data, ...prev]);
      
      // Reset form states
      setTitle("");
      setDiscipline("");
      setAcademicLevel("Bachelor");
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || "An error occurred while creating the project.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Top Section */}
      <div className="md:flex md:items-center md:justify-between border-b border-border-warm pb-6 mb-8">
        <div className="min-w-0 flex-1 text-left">
          <h2 className="serif-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Thesis Directory
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your AI-guided academic research blueprints, topic outlines, and drafts.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 gap-3 justify-end">
          <button
            onClick={fetchProjects}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-warm bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-cream-dark transition-all shadow-xs"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand transition-all duration-150"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Main Form Overlay / Modal */}
      {showForm && (
        <div className="mb-8 overflow-hidden rounded-lg border border-border-warm bg-white shadow-sm">
          <div className="border-b border-border-warm bg-cream px-6 py-4 flex items-center justify-between">
            <h3 className="serif-heading text-lg font-bold text-brand">Configure New Research Blueprint</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-ink-muted hover:text-ink bg-stone-100 hover:bg-stone-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateProject} className="p-6 space-y-5 text-left">
            {formError && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-xs font-semibold text-red-800">{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Thesis Title / working concept
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Socio-Economic Barriers of Mini-Grids in West Africa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 bg-white text-ink placeholder-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Academic Discipline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Development Economics, Computer Science, Literature"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className="w-full text-sm border border-stone-300 rounded-lg p-2.5 bg-white text-ink placeholder-stone-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                Target Academic Level
              </label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value as "Bachelor" | "Master" | "PhD")}
                className="w-full text-sm border border-stone-300 rounded-lg p-2.5 bg-white text-ink"
              >
                <option value="Bachelor">Bachelor (Focus: descriptive, scoped rigor)</option>
                <option value="Master">Master (Focus: analytical, theoretical synthesis)</option>
                <option value="PhD">PhD (Focus: original contribution, extensive theoretical depth)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border-warm">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-semibold text-ink-muted bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Initializing Blueprint...</span>
                  </>
                ) : (
                  <span>Create Project</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List or empty states */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand mb-4" />
          <p className="text-sm text-ink-muted">Loading your academic thesis portfolio...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800 mb-3">{error}</p>
          <button
            onClick={fetchProjects}
            className="inline-flex items-center gap-1 bg-red-100 px-4 py-2 text-xs font-bold text-red-800 rounded hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-warm bg-white p-16 text-center">
          <BookOpen className="h-12 w-12 text-stone-300 mx-auto stroke-1 mb-4" />
          <h3 className="serif-heading text-lg font-bold text-ink mb-1">No active thesis projects found</h3>
          <p className="text-sm text-ink-muted max-w-md mx-auto mb-6">
            Get started by initializing your first thesis blueprint. Bounkoun will establish a custom progress checklist based on your academic level.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Thesis Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              to={`/projects/${proj.id}`}
              className="group block rounded-lg border border-border-warm bg-white p-6 shadow-xs hover:border-brand/40 hover:shadow-sm transition-all duration-150 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand">
                      {proj.academic_level}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {proj.discipline}
                    </span>
                  </div>
                  <h3 className="serif-heading mt-3 text-lg font-bold leading-6 text-brand group-hover:text-brand-hover transition-colors">
                    {proj.title}
                  </h3>
                  <p className="mt-2 text-xs text-ink-muted">
                    Initialized on {new Date(proj.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-cream-dark px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    {proj.status.replace("_", " ")}
                  </span>
                  <ChevronRight className="h-5 w-5 text-stone-300 group-hover:text-brand transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
