from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Depends, Query, status
from sqlalchemy import create_engine, Column, String, Integer, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

# Create the FastAPI App instance
# This automatically enables standard interactive Swagger UI docs at "/docs" and ReDoc at "/redoc"
app = FastAPI(
    title="🎓 Bounkoun Core Orchestration Microservice",
    description="Backend microservice handling student project creation, research topic/question workflows, and event logging.",
    version="1.0.0"
)

# ==========================================
# 💾 SQLALCHEMY DATABASE ENGINE & BASE
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./bounkoun_core.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 🗄️ SQLALCHEMY MODELS
# ==========================================

class DBProject(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    student_name = Column(String, default="Amadou Diallo")
    academic_level = Column(String, default="Bachelor") # Bachelor, Master, PhD
    discipline = Column(String, nullable=False)
    status = Column(String, default="Topic Selection")
    initial_idea = Column(String, default="")
    topic = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = Column(String, default="user_123")

    steps = relationship("DBWorkflowStep", back_populates="project", cascade="all, delete-orphan")
    events = relationship("DBEvent", back_populates="project", cascade="all, delete-orphan")


class DBWorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    step_name = Column(String, nullable=False) # Topic, ResearchQuestion, Literature, Methodology, Findings, Conclusion
    description = Column(String, nullable=True)
    assigned_service = Column(String, default="core")
    status = Column(String, default="Pending") # Pending, InProgress, Completed
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    order = Column(Integer, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("DBProject", back_populates="steps")


class DBEvent(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    event_type = Column(String, nullable=False) # e.g. project_created, question_finalized
    payload = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    project = relationship("DBProject", back_populates="events")


# Create tables on startup
Base.metadata.create_all(bind=engine)

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# 📊 PYDANTIC SCHEMAS WITH EXAMPLES
# ==========================================

class ProjectCreate(BaseModel):
    title: str = Field(..., description="The title of the thesis or research project")
    discipline: str = Field(..., description="Subject domain of research")
    academic_level: str = Field(..., description="Rigor scale: Bachelor, Master, PhD")
    student_name: Optional[str] = Field("Amadou Diallo", description="Name of student")
    initial_idea: Optional[str] = Field("", description="Rough drafts or thoughts about the research scope")
    user_id: Optional[str] = Field("user_123", description="Student account identifier")

    class Config:
        schema_extra = {
            "example": {
                "title": "Decentralized Edge Networks",
                "discipline": "Computer Science",
                "academic_level": "Master",
                "student_name": "Amadou Diallo",
                "initial_idea": "Leveraging local consensus protocols to reduce communication overhead.",
                "user_id": "user_123"
            }
        }


class ProjectResponse(BaseModel):
    id: str
    title: str
    student_name: str
    academic_level: str
    discipline: str
    status: str
    initial_idea: str
    topic: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_id: str

    class Config:
        orm_mode = True


class TopicSuggestRequest(BaseModel):
    interest: str = Field(..., description="Keywords or conceptual focus area of student interest")

    class Config:
        schema_extra = {
            "example": {
                "interest": "Fault tolerant federated learning algorithms"
            }
        }


class TopicSelectRequest(BaseModel):
    topic: str = Field(..., description="The chosen research topic title to select and finalize")

    class Config:
        schema_extra = {
            "example": {
                "topic": "An Empirical Study of Fault-Tolerant Federated Learning Protocols in High-Latency Edge Networks"
            }
        }


class QuestionSelectRequest(BaseModel):
    question: str = Field(..., description="The finalized, validated research question to save")

    class Config:
        schema_extra = {
            "example": {
                "question": "How can dynamic client selection rules prevent model poisoning in high-latency federated systems?"
            }
        }


class QuestionValidateRequest(BaseModel):
    question: str = Field(..., description="The raw research question string drafted by the student to validate")

    class Config:
        schema_extra = {
            "example": {
                "question": "Does federated learning work?"
            }
        }


class QuestionValidateResponse(BaseModel):
    is_valid: bool = Field(..., description="True if question matches the required rigor standard")
    feedback: str = Field(..., description="Detailed advice or methodological critiques to help refine the draft")

    class Config:
        schema_extra = {
            "example": {
                "is_valid": False,
                "feedback": "The question is too brief and subjective. A high-quality PhD research question must evaluate specific mechanics, metrics, and configurations."
            }
        }


class WorkflowStepResponse(BaseModel):
    id: str
    project_id: str
    step_name: str
    description: str
    assigned_service: str
    status: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    order: int

    class Config:
        orm_mode = True


class StepCompleteRequest(BaseModel):
    step_name: str = Field(..., description="The logical step code name (e.g., Literature, Methodology)")

    class Config:
        schema_extra = {
            "example": {
                "step_name": "Literature"
            }
        }


class EventLogRequest(BaseModel):
    event_type: str = Field(..., description="Type of microservice or client interaction event")
    payload: Dict[str, Any] = Field(default_factory=dict, description="JSON dictionary describing parameters and metrics")

    class Config:
        schema_extra = {
            "example": {
                "event_type": "question_finalized",
                "payload": {
                    "question": "How can dynamic client selection rules prevent model poisoning?",
                    "advisor_approvals": True,
                    "validation_score": 9.2
                }
            }
        }


class EventLogResponse(BaseModel):
    success: bool
    event: Dict[str, Any]


# ==========================================
# ⚡ FASTAPI API ENDPOINTS
# ==========================================

@app.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    """
    **Create a research project.**
    
    Creates a new student thesis project, automatically boots up default pipeline stages,
    and initializes logs.
    
    ### Example Request Body:
    ```json
    {
      "title": "Decentralized Edge Networks",
      "discipline": "Computer Science",
      "academic_level": "PhD",
      "student_name": "Amadou Diallo",
      "initial_idea": "Improving high-latency resilience."
    }
    ```
    
    ### Example Response Body:
    ```json
    {
      "id": "proj_17208399",
      "title": "Decentralized Edge Networks",
      "student_name": "Amadou Diallo",
      "academic_level": "PhD",
      "discipline": "Computer Science",
      "status": "Topic Selection",
      "initial_idea": "Improving high-latency resilience.",
      "topic": null,
      "created_at": "2026-07-13T09:00:00Z",
      "updated_at": "2026-07-13T09:00:00Z",
      "user_id": "user_123"
    }
    ```
    """
    project_id = f"proj_{int(datetime.utcnow().timestamp())}"
    db_project = DBProject(
        id=project_id,
        title=project_in.title,
        student_name=project_in.student_name,
        academic_level=project_in.academic_level,
        discipline=project_in.discipline,
        initial_idea=project_in.initial_idea,
        user_id=project_in.user_id,
        status="Topic Selection"
    )
    db.add(db_project)
    
    # Initialize default workflow steps
    default_steps = [
        ("Topic", "Define research scope and selected topic proposal", "core", 1),
        ("ResearchQuestion", "Formulate and validate high-rigor core questions", "validation", 2),
        ("Literature", "Gather relevant publications and draft literature matrix", "literature", 3),
        ("Methodology", "Detail variables, data gathers, and design parameters", "stats", 4),
        ("Findings", "Compute analytical regression models and explain stats results", "stats", 5),
        ("Conclusion", "Synthesize academic contributions and finalize draft", "writing", 6)
    ]
    
    for name, desc, service, order in default_steps:
        db_step = DBWorkflowStep(
            id=f"step_{project_id}_{order}",
            project_id=project_id,
            step_name=name,
            description=desc,
            assigned_service=service,
            status="Pending",
            is_completed=False,
            order=order
        )
        db.add(db_step)
        
    db.commit()
    db.refresh(db_project)
    return db_project


@app.get("/projects", response_model=List[ProjectResponse])
def list_projects(user_id: str = Query("user_123"), db: Session = Depends(get_db)):
    """
    **Get all active student projects.**
    """
    return db.query(DBProject).filter(DBProject.user_id == user_id).all()


@app.post("/projects/{id}/topic/suggest", response_model=List[str])
def suggest_topics(id: str, req: TopicSuggestRequest, db: Session = Depends(get_db)):
    """
    **Generate topic suggestions based on interest area.**
    
    Matches the student's raw interest area against the database's project academic level constraints.
    
    ### Example Response:
    ```json
    [
      "An Epistemological Inquiry into the Ontological Foundations of Fault tolerant federated learning",
      "Theoretical Reconstruction of Fault tolerant federated learning in Decentered Networks"
    ]
    ```
    """
    project = db.query(DBProject).filter(DBProject.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    clean_interest = req.interest or "Modern Technology"
    if project.academic_level == "PhD":
        return [
            f"An Epistemological Inquiry into the Ontological Foundations of {clean_interest}",
            f"A Multi-Agent Dynamic Model of {clean_interest} Ecosystems in High-Frequency Environments",
            f"Theoretical Reconstruction of {clean_interest} in Decentered Global Networks"
        ]
    elif project.academic_level == "Master":
        return [
            f"A Comparative Analysis of {clean_interest} in Developing Markets",
            f"Optimizing {clean_interest} Frameworks Using Applied Machine Learning Models",
            f"A Mixed-Methods Investigation of Stakeholder Trust in {clean_interest} Systems"
        ]
    else:
        return [
            f"The Impact of {clean_interest} on Small and Medium Enterprises",
            f"Exploring the Barriers to Adopting {clean_interest} in Modern Workplaces"
        ]


@app.post("/projects/{id}/topic/select")
def select_topic(id: str, req: TopicSelectRequest, db: Session = Depends(get_db)):
    """
    **Save the selected topic, upgrade project status and mark the workflow step complete.**
    """
    project = db.query(DBProject).filter(DBProject.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.topic = req.topic
    if project.status == "Topic Selection":
        project.status = "Proposal"
        
    # Mark topic step as complete
    step = db.query(DBWorkflowStep).filter(
        DBWorkflowStep.project_id == id,
        DBWorkflowStep.step_name == "Topic"
    ).first()
    if step:
        step.is_completed = True
        step.status = "Completed"
        step.completed_at = datetime.utcnow()
        
    db.commit()
    return {"success": True, "message": "Research topic finalized successfully."}


@app.post("/projects/{id}/question/suggest", response_model=List[str])
def suggest_questions(id: str, db: Session = Depends(get_db)):
    """
    **Generate research questions suitable for the chosen topic and complexity.**
    """
    project = db.query(DBProject).filter(DBProject.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    topic = project.topic or "the chosen academic research topic"
    if project.academic_level == "PhD":
        return [
            f"How does the integration of {topic} alter the underlying systemic thresholds of decentralization?",
            f"Under what conditions does {topic} generate positive externalities in high-volatility environments?"
        ]
    else:
         return [
            f"To what extent does {topic} impact daily operational outputs?",
            f"What are the primary operational challenges encountered when implementing {topic}?"
        ]


@app.post("/projects/{id}/question/validate", response_model=QuestionValidateResponse)
def validate_question(id: str, req: QuestionValidateRequest, db: Session = Depends(get_db)):
    """
    **Evaluate a research question's scientific quality.**
    """
    project = db.query(DBProject).filter(DBProject.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    question = req.question
    if not question or len(question.strip()) < 15:
        return {
            "is_valid": False,
            "feedback": "The question is too brief. A high-quality academic research question must be specific, contextualized, and fully formulated."
        }
    if not question.strip().endswith("?"):
        return {
            "is_valid": False,
            "feedback": "The research question must be phrased as a question and end with a question mark (?)."
        }
    return {
        "is_valid": True,
        "feedback": f"Excellent! The question is clear, highly feasible, and demonstrates appropriate rigor and alignment with the expectations of a {project.academic_level} level dissertation."
    }


@app.post("/projects/{id}/workflow/complete-step")
def complete_workflow_step(id: str, req: StepCompleteRequest, db: Session = Depends(get_db)):
    """
    **Mark a workflow step as completed.**
    """
    step = db.query(DBWorkflowStep).filter(
        DBWorkflowStep.project_id == id,
        DBWorkflowStep.step_name == req.step_name
    ).first()
    if not step:
         raise HTTPException(status_code=404, detail="Workflow step not found")
         
    step.is_completed = True
    step.status = "Completed"
    step.completed_at = datetime.utcnow()
    db.commit()
    return {"success": True, "step_name": req.step_name, "status": "Completed"}


@app.post("/projects/{id}/events", response_model=EventLogResponse, status_code=status.HTTP_201_CREATED)
def log_event(id: str, req: EventLogRequest, db: Session = Depends(get_db)):
    """
    **Log a structured tracking event.**
    
    Stores analytics events and lifecycle updates for orchestration auditing.
    
    ### Example Request Body:
    ```json
    {
      "event_type": "project_created",
      "payload": {
        "client_session_id": "sess_8372",
        "action": "initialize_dashboard"
      }
    }
    ```
    
    ### Example Response Body:
    ```json
    {
      "success": true,
      "event": {
        "id": "evt_17208401",
        "project_id": "proj_12345",
        "event_type": "project_created",
        "payload": {
          "client_session_id": "sess_8372",
          "action": "initialize_dashboard"
        },
        "timestamp": "2026-07-13T09:02:00Z"
      }
    }
    ```
    """
    project = db.query(DBProject).filter(DBProject.id == id).first()
    if not project:
         raise HTTPException(status_code=404, detail="Project not found")
         
    event_id = f"evt_{int(datetime.utcnow().timestamp())}"
    db_event = DBEvent(
        id=event_id,
        project_id=id,
        event_type=req.event_type,
        payload=req.payload
    )
    db.add(db_event)
    db.commit()
    
    return {
        "success": True,
        "event": {
            "id": event_id,
            "project_id": id,
            "event_type": req.event_type,
            "payload": req.payload,
            "timestamp": db_event.timestamp
        }
    }
