import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Award,
  Download,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ThumbsUp,
  FileText,
  Search,
  Plus,
  X,
  BookOpen,
  Pencil,
  ExternalLink,
  HelpCircle,
  Bold,
  Italic,
  List,
  Heading2,
  ListOrdered
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  discipline: string;
  academic_level: "Bachelor" | "Master" | "PhD";
  selected_topic: string | null;
  status: string;
  created_at: string;
  abstract?: string | null;
  keywords?: string[] | null;
  style_preference?: string | null;
  citation_style?: string | null;
  formality_preset?: string | null;
  writing_language?: string | null;
  font_family?: string | null;
}

interface WorkflowStep {
  id: string;
  step_name: "Topic" | "ResearchQuestion" | "Literature" | "Writing" | "Validation" | "Conclusion";
  is_completed: boolean;
  completed_at: string | null;
}

interface Section {
  id: string;
  section_type: string;
  section_number: string | null;
  title: string | null;
  level: number;
  order_index: number;
  requires_user_data: boolean;
  user_data: string | null;
  content: string | null;
  status: string;
}

interface ValidationResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  url?: string;
  is_selected?: boolean;
}

interface LiteratureRecommendation {
  id: string;
  recommended_question: string;
  rationale: string;
  suggested_variables: string[];
  supporting_paper_ids: string[];
  created_at: string;
}

export default function Workspace() {
  const { id } = useParams<{ id: string }>();
  const { token, apiBaseUrl } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeStage, setActiveStage] = useState<WorkflowStep["step_name"]>("Topic");

  const [topicInterest, setTopicInterest] = useState("");
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [literatureQuery, setLiteratureQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [searchingPapers, setSearchingPapers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [shortlist, setShortlist] = useState<Paper[]>([]);
  const [uploadingPaper, setUploadingPaper] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addingPaperId, setAddingPaperId] = useState<string | null>(null);
  const [removingPaperId, setRemovingPaperId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<LiteratureRecommendation | null>(null);
  const [generatingRecommendation, setGeneratingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [groundedQuestionDraft, setGroundedQuestionDraft] = useState("");
  const [groundedVariables, setGroundedVariables] = useState<string[]>([]);
  const [newVariableInput, setNewVariableInput] = useState("");
  const [completingLiterature, setCompletingLiterature] = useState(false);

  const [suggestedQuestion, setSuggestedQuestion] = useState<string>("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [finalizedQuestion, setFinalizedQuestion] = useState<string>("");
  const [allQuestions, setAllQuestions] = useState<{ id: string; text: string }[]>([]);
  const [questionValidation, setQuestionValidation] = useState<ValidationResult | null>(null);
  const [validatingQuestion, setValidatingQuestion] = useState(false);

  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineError, setOutlineError] = useState<string | null>(null);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [validatingSectionId, setValidatingSectionId] = useState<string | null>(null);
  const [sectionValidation, setSectionValidation] = useState<Record<string, ValidationResult>>({});
  const [dataDrafts, setDataDrafts] = useState<Record<string, string>>({});
  const [submittingDataId, setSubmittingDataId] = useState<string | null>(null);
  const [generatingAbstract, setGeneratingAbstract] = useState(false);
  const [abstractError, setAbstractError] = useState<string | null>(null);
  const [completingWriting, setCompletingWriting] = useState(false);

  const [documentHealth, setDocumentHealth] = useState<{ overall: number; argument: number; evidence: number; transitions: number; citations: number; top_issues: string[] } | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const [guidanceSectionId, setGuidanceSectionId] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<{ purpose: string; guiding_questions: string[]; encouragement: string } | null>(null);
  const [loadingGuidance, setLoadingGuidance] = useState(false);

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [stylePreferenceDraft, setStylePreferenceDraft] = useState("");
  const [citationStyleDraft, setCitationStyleDraft] = useState("");
  const [formalityDraft, setFormalityDraft] = useState("");
  const [writingLanguageDraft, setWritingLanguageDraft] = useState("English");
  const [fontFamilyDraft, setFontFamilyDraft] = useState("Times New Roman");
  const [savingStylePreference, setSavingStylePreference] = useState(false);

  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  const [completingValidation, setCompletingValidation] = useState(false);

  const fetchWorkspaceData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const projectRes = await fetch(`${apiBaseUrl}/projects/${id}`);
      if (!projectRes.ok) throw new Error("Could not fetch project details.");
      const projectData = await projectRes.json();
      setProject(projectData);
      setStylePreferenceDraft(projectData.style_preference || "");
      setCitationStyleDraft(projectData.citation_style || "");
      setFormalityDraft(projectData.formality_preset || "");
      setWritingLanguageDraft(projectData.writing_language || "English");
      setFontFamilyDraft(projectData.font_family || "Times New Roman");
      setLiteratureQuery(projectData.selected_topic || "");

      const stepsRes = await fetch(`${apiBaseUrl}/workflow/${id}`);
      if (stepsRes.ok) {
        const stepsData = await stepsRes.json();
        const order = ["Topic", "Literature", "ResearchQuestion", "Writing", "Validation", "Conclusion"];
        const sortedSteps = (stepsData || []).sort(
          (a: WorkflowStep, b: WorkflowStep) => order.indexOf(a.step_name) - order.indexOf(b.step_name)
        );
        setSteps(sortedSteps);
      }

      const sectionsRes = await fetch(`${apiBaseUrl}/sections/${id}`);
      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        setSections((sectionsData || []).sort((a: Section, b: Section) => a.order_index - b.order_index));
      }

      const eventsRes = await fetch(`${apiBaseUrl}/events/${id}`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData || []);
        const questionEvent = (eventsData || []).find(
          (e: any) => e.event_type === "research_question_finalized"
        );
        if (questionEvent?.payload?.question) {
          setFinalizedQuestion(questionEvent.payload.question);
        }
      }

      const allQuestionsRes = await fetch(`${apiBaseUrl}/question/${id}/all`);
      if (allQuestionsRes.ok) {
        const allQuestionsData = await allQuestionsRes.json();
        setAllQuestions(allQuestionsData || []);
      }

      const selectedRes = await fetch(`${apiBaseUrl.replace("bounkoun-core", "bounkoun-literature")}/selection/${id}/selected`);
      if (selectedRes.ok) {
        const selectedData = await selectedRes.json();
        setShortlist(selectedData || []);
      }

      const recRes = await fetch(`${apiBaseUrl}/literature/${id}/recommend`);
      if (recRes.ok) {
        const recData = await recRes.json();
        if (recData) {
          setRecommendation(recData);
          setGroundedQuestionDraft(recData.recommended_question);
          setGroundedVariables(recData.suggested_variables || []);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading your thesis workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  const completeStep = async (stepName: WorkflowStep["step_name"]) => {
    try {
      const res = await fetch(`${apiBaseUrl}/workflow/${id}/complete-step`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ step_name: stepName }),
      });
      if (res.ok) {
        setSteps((prev) =>
          prev.map((s) => (s.step_name === stepName ? { ...s, is_completed: true } : s))
        );
      }
    } catch (err) {
      console.error("Failed to complete workflow step:", err);
    }
  };

  const handleSuggestTopics = async () => {
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/topic/${id}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest: topicInterest }),
      });

      if (!res.ok) throw new Error("Advisor failed to brainstorm topic proposals.");
      const data = await res.json();
      setSuggestedTopics(data || []);
    } catch (err: any) {
      setTopicsError(err.message || "An error occurred.");
    } finally {
      setTopicsLoading(false);
    }
  };

  const handleSelectTopic = async (topic: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/topic/${id}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) throw new Error("Could not select this topic.");

      if (project) {
        setProject({ ...project, selected_topic: topic });
        setLiteratureQuery(topic);
      }

      await completeStep("Topic");
      setActiveStage("Literature");
    } catch (err: any) {
      alert(err.message || "Failed to save topic.");
    }
  };

  const handleSearchPapers = async () => {
    if (!literatureQuery.trim()) {
      alert("Enter a search query first.");
      return;
    }
    setSearchingPapers(true);
    setSearchError(null);
    try {
      const literatureApiUrl = apiBaseUrl.replace("bounkoun-core", "bounkoun-literature");
      const res = await fetch(`${literatureApiUrl}/search/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: literatureQuery }),
      });

      if (!res.ok) throw new Error("Could not search for papers right now.");
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err: any) {
      setSearchError(err.message || "Search failed.");
    } finally {
      setSearchingPapers(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPaper(true);
    setUploadError(null);
    try {
      const literatureApiUrl = apiBaseUrl.replace("bounkoun-core", "bounkoun-literature");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${literatureApiUrl}/upload/${id}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not process this PDF.");
      }
      const data = await res.json();
      setShortlist((prev) => [...prev, data]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setUploadingPaper(false);
    }
  };

  const handleAddToShortlist = async (paper: Paper) => {
    setAddingPaperId(paper.id);
    try {
      const literatureApiUrl = apiBaseUrl.replace("bounkoun-core", "bounkoun-literature");
      const res = await fetch(`${literatureApiUrl}/selection/${id}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper_ids: [paper.id] }),
      });

      if (!res.ok) throw new Error("Could not add this paper to your shortlist.");

      setShortlist((prev) => (prev.some((p) => p.id === paper.id) ? prev : [...prev, paper]));
    } catch (err: any) {
      alert(err.message || "Failed to shortlist paper.");
    } finally {
      setAddingPaperId(null);
    }
  };

  const handleRemoveFromShortlist = async (paperId: string) => {
    setRemovingPaperId(paperId);
    try {
      const literatureApiUrl = apiBaseUrl.replace("bounkoun-core", "bounkoun-literature");
      const res = await fetch(`${literatureApiUrl}/selection/${id}/deselect/${paperId}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Could not remove this paper.");

      setShortlist((prev) => prev.filter((p) => p.id !== paperId));
    } catch (err: any) {
      alert(err.message || "Failed to remove paper.");
    } finally {
      setRemovingPaperId(null);
    }
  };

  const handleGenerateRecommendation = async () => {
    if (shortlist.length === 0) {
      alert("Shortlist at least a few real papers first.");
      return;
    }
    setGeneratingRecommendation(true);
    setRecommendationError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/literature/${id}/recommend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not generate a recommendation.");
      }

      const data = await res.json();
      setRecommendation(data);
      setGroundedQuestionDraft(data.recommended_question);
      setGroundedVariables(data.suggested_variables || []);
    } catch (err: any) {
      setRecommendationError(err.message || "Failed to generate recommendation.");
    } finally {
      setGeneratingRecommendation(false);
    }
  };

  const handleAddVariable = () => {
    if (!newVariableInput.trim()) return;
    setGroundedVariables((prev) => [...prev, newVariableInput.trim()]);
    setNewVariableInput("");
  };

  const handleRemoveVariable = (index: number) => {
    setGroundedVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompleteLiterature = async () => {
    setCompletingLiterature(true);
    try {
      if (groundedQuestionDraft) {
        setSuggestedQuestion(groundedQuestionDraft);
      }
      await completeStep("Literature");
      setActiveStage("ResearchQuestion");
    } finally {
      setCompletingLiterature(false);
    }
  };

  const handleSuggestQuestion = async () => {
    setQuestionLoading(true);
    setQuestionError(null);
    setQuestionValidation(null);
    try {
      const res = await fetch(`${apiBaseUrl}/question/${id}/suggest`, { method: "POST" });
      if (!res.ok) throw new Error("Advisor failed to craft a research question suggestion.");
      const text = await res.text();
      setSuggestedQuestion(text);
    } catch (err: any) {
      setQuestionError(err.message || "An error occurred.");
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleValidateQuestion = async (questionText: string) => {
    setValidatingQuestion(true);
    setQuestionValidation(null);
    try {
      const res = await fetch(`${apiBaseUrl}/question/${id}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });

      if (!res.ok) throw new Error("Could not evaluate the research question.");
      const data = await res.json();
      setQuestionValidation(data);
    } catch (err: any) {
      alert(err.message || "Failed to validate question.");
    } finally {
      setValidatingQuestion(false);
    }
  };

  const handleSelectQuestion = async (questionText: string) => {
    try {
      const selectRes = await fetch(`${apiBaseUrl}/question/${id}/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });

      if (!selectRes.ok) throw new Error("Failed to register research question.");

      await fetch(`${apiBaseUrl}/events/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "research_question_finalized",
          payload: { question: questionText },
        }),
      });

      setFinalizedQuestion(questionText);
      setAllQuestions((prev) => [...prev, { id: Date.now().toString(), text: questionText }]);
      await completeStep("ResearchQuestion");
      setActiveStage("Writing");
    } catch (err: any) {
      alert(err.message || "Failed to finalize question.");
    }
  };

  const handleGenerateOutline = async () => {
    setOutlineLoading(true);
    setOutlineError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/sections/${id}/outline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not generate the thesis outline.");
      }

      const data = await res.json();
      setSections((data || []).sort((a: Section, b: Section) => a.order_index - b.order_index));
    } catch (err: any) {
      setOutlineError(err.message || "Failed to generate outline.");
    } finally {
      setOutlineLoading(false);
    }
  };

  const handleSubmitData = async (sectionId: string) => {
    const userData = dataDrafts[sectionId];
    if (!userData || userData.trim() === "") {
      alert("Please enter your research data or notes first.");
      return;
    }
    setSubmittingDataId(sectionId);
    try {
      const res = await fetch(`${apiBaseUrl}/sections/${sectionId}/submit-data`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_data: userData }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save your research data.");
      }

      const data = await res.json();
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...data } : s)));
    } catch (err: any) {
      alert(err.message || "Failed to submit data.");
    } finally {
      setSubmittingDataId(null);
    }
  };

  const handleGenerateDraft = async (sectionId: string) => {
    setGeneratingSectionId(sectionId);
    try {
      const res = await fetch(`${apiBaseUrl}/sections/${sectionId}/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not generate this section.");
      }

      const data = await res.json();
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...data } : s)));
    } catch (err: any) {
      alert(err.message || "Failed to generate draft.");
    } finally {
      setGeneratingSectionId(null);
    }
  };

  const handleAskForHelp = async (sectionId: string, currentDraft: string) => {
    setGuidanceSectionId(sectionId);
    setGuidance(null);
    setLoadingGuidance(true);
    try {
      const res = await fetch(`${apiBaseUrl}/sections/${sectionId}/guidance`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_draft: currentDraft }),
      });
      if (!res.ok) throw new Error("Could not get guidance right now.");
      const data = await res.json();
      setGuidance(data);
    } catch (err: any) {
      alert(err.message || "Failed to get guidance.");
    } finally {
      setLoadingGuidance(false);
    }
  };

  const applyFormatting = (type: "bold" | "italic" | "bullet" | "heading" | "numbered") => {
    const textarea = editTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = editDraft.slice(start, end) || "text";
    let wrapped = selected;
    if (type === "bold") wrapped = `**${selected}**`;
    if (type === "italic") wrapped = `*${selected}*`;
    if (type === "bullet") wrapped = selected.split("\n").map((line) => `- ${line}`).join("\n");
    if (type === "heading") wrapped = selected.split("\n").map((line) => `## ${line}`).join("\n");
    if (type === "numbered") wrapped = selected.split("\n").map((line, idx) => `${idx + 1}. ${line}`).join("\n");
    const newValue = editDraft.slice(0, start) + wrapped + editDraft.slice(end);
    setEditDraft(newValue);
    setTimeout(() => textarea.focus(), 0);
  };

  const handleStartEdit = (sectionId: string, currentContent: string) => {
    setEditingSectionId(sectionId);
    setEditDraft(currentContent);
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditDraft("");
  };

  const handleSaveEdit = async (sectionId: string) => {
    setSavingEditId(sectionId);
    try {
      const res = await fetch(`${apiBaseUrl}/sections/${sectionId}/edit`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: editDraft }),
      });
      if (!res.ok) throw new Error("Could not save your edit.");
      const data = await res.json();
      setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...data } : s)));
      setEditingSectionId(null);
      setEditDraft("");
    } catch (err: any) {
      alert(err.message || "Failed to save edit.");
    } finally {
      setSavingEditId(null);
    }
  };

  const handleSaveStylePreference = async () => {
    setSavingStylePreference(true);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${id}/style-preference`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          style_preference: stylePreferenceDraft,
          citation_style: citationStyleDraft,
          formality_preset: formalityDraft,
          writing_language: writingLanguageDraft,
          font_family: fontFamilyDraft,
        }),
      });
      if (!res.ok) throw new Error("Could not save your style preference.");
      const data = await res.json();
      setProject((prev) =>
        prev
          ? {
              ...prev,
              style_preference: data.style_preference,
              citation_style: data.citation_style,
              formality_preset: data.formality_preset,
              writing_language: data.writing_language,
              font_family: data.font_family,
            }
          : prev
      );
    } catch (err: any) {
      alert(err.message || "Failed to save style preference.");
    } finally {
      setSavingStylePreference(false);
    }
  };

  const handleValidateSection = async (sectionId: string) => {
    setValidatingSectionId(sectionId);
    try {
      const res = await fetch(`${apiBaseUrl}/sections/${sectionId}/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Evaluation engine failed.");
      const data = await res.json();
      setSectionValidation((prev) => ({ ...prev, [sectionId]: data }));
    } catch (err: any) {
      alert(err.message || "Failed to analyze section.");
    } finally {
      setValidatingSectionId(null);
    }
  };

  const handleCheckHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch(`${apiBaseUrl}/sections/${id}/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not check document health right now.");
      const data = await res.json();
      setDocumentHealth(data);
    } catch (err: any) {
      alert(err.message || "Failed to check document health.");
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleGenerateAbstract = async () => {
    setGeneratingAbstract(true);
    setAbstractError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/sections/${id}/abstract`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not generate the abstract yet.");
      }

      const data = await res.json();
      setProject((prev) => (prev ? { ...prev, abstract: data.abstract, keywords: data.keywords } : prev));
    } catch (err: any) {
      setAbstractError(err.message || "Failed to generate abstract.");
    } finally {
      setGeneratingAbstract(false);
    }
  };

  const handleCompleteWriting = async () => {
    setCompletingWriting(true);
    try {
      await completeStep("Writing");
      setActiveStage("Validation");
    } finally {
      setCompletingWriting(false);
    }
  };

  const handleCompleteValidation = async () => {
    setCompletingValidation(true);
    try {
      await completeStep("Validation");
      setActiveStage("Conclusion");
    } finally {
      setCompletingValidation(false);
    }
  };

  const handleCompleteConclusion = async () => {
    await completeStep("Conclusion");
    alert("Congratulations! Your thesis draft has been verified and marked as concluded. You may download your export assets below.");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-brand mb-4" />
        <p className="text-sm font-medium text-ink-muted">Synthesizing research desk environment...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto stroke-1 mb-4" />
        <h3 className="serif-heading text-lg font-bold text-red-800">Workspace Unavailable</h3>
        <p className="text-sm text-ink-muted mt-2">{error || "Project could not be recovered."}</p>
        <Link
          to="/projects"
          className="mt-6 inline-flex items-center gap-1 bg-stone-150 px-4 py-2 text-xs font-bold rounded hover:bg-stone-200 text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  const chapters = sections.filter((s) => s.level === 1);
  const draftedChapterCount = chapters.filter((c) => !!c.content).length;
  const allChaptersDrafted = chapters.length > 0 && draftedChapterCount === chapters.length;
  const shortlistedIds = new Set(shortlist.map((p) => p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 text-left">
      <div className="mb-8 border-b border-border-warm pb-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline uppercase tracking-wider mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Thesis Directory</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand">
                {project.academic_level} Candidate
              </span>
              <span className="text-xs text-ink-muted">{project.discipline}</span>
            </div>
            <h1 className="serif-heading text-2xl font-bold tracking-tight text-brand mt-2 md:text-3xl">
              {project.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs uppercase font-bold text-ink-muted tracking-wider block mr-1">Status:</span>
            <span className="inline-flex items-center rounded-full bg-brand-light px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
              {project.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-lg border border-border-warm bg-white shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-y divide-x md:divide-y-0 divide-border-warm bg-cream-dark/30">
          {steps.map((s, idx) => {
            const isCompleted = s.is_completed;
            const isActive = activeStage === s.step_name;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(s.step_name)}
                className={`p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                  isActive ? "bg-white border-b-2 border-brand font-semibold text-brand" : "text-ink-muted hover:bg-cream-dark/40"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`text-[10px] font-mono rounded-full flex h-4 w-4 items-center justify-center ${
                    isCompleted ? "bg-brand text-white" : isActive ? "bg-brand/10 text-brand" : "bg-stone-200 text-stone-600"
                  }`}>
                    {isCompleted ? "✓" : idx + 1}
                  </span>
                  <span className="text-xs font-medium tracking-tight">
                    {s.step_name.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted px-3">Milestone Stages</p>
          <div className="space-y-1">
            {steps.map((s) => {
              const isCompleted = s.is_completed;
              const isActive = activeStage === s.step_name;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(s.step_name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
                    isActive
                      ? "bg-brand text-white font-semibold shadow-xs"
                      : "text-ink hover:bg-white hover:border hover:border-border-warm"
                  }`}
                >
                  <span className="truncate">{s.step_name.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className={`text-xs ${isActive ? "text-white/80" : "text-ink-muted"}`}>
                    {isCompleted ? "Completed" : "Pending"}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="lg:col-span-9 bg-white border border-border-warm rounded-xl p-6 md:p-8 min-h-[500px] shadow-xs">

          {activeStage === "Topic" && (
            <div className="space-y-6">
              <div>
                <h3 className="serif-heading text-xl font-bold text-brand">Stage 1: Topic Definition & Brainstorming</h3>
                <p className="text-sm text-ink-muted mt-1">
                  Generate and validate academic topic directions matched to your {project.academic_level} target rigor.
                </p>
              </div>

              {project.selected_topic ? (
                <div className="rounded-lg border border-brand/20 bg-brand-light/30 p-6">
                  <div className="flex items-center gap-2 text-brand">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Active Research Topic Selected</span>
                  </div>
                  <h4 className="serif-heading text-lg font-bold text-brand mt-3 leading-snug">
                    {project.selected_topic}
                  </h4>
                  <p className="text-xs text-ink-muted mt-2">
                    Topic milestone is marked completed. You can proceed to gather real literature.
                  </p>
                  <button
                    onClick={() => {
                      if(confirm("Do you want to clear your selected topic and brainstorm a new one?")) {
                        handleSelectTopic("");
                      }
                    }}
                    className="mt-4 text-xs font-semibold text-red-800 hover:underline"
                  >
                    Change selected topic
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-cream border border-border-warm p-5 rounded-lg text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                      Academic Focus / Research Interests (Optional)
                    </label>
                    <textarea
                      placeholder="Add details on what datasets, theories, or countries you want to focus on (e.g. mini-grid solar models, microfinance in Senegal, LLM code generation constraints)."
                      rows={3}
                      value={topicInterest}
                      onChange={(e) => setTopicInterest(e.target.value)}
                      className="w-full text-sm border border-stone-300 rounded-lg p-3 bg-white text-ink"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={handleSuggestTopics}
                        disabled={topicsLoading}
                        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                      >
                        {topicsLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Brainstorming Proposals...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Suggest Thesis Topics (AI)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {suggestedTopics.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="serif-heading text-md font-bold text-ink">Proposed Research Blueprints</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {suggestedTopics.map((topic, index) => (
                          <div
                            key={index}
                            className="p-5 rounded-lg border border-border-warm bg-white hover:border-brand/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                          >
                            <div className="flex-1">
                              <span className="text-[10px] font-mono text-brand font-bold uppercase tracking-wider block mb-1">Proposal {index + 1}</span>
                              <p className="text-sm font-semibold text-ink font-serif leading-relaxed">{topic}</p>
                            </div>
                            <button
                              onClick={() => handleSelectTopic(topic)}
                              className="self-end sm:self-auto bg-brand-light text-brand hover:bg-brand hover:text-white text-xs font-bold px-3 py-2 rounded-md transition-all whitespace-nowrap"
                            >
                              Select Blueprint
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeStage === "Literature" && (
            <div className="space-y-6">
              <div>
                <h3 className="serif-heading text-xl font-bold text-brand">Stage 2: Real Literature Discovery</h3>
                <p className="text-sm text-ink-muted mt-1">
                  Browse real, published papers, shortlist the ones relevant to your thesis, then let the advisor
                  recommend a research question grounded strictly in what you selected — never invented.
                </p>
              </div>

              {!project.selected_topic ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50/40 p-5 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-800 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-900">
                    <strong>Prerequisite Required:</strong> Finalize a Thesis Topic in Stage 1 before searching literature.
                  </p>
                </div>
              ) : (
                <div className="space-y-8 text-left">
                  <div className="bg-cream border border-border-warm p-5 rounded-lg space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Search Real Published Papers
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={literatureQuery}
                        onChange={(e) => setLiteratureQuery(e.target.value)}
                        placeholder="e.g. cybersecurity frameworks small business"
                        className="flex-1 text-sm border border-stone-300 rounded-lg p-3 bg-white text-ink"
                      />
                      <button
                        onClick={handleSearchPapers}
                        disabled={searchingPapers}
                        className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {searchingPapers ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Search className="h-3.5 w-3.5" />
                        )}
                        <span>Search</span>
                      </button>
                    </div>
                    {searchError && <p className="text-xs text-red-700 font-medium">{searchError}</p>}
                  </div>

                  <div className="bg-cream border border-border-warm p-5 rounded-lg space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                      Or Upload Your Own Paper (PDF)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        accept="application/pdf"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="text-xs text-ink-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-light file:text-brand hover:file:bg-brand hover:file:text-white file:cursor-pointer cursor-pointer"
                        disabled={uploadingPaper}
                      />
                      {uploadingPaper && <Loader2 className="h-4 w-4 animate-spin text-brand" />}
                    </div>
                    {uploadError && <p className="text-xs text-red-700 font-medium">{uploadError}</p>}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="serif-heading text-md font-bold text-ink">
                        {searchResults.length} Real Papers Found
                      </h4>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                        {searchResults.map((paper) => {
                          const isShortlisted = shortlistedIds.has(paper.id);
                          const isAdding = addingPaperId === paper.id;
                          return (
                            <div
                              key={paper.id}
                              className="p-4 rounded-lg border border-border-warm bg-white hover:border-brand/40 transition-all"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-ink font-serif leading-snug">{paper.title}</p>
                                  <p className="text-xs text-ink-muted mt-1">
                                    {(paper.authors || []).slice(0, 3).join(", ")}
                                    {paper.authors && paper.authors.length > 3 ? ", et al." : ""}
                                    {paper.year ? ` — ${paper.year}` : ""}
                                  </p>
                                  {paper.abstract && (
                                    <p className="text-xs text-ink-muted mt-2 leading-relaxed line-clamp-3">
                                      {paper.abstract}
                                    </p>
                                  )}
                                  {paper.url && (
                                    <a
                                      href={paper.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-brand hover:underline mt-2"
                                    >
                                      <span>View Source</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleAddToShortlist(paper)}
                                  disabled={isShortlisted || isAdding}
                                  className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                                    isShortlisted
                                      ? "bg-emerald-100 text-emerald-800 cursor-default"
                                      : "bg-brand-light text-brand hover:bg-brand hover:text-white"
                                  }`}
                                >
                                  {isShortlisted ? (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      <span>Shortlisted</span>
                                    </>
                                  ) : isAdding ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="h-3.5 w-3.5" />
                                      <span>Add</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-border-warm bg-stone-50 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="serif-heading text-md font-bold text-brand flex items-center gap-1.5">
                        <BookOpen className="h-5 w-5" />
                        <span>Your Shortlist ({shortlist.length})</span>
                      </h4>
                    </div>
                    {shortlist.length === 0 ? (
                      <p className="text-xs text-ink-muted">
                        No papers shortlisted yet. Search above and add papers that are genuinely relevant to your thesis —
                        aim for at least a handful before requesting a recommendation.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {shortlist.map((paper) => (
                          <div
                            key={paper.id}
                            className="flex items-start justify-between gap-3 p-3 bg-white border border-border-warm rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-ink font-serif truncate">{paper.title}</p>
                              {paper.url && (
                                <a
                                  href={paper.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline mt-1"
                                >
                                  <span>View Source</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveFromShortlist(paper.id)}
                              disabled={removingPaperId === paper.id}
                              className="shrink-0 text-stone-400 hover:text-red-700 transition-colors mt-0.5"
                            >
                              {removingPaperId === paper.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {shortlist.length > 0 && (
                    <div className="rounded-lg border border-brand/20 bg-brand-light/20 p-6 space-y-4">
                      <h4 className="serif-heading text-md font-bold text-brand">Literature-Grounded Recommendation</h4>

                      {!recommendation ? (
                        <div className="space-y-3">
                          <p className="text-xs text-ink-muted">
                            The advisor will analyze only the {shortlist.length} papers in your shortlist above —
                            it will not invent sources or claims beyond what they actually contain.
                          </p>
                          <button
                            onClick={handleGenerateRecommendation}
                            disabled={generatingRecommendation}
                            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                          >
                            {generatingRecommendation ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Analyzing Literature...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Generate Grounded Recommendation (AI)</span>
                              </>
                            )}
                          </button>
                          {recommendationError && (
                            <p className="text-xs text-red-700 font-medium">{recommendationError}</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand mb-1.5">
                              Recommended Research Question (Editable)
                            </label>
                            <textarea
                              value={groundedQuestionDraft}
                              onChange={(e) => setGroundedQuestionDraft(e.target.value)}
                              rows={3}
                              className="w-full text-sm font-serif italic border border-brand/30 rounded-lg p-3 bg-white text-ink"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand mb-1.5">
                              Advisor's Rationale
                            </label>
                            <p className="text-xs text-ink-muted leading-relaxed bg-white border border-border-warm rounded-lg p-3">
                              {recommendation.rationale}
                            </p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand mb-1.5">
                              Suggested Variables to Examine (Editable)
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {groundedVariables.map((v, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1.5 bg-white border border-border-warm rounded-full px-3 py-1 text-xs text-ink"
                                >
                                  {v}
                                  <button onClick={() => handleRemoveVariable(i)} className="text-stone-400 hover:text-red-700">
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newVariableInput}
                                onChange={(e) => setNewVariableInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddVariable())}
                                placeholder="Add another variable..."
                                className="flex-1 text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white text-ink"
                              />
                              <button
                                onClick={handleAddVariable}
                                className="text-xs font-bold text-brand bg-brand-light px-3 py-2 rounded-lg hover:bg-brand hover:text-white transition-all"
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={handleGenerateRecommendation}
                            disabled={generatingRecommendation}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            Regenerate recommendation
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-border-warm">
                    <button
                      onClick={handleCompleteLiterature}
                      disabled={completingLiterature || !recommendation}
                      className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-brand-hover transition-colors disabled:opacity-40"
                    >
                      Complete Literature Phase & Proceed to Research Question
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeStage === "ResearchQuestion" && (
            <div className="space-y-6">
              <div>
                <h3 className="serif-heading text-xl font-bold text-brand">Stage 3: Research Question Formulation</h3>
                <p className="text-sm text-ink-muted mt-1">
                  Finalize a single, robust, rigorous academic research question, grounded in the literature you gathered.
                </p>
              </div>

              {allQuestions.length > 0 && (
                <div className="rounded-lg border border-border-warm bg-stone-50 p-5 space-y-3">
                  <h4 className="serif-heading text-sm font-bold text-brand">
                    Your Finalized Research Questions ({allQuestions.length})
                  </h4>
                  <div className="space-y-2">
                    {allQuestions.map((q) => (
                      <div key={q.id} className="p-3 bg-white border border-border-warm rounded-lg">
                        <p className="text-sm font-serif italic text-ink leading-relaxed">"{q.text}"</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-ink-muted">
                    You can add another research question below if your thesis explores multiple angles.
                  </p>
                </div>
              )}

              {!project.selected_topic ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50/40 p-5 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-800 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-900">
                    <strong>Prerequisite Required:</strong> You must finalize a Thesis Topic in Stage 1 before crafting research questions.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-cream-dark/20 p-4 border border-border-warm rounded-lg text-xs text-left">
                    <span className="font-bold text-brand uppercase tracking-wider block mb-1 text-[9px]">Topic Anchor</span>
                    <span className="font-serif italic font-medium text-ink">{project.selected_topic}</span>
                  </div>

                  {finalizedQuestion ? (
                    <div className="rounded-lg border border-brand/20 bg-brand-light/30 p-6">
                      <div className="flex items-center gap-2 text-brand">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">Finalized Research Question</span>
                      </div>
                      <h4 className="serif-heading text-lg font-bold text-brand mt-3 leading-relaxed italic">
                        "{finalizedQuestion}"
                      </h4>
                      <p className="text-xs text-ink-muted mt-2">
                        Research Question is finalized and locked. You may proceed to draft your thesis chapters.
                      </p>
                      <button
                        onClick={() => {
                          if (confirm("Reset finalized question?")) {
                            setFinalizedQuestion("");
                          }
                        }}
                        className="mt-4 text-xs font-semibold text-red-800 hover:underline"
                      >
                        Formulate new question
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {recommendation && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 flex items-start gap-3">
                          <BookOpen className="h-5 w-5 text-emerald-800 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-emerald-900">
                            This question is grounded in the {recommendation.supporting_paper_ids.length} real papers you
                            shortlisted in Stage 2. Feel free to edit it further before locking it in.
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                           onClick={handleSuggestQuestion}
                           disabled={questionLoading}
                           className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-stone-100 disabled:opacity-50"
                        >
                          {questionLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5 text-brand" />
                          )}
                          <span>{recommendation ? "Try an Alternative (Ungrounded AI)" : "Suggest Research Question (AI)"}</span>
                        </button>
                      </div>

                      <div className="border border-border-warm rounded-lg overflow-hidden bg-white">
                        <div className="bg-cream border-b border-border-warm p-4 text-left">
                          <span className="text-[10px] font-mono uppercase font-bold text-brand block mb-1">
                            {recommendation ? "Literature-Grounded Question (Editable)" : "Proposed Question (Editable)"}
                          </span>
                          <textarea
                            value={suggestedQuestion}
                            onChange={(e) => setSuggestedQuestion(e.target.value)}
                            rows={3}
                            className="w-full font-serif italic text-base font-semibold text-ink leading-relaxed bg-transparent border-none focus:outline-none resize-y"
                          />
                        </div>

                        {suggestedQuestion && (
                          <div className="p-4 bg-stone-50 flex items-center justify-between gap-3 flex-wrap">
                            <button
                              onClick={() => handleValidateQuestion(suggestedQuestion)}
                              disabled={validatingQuestion}
                              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-stone-100 disabled:opacity-50"
                            >
                              {validatingQuestion ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Award className="h-3.5 w-3.5 text-brand" />
                              )}
                              <span>Analyze Question Caliber</span>
                            </button>

                            <button
                              onClick={() => handleSelectQuestion(suggestedQuestion)}
                              className="bg-brand text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-brand-hover"
                            >
                              Accept & Lock Question
                            </button>
                          </div>
                        )}
                      </div>

                      {questionValidation && (
                        <div className="rounded-lg border border-border-warm bg-white p-6 space-y-4 shadow-xs text-left">
                          <div className="flex items-center justify-between border-b border-border-warm pb-3">
                            <h4 className="serif-heading text-md font-bold text-brand flex items-center gap-1.5">
                              <Award className="h-5 w-5 text-brand" />
                              <span>Academic Quality Appraisal Report</span>
                            </h4>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-semibold text-ink-muted">Feasibility Score:</span>
                              <span className="text-sm font-bold text-brand bg-brand-light px-2.5 py-0.5 rounded font-mono">
                                {questionValidation.score}/100
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div className="space-y-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                                <ThumbsUp className="h-3.5 w-3.5" /> Strengths
                              </span>
                              <ul className="space-y-1.5">
                                {questionValidation.strengths?.map((str, i) => (
                                  <li key={i} className="text-xs text-ink-muted leading-relaxed pl-3 relative">
                                    <span className="absolute left-0 top-1 text-emerald-600 font-bold">•</span>
                                    {str}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-red-800 flex items-center gap-1">
                                <ShieldAlert className="h-3.5 w-3.5" /> Structural Gaps
                              </span>
                              <ul className="space-y-1.5">
                                {questionValidation.weaknesses?.map((weak, i) => (
                                  <li key={i} className="text-xs text-ink-muted leading-relaxed pl-3 relative">
                                    <span className="absolute left-0 top-1 text-red-500 font-bold">•</span>
                                    {weak}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1">
                                <Sparkles className="h-3.5 w-3.5" /> Advisor Directives
                              </span>
                              <ul className="space-y-1.5">
                                {questionValidation.recommendations?.map((rec, i) => (
                                  <li key={i} className="text-xs text-ink-muted leading-relaxed pl-3 relative font-medium">
                                    <span className="absolute left-0 top-1 text-brand font-bold">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {groundedVariables.length > 0 && (
                        <div className="rounded-lg border border-border-warm bg-cream p-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand block mb-2">
                            Variables Carried From Literature Review
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {groundedVariables.map((v, i) => (
                              <span key={i} className="text-xs bg-white border border-border-warm rounded-full px-3 py-1 text-ink">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeStage === "Writing" && (
            <div className="space-y-6">
              <div>
                <h3 className="serif-heading text-xl font-bold text-brand">Stage 4: Structural Drafting & Validation Desk</h3>
                <p className="text-sm text-ink-muted mt-1">
                  Build a proper numbered thesis outline, then draft each chapter and subsection of your {project.academic_level} thesis in order.
                </p>
              </div>

              {!finalizedQuestion ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50/40 p-5 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-800 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-900">
                    <strong>Prerequisite Required:</strong> Your Research Question must be locked before the AI writing assistants can compile drafts.
                  </p>
                </div>
              ) : sections.length === 0 ? (
                <div className="space-y-6 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-cream-dark/20 p-4 border border-border-warm rounded-lg text-xs">
                    <div>
                      <span className="font-bold text-brand uppercase tracking-wider block mb-1 text-[8px]">Selected Topic</span>
                      <span className="font-serif italic text-ink">{project.selected_topic}</span>
                    </div>
                    <div>
                      <span className="font-bold text-brand uppercase tracking-wider block mb-1 text-[8px]">Research Question</span>
                      <span className="font-serif italic text-ink">"{finalizedQuestion}"</span>
                    </div>
                  </div>

                  <div className="bg-cream border border-border-warm rounded-lg p-4 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                      Your Writing Style Preference (Optional)
                    </label>
                    <textarea
                      value={stylePreferenceDraft}
                      onChange={(e) => setStylePreferenceDraft(e.target.value)}
                      placeholder="e.g. I prefer shorter sentences, minimal jargon, and a direct tone."
                      rows={2}
                      className="w-full text-sm border border-stone-300 rounded-lg p-3 bg-white text-ink"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border-warm">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">Citation Style</label>
                        <select
                          value={citationStyleDraft}
                          onChange={(e) => setCitationStyleDraft(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded-lg p-2 bg-white text-ink"
                        >
                          <option value="">Default</option>
                          <option value="APA">APA</option>
                          <option value="MLA">MLA</option>
                          <option value="Chicago">Chicago</option>
                          <option value="GBT7714">GB/T 7714</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">Tone</label>
                        <select
                          value={formalityDraft}
                          onChange={(e) => setFormalityDraft(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded-lg p-2 bg-white text-ink"
                        >
                          <option value="">Default</option>
                          <option value="Formal">Formal</option>
                          <option value="Analytical">Analytical</option>
                          <option value="Direct">Direct</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">Writing Language</label>
                        <select
                          value={writingLanguageDraft}
                          onChange={(e) => setWritingLanguageDraft(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded-lg p-2 bg-white text-ink"
                        >
                          <option value="English">English</option>
                          <option value="Chinese">中文 (Chinese)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">Font</label>
                        <select
                          value={fontFamilyDraft}
                          onChange={(e) => setFontFamilyDraft(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded-lg p-2 bg-white text-ink"
                        >
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Arial">Arial</option>
                          <option value="Calibri">Calibri</option>
                          <option value="Cambria">Cambria</option>
                          <option value="Georgia">Georgia</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleSaveStylePreference}
                        disabled={savingStylePreference}
                        className="text-xs font-bold text-brand bg-brand-light px-3 py-1.5 rounded-md hover:bg-brand hover:text-white transition-all disabled:opacity-50"
                      >
                        {savingStylePreference ? "Saving..." : "Save Preference"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border-warm bg-cream p-6 text-center space-y-4">
                    <FileText className="h-8 w-8 text-brand mx-auto stroke-1" />
                    <div>
                      <h4 className="serif-heading text-md font-bold text-ink">No Outline Yet</h4>
                      <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">
                        Generate a complete, numbered thesis outline (1, 1.1, 1.2...) before drafting begins, so every chapter is written with the full structure in mind.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateOutline}
                      disabled={outlineLoading}
                      className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 mx-auto"
                    >
                      {outlineLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Structuring Thesis...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Generate Thesis Outline (AI)</span>
                        </>
                      )}
                    </button>
                    {outlineError && (
                      <p className="text-xs text-red-700 font-medium">{outlineError}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-cream-dark/20 p-4 border border-border-warm rounded-lg text-xs">
                    <div>
                      <span className="font-bold text-brand uppercase tracking-wider block mb-1 text-[8px]">Selected Topic</span>
                      <span className="font-serif italic text-ink">{project.selected_topic}</span>
                    </div>
                    <div>
                      <span className="font-bold text-brand uppercase tracking-wider block mb-1 text-[8px]">Research Question</span>
                      <span className="font-serif italic text-ink">"{finalizedQuestion}"</span>
                    </div>
                  </div>

                  <div className="bg-cream border border-border-warm rounded-lg p-4 text-left">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
                      Your Writing Style Preference (Optional)
                    </label>
                    <textarea
                      value={stylePreferenceDraft}
                      onChange={(e) => setStylePreferenceDraft(e.target.value)}
                      placeholder="e.g. I prefer shorter sentences, minimal jargon, and a direct tone."
                      rows={2}
                      className="w-full text-sm border border-stone-300 rounded-lg p-3 bg-white text-ink"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border-warm">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">Citation Style</label>
                        <select
                          value={citationStyleDraft}
                          onChange={(e) => setCitationStyleDraft(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded-lg p-2 bg-white text-ink"
                        >
                          <option value="">Default</option>
                          <option value="APA">APA</option>
                          <option value="MLA">MLA</option>
                          <option value="Chicago">Chicago</option>
                          <option value="GBT7714">GB/T 7714</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">Tone</label>
                        <select
                          value={formalityDraft}
                          onChange={(e) => setFormalityDraft(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded-lg p-2 bg-white text-ink"
                        >
                          <option value="">Default</option>
                          <option value="Formal">Formal</option>
                          <option value="Analytical">Analytical</option>
                          <option value="Direct">Direct</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">Writing Language</label>
                        <select
                          value={writingLanguageDraft}
                          onChange={(e) => setWritingLanguageDraft(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded-lg p-2 bg-white text-ink"
                        >
                          <option value="English">English</option>
                          <option value="Chinese">中文 (Chinese)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1">Font</label>
                        <select
                          value={fontFamilyDraft}
                          onChange={(e) => setFontFamilyDraft(e.target.value)}
                          className="w-full text-xs border border-stone-300 rounded-lg p-2 bg-white text-ink"
                        >
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Arial">Arial</option>
                          <option value="Calibri">Calibri</option>
                          <option value="Cambria">Cambria</option>
                          <option value="Georgia">Georgia</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={handleSaveStylePreference}
                        disabled={savingStylePreference}
                        className="text-xs font-bold text-brand bg-brand-light px-3 py-1.5 rounded-md hover:bg-brand hover:text-white transition-all disabled:opacity-50"
                      >
                        {savingStylePreference ? "Saving..." : "Save Preference"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {sections.map((sec) => {
                      const isGen = generatingSectionId === sec.id;
                      const isVal = validatingSectionId === sec.id;
                      const isSubmittingData = submittingDataId === sec.id;
                      const valReport = sectionValidation[sec.id];
                      const needsData = sec.requires_user_data && !sec.user_data;
                      const isSubsection = sec.level > 1;

                      return (
                        <div
                          key={sec.id}
                          className={`border border-border-warm rounded-lg overflow-hidden bg-white ${isSubsection ? "ml-6" : ""}`}
                        >
                          <div className="bg-cream border-b border-border-warm px-5 py-4 flex items-center justify-between flex-wrap gap-4">
                            <div>
                              <span className="text-[10px] font-mono text-brand font-bold uppercase tracking-wider block mb-1">
                                {sec.level === 1 ? "Chapter" : "Subsection"} {sec.section_number}
                              </span>
                              {editingTitleId === sec.id ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={titleDraft}
                                    onChange={(e) => setTitleDraft(e.target.value)}
                                    className="text-sm border border-stone-300 rounded px-2 py-1 bg-white text-ink font-serif focus:outline-none focus:ring-1 focus:ring-brand min-w-[200px]"
                                  />
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`${apiBaseUrl}/sections/${sec.id}/title`, {
                                          method: "PATCH",
                                          headers: {
                                            Authorization: `Bearer ${token}`,
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({ title: titleDraft }),
                                        });
                                        if (!res.ok) throw new Error("Failed to save title");
                                        const data = await res.json();
                                        setSections((prev) => prev.map((s) => (s.id === sec.id ? { ...s, title: data.title } : s)));
                                        setEditingTitleId(null);
                                      } catch (err: any) {
                                        alert(err.message || "Failed to update title");
                                      }
                                    }}
                                    className="text-xs bg-brand text-white px-2.5 py-1 rounded hover:bg-brand-hover font-semibold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingTitleId(null)}
                                    className="text-xs text-stone-500 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <h4 className={`serif-heading font-bold text-ink ${sec.level === 1 ? "text-md uppercase tracking-wide" : "text-sm"}`}>
                                    {sec.title}
                                  </h4>
                                  <button
                                    onClick={() => {
                                      setEditingTitleId(sec.id);
                                      setTitleDraft(sec.title || "");
                                    }}
                                    className="text-stone-400 hover:text-brand transition-colors p-1"
                                    title="Rename Section"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => handleAskForHelp(sec.id, sec.content || "")}
                                className="inline-flex items-center gap-1 rounded bg-amber-50 hover:bg-amber-100 text-[11px] font-bold text-amber-800 px-3 py-1.5 transition-colors border border-amber-200"
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                                <span>Ask Bounkoun for Help</span>
                              </button>

                              {sec.content ? (
                                <>
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                                    ✓ Drafted
                                  </span>
                                  <button
                                    onClick={() => handleStartEdit(sec.id, sec.content || "")}
                                    className="inline-flex items-center gap-1 rounded bg-stone-100 hover:bg-stone-200 text-[11px] font-bold text-ink px-3 py-1.5 transition-colors border border-stone-200"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-brand" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleValidateSection(sec.id)}
                                    disabled={isVal}
                                    className="inline-flex items-center gap-1 rounded bg-stone-100 hover:bg-stone-200 text-[11px] font-bold text-ink px-3 py-1.5 transition-colors border border-stone-200"
                                  >
                                    {isVal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5 text-brand" />}
                                    <span>Critique Draft</span>
                                  </button>
                                </>
                              ) : needsData ? (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                                  Awaiting Your Research Data
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-md">
                                  Not Drafted
                                </span>
                              )}

                              {!needsData && (
                                <button
                                  onClick={() => handleGenerateDraft(sec.id)}
                                  disabled={isGen}
                                  className="inline-flex items-center gap-1.5 rounded bg-brand hover:bg-brand-hover text-[11px] font-bold text-white px-3.5 py-1.5 transition-colors"
                                >
                                  {isGen ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-3.5 w-3.5" />
                                  )}
                                  <span>{sec.content ? "Regenerate Draft" : "Generate Draft (AI)"}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {needsData && (
                            <div className="p-6 bg-amber-50/40 space-y-3">
                              <p className="text-xs text-amber-900 leading-relaxed">
                                <strong>This subsection reports real research findings.</strong> Bounkoun cannot invent data —
                                paste your actual results, observations, survey data, or notes below, and the AI will help
                                write it up in clear academic prose without adding anything you haven't provided.
                              </p>
                              <textarea
                                placeholder="e.g. Interview responses, survey percentages, comparison notes, raw observations..."
                                rows={5}
                                value={dataDrafts[sec.id] || ""}
                                onChange={(e) => setDataDrafts((prev) => ({ ...prev, [sec.id]: e.target.value }))}
                                className="w-full text-sm border border-amber-300 rounded-lg p-3 bg-white text-ink"
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleSubmitData(sec.id)}
                                  disabled={isSubmittingData}
                                  className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {isSubmittingData ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <span>Save Research Data</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {sec.content && (
                            <div className="p-6 md:p-8 space-y-4">
                              {editingSectionId === sec.id ? (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-1 border-b border-stone-200 pb-2">
                                    <button
                                      type="button"
                                      onClick={() => applyFormatting("bold")}
                                      className="p-1.5 rounded hover:bg-stone-100 text-stone-700 transition-colors"
                                      title="Bold"
                                    >
                                      <Bold className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => applyFormatting("italic")}
                                      className="p-1.5 rounded hover:bg-stone-100 text-stone-700 transition-colors"
                                      title="Italic"
                                    >
                                      <Italic className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => applyFormatting("heading")}
                                      className="p-1.5 rounded hover:bg-stone-100 text-stone-700 transition-colors"
                                      title="Heading"
                                    >
                                      <Heading2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => applyFormatting("bullet")}
                                      className="p-1.5 rounded hover:bg-stone-100 text-stone-700 transition-colors"
                                      title="Bullet List"
                                    >
                                      <List className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => applyFormatting("numbered")}
                                      className="p-1.5 rounded hover:bg-stone-100 text-stone-700 transition-colors"
                                      title="Numbered List"
                                    >
                                      <ListOrdered className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <textarea
                                    ref={editTextareaRef}
                                    value={editDraft}
                                    onChange={(e) => setEditDraft(e.target.value)}
                                    rows={8}
                                    className="w-full text-sm border border-stone-300 rounded-lg p-3 bg-white text-ink font-serif"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={handleCancelEdit}
                                      className="text-xs font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 px-3.5 py-1.5 rounded-md transition-all"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveEdit(sec.id)}
                                      disabled={savingEditId === sec.id}
                                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand hover:bg-brand-hover px-3.5 py-1.5 rounded-md transition-all disabled:opacity-50"
                                    >
                                      {savingEditId === sec.id ? (
                                        <>
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          <span>Saving...</span>
                                        </>
                                      ) : (
                                        "Save Edit"
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="font-serif text-sm md:text-base leading-relaxed text-ink text-justify whitespace-pre-line select-text">
                                  {sec.content}
                                </p>
                              )}
                              <div className="pt-4 border-t border-border-warm flex justify-between items-center text-[10px] text-ink-muted">
                                <span>Word Count: ~{sec.content.split(/\s+/).filter(Boolean).length} words</span>
                                <span>Double Spaced Academic Style</span>
                              </div>
                            </div>
                          )}

                          {guidanceSectionId === sec.id && (
                            <div className="border-t border-amber-200 bg-amber-50/40 p-6 space-y-4 text-left">
                              {loadingGuidance ? (
                                <div className="flex items-center gap-2 text-amber-800 text-sm">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Thinking through this with you...</span>
                                </div>
                              ) : guidance ? (
                                <>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">What This Section Needs To Do</span>
                                    <p className="text-sm text-ink leading-relaxed">{guidance.purpose}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-2">Think Through These</span>
                                    <ul className="space-y-2">
                                      {guidance.guiding_questions.map((q, i) => (
                                        <li key={i} className="text-sm text-ink leading-relaxed pl-4 relative">
                                          <span className="absolute left-0 text-amber-700 font-bold">{i + 1}.</span>
                                          {q}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <p className="text-xs text-amber-900 italic">{guidance.encouragement}</p>
                                  <button onClick={() => setGuidanceSectionId(null)} className="text-xs font-semibold text-amber-800 hover:underline">Close</button>
                                </>
                              ) : null}
                            </div>
                          )}

                          {valReport && (
                            <div className="border-t border-border-warm bg-stone-50 p-6 space-y-4 text-left">
                              <div className="flex items-center justify-between border-b border-border-warm pb-3">
                                <h5 className="serif-heading text-xs font-bold text-brand uppercase tracking-wider flex items-center gap-1">
                                  <Award className="h-4 w-4" /> Evaluative Feedback — {sec.title}
                                </h5>
                                <div className="text-xs font-semibold text-brand">
                                  Score: <span className="font-bold font-mono bg-brand-light px-2 py-0.5 rounded">{valReport.score}/100</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">Academic Strengths</span>
                                  <ul className="space-y-1">
                                    {valReport.strengths?.map((str, i) => (
                                      <li key={i} className="text-xs text-ink-muted pl-3 relative leading-normal">
                                        <span className="absolute left-0 top-0.5 text-emerald-600 font-bold">•</span>
                                        {str}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block mb-1">Rigor Weaknesses</span>
                                  <ul className="space-y-1">
                                    {valReport.weaknesses?.map((weak, i) => (
                                      <li key={i} className="text-xs text-ink-muted pl-3 relative leading-normal">
                                        <span className="absolute left-0 top-0.5 text-red-500 font-bold">•</span>
                                        {weak}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand block mb-1">Directives</span>
                                  <ul className="space-y-1">
                                    {valReport.recommendations?.map((rec, i) => (
                                      <li key={i} className="text-xs text-ink-muted font-medium pl-3 relative leading-normal">
                                        <span className="absolute left-0 top-0.5 text-brand font-bold">•</span>
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-lg border border-border-warm bg-cream p-6 space-y-3">
                    <h4 className="serif-heading text-md font-bold text-brand">Abstract & Keywords</h4>
                    {allChaptersDrafted ? (
                      project.abstract ? (
                        <div className="space-y-2 text-left">
                          <p className="text-sm font-serif leading-relaxed text-ink">{project.abstract}</p>
                          {project.keywords && project.keywords.length > 0 && (
                            <p className="text-xs text-ink-muted">
                              <strong>Keywords:</strong> {project.keywords.join(", ")}
                            </p>
                          )}
                          <button
                            onClick={handleGenerateAbstract}
                            disabled={generatingAbstract}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            Regenerate abstract
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-ink-muted">
                            All chapters are drafted. Generate the abstract and keywords now, summarizing the complete thesis.
                          </p>
                          <button
                            onClick={handleGenerateAbstract}
                            disabled={generatingAbstract}
                            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                          >
                            {generatingAbstract ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Synthesizing Abstract...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Generate Abstract & Keywords (AI)</span>
                              </>
                            )}
                          </button>
                          {abstractError && <p className="text-xs text-red-700 font-medium">{abstractError}</p>}
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-ink-muted">
                        Draft all {chapters.length} chapters ({draftedChapterCount}/{chapters.length} complete) to unlock abstract generation.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-border-warm bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="serif-heading text-sm font-bold text-brand">Document Health</h4>
                      <button
                        onClick={handleCheckHealth}
                        disabled={loadingHealth}
                        className="text-xs font-semibold text-brand hover:underline disabled:opacity-50"
                      >
                        {loadingHealth ? "Checking..." : documentHealth ? "Refresh" : "Check Now"}
                      </button>
                    </div>
                    {documentHealth && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-brand">{documentHealth.overall}%</span>
                          <span className="text-xs text-ink-muted">Overall quality across your drafted chapters</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div className="bg-stone-50 rounded p-2">
                            <span className="block text-ink-muted">Argument</span>
                            <span className="font-bold text-ink">{documentHealth.argument}%</span>
                          </div>
                          <div className="bg-stone-50 rounded p-2">
                            <span className="block text-ink-muted">Evidence</span>
                            <span className="font-bold text-ink">{documentHealth.evidence}%</span>
                          </div>
                          <div className="bg-stone-50 rounded p-2">
                            <span className="block text-ink-muted">Transitions</span>
                            <span className="font-bold text-ink">{documentHealth.transitions}%</span>
                          </div>
                          <div className="bg-stone-50 rounded p-2">
                            <span className="block text-ink-muted">Citations</span>
                            <span className="font-bold text-ink">{documentHealth.citations}%</span>
                          </div>
                        </div>
                        {documentHealth.top_issues && documentHealth.top_issues.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-ink-muted block mb-1">Worth addressing:</span>
                            <ul className="space-y-1">
                              {documentHealth.top_issues.map((issue: string, i: number) => (
                                <li key={i} className="text-xs text-ink leading-relaxed pl-3 relative">
                                  <span className="absolute left-0 text-brand">•</span>
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border-warm">
                    <button
                      onClick={handleCompleteWriting}
                      disabled={completingWriting}
                      className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-brand-hover transition-colors"
                    >
                      Complete Writing Phase & Go to Validation
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeStage === "Validation" && (
            <div className="space-y-6">
              <div>
                <h3 className="serif-heading text-xl font-bold text-brand">Stage 5: High-Fidelity Validation Oversight</h3>
                <p className="text-sm text-ink-muted mt-1">
                  Run end-to-end academic auditing to certify compliance with university standards.
                </p>
              </div>

              {chapters.length === 0 ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50/40 p-5 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-800 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-900">
                    <strong>Writing Required:</strong> You must generate an outline and draft thesis chapters in Stage 4 before validating the final paper compilation.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  <div className="bg-cream border border-border-warm p-5 rounded-lg space-y-4">
                    <h4 className="serif-heading text-md font-bold text-brand">Consolidated Integrity Report</h4>
                    <div className="space-y-3 pt-2 text-sm text-ink">
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span>Academic Chapters Drafted:</span>
                        <span className="font-bold font-mono">{draftedChapterCount} / {chapters.length}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span>Abstract & Keywords:</span>
                        <span className="font-bold font-mono text-brand">{project.abstract ? "Generated" : "Not yet generated"}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span>Research Quality Grade:</span>
                        <span className="font-bold font-mono text-brand">
                          {allChaptersDrafted ? "Certified (Compliant)" : "Pending Completion"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border-warm">
                    <button
                      onClick={handleCompleteValidation}
                      disabled={completingValidation}
                      className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-brand-hover"
                    >
                      Approve Validation Report & Proceed
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeStage === "Conclusion" && (
            <div className="space-y-6">
              <div>
                <h3 className="serif-heading text-xl font-bold text-brand">Stage 6: Blueprint Compilation & Asset Export</h3>
                <p className="text-sm text-ink-muted mt-1">
                  Your academic thesis draft is compiled. Review, download as Markdown or Microsoft Word docx, and finalize submission.
                </p>
              </div>

              <div className="space-y-6">
                {project.abstract && (
                  <div className="rounded-lg border border-border-warm bg-cream p-6 text-left space-y-2">
                    <h4 className="serif-heading text-md font-bold text-brand">Abstract</h4>
                    <p className="text-sm font-serif leading-relaxed text-ink">{project.abstract}</p>
                    {project.keywords && project.keywords.length > 0 && (
                      <p className="text-xs text-ink-muted pt-2">
                        <strong>Keywords:</strong> {project.keywords.join(", ")}
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-lg border border-brand/20 bg-brand-light/30 p-6 flex items-start gap-4 text-left">
                  <Award className="h-10 w-10 text-brand flex-shrink-0 stroke-1 mt-0.5" />
                  <div>
                    <h4 className="serif-heading text-lg font-bold text-brand">Thesis Ready for Accrual</h4>
                    <p className="text-xs text-ink-muted leading-relaxed mt-1">
                      Platform co-pilot verified: all milestones successfully resolved. Core drafting chapters conform to standard {project.academic_level} criteria.
                    </p>
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <button
                        onClick={handleCompleteConclusion}
                        className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-brand-hover shadow-xs"
                      >
                        Conclude Project Blueprints
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-border-warm rounded-lg p-6 bg-stone-50 space-y-4 text-left">
                  <h4 className="serif-heading text-md font-bold text-brand flex items-center gap-1.5">
                    <Download className="h-5 w-5 text-brand" /> Export Generated Assets
                  </h4>
                  <p className="text-xs text-ink-muted">
                    Acquire real academic document files compiled directly from your workspace draft components.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <a
                      href={`${apiBaseUrl}/export/${project.id}/markdown`}
                      download={`thesis-${project.id}.md`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-border-warm rounded-lg hover:border-brand/40 transition-all text-left"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-brand uppercase font-bold block mb-0.5">Asset Type</span>
                        <span className="text-sm font-semibold text-ink">Download as Markdown</span>
                        <span className="text-xs text-ink-muted block mt-0.5">Highly readable raw text layout (.md)</span>
                      </div>
                      <Download className="h-5 w-5 text-brand" />
                    </a>

                    <a
                      href={`${apiBaseUrl}/export/${project.id}/docx`}
                      download={`thesis-${project.id}.docx`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-border-warm rounded-lg hover:border-brand/40 transition-all text-left"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-brand uppercase font-bold block mb-0.5">Asset Type</span>
                        <span className="text-sm font-semibold text-ink">Download as Word</span>
                        <span className="text-xs text-ink-muted block mt-0.5">Formatted docx ready for Word (.docx)</span>
                      </div>
                      <Download className="h-5 w-5 text-brand" />
                    </a>

                    <a
                      href={`${apiBaseUrl}/export/${project.id}/pdf`}
                      download={`thesis-${project.id}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white border border-border-warm rounded-lg hover:border-brand/40 transition-all text-left"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-brand uppercase font-bold block mb-0.5">Asset Type</span>
                        <span className="text-sm font-semibold text-ink">Download as PDF</span>
                        <span className="text-xs text-ink-muted block mt-0.5">Portable document format (.pdf)</span>
                      </div>
                      <Download className="h-5 w-5 text-brand" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
