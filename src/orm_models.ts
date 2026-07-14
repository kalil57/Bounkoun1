import { DataTypes, Model, Sequelize } from "sequelize";

/**
 * ============================================================================
 * ORM Model Mapping for PostgreSQL
 * 
 * Below is the Sequelize (TypeScript/Node.js) representation of the database 
 * models requested by the user, alongside Python SQLAlchemy equivalents in the comments.
 * 
 * Due to the "Do not enable Cloud SQL" directive, the live server persists data
 * to bounkoun_db.json, but these ORM mappings define the exact structures 
 * that target PostgreSQL tables.
 * ============================================================================
 */

// Initialize a Sequelize instance (configured for PostgreSQL connection)
export const sequelize = new Sequelize("postgres://user:password@host:5432/db", {
  dialect: "postgres",
  logging: false,
});

/**
 * ----------------------------------------------------------------------------
 * 1. Project Model
 * 
 * Python SQLAlchemy Equivalent:
 * 
 * class Project(Base):
 *     __tablename__ = 'projects'
 *     
 *     id = Column(String, primary_key=True)
 *     title = Column(String, nullable=False)
 *     student_name = Column(String, nullable=False)
 *     academic_level = Column(String, nullable=False)
 *     discipline = Column(String, nullable=False)
 *     status = Column(String, default='Topic Selection')
 *     initial_idea = Column(Text, nullable=True)
 *     user_id = Column(String, nullable=False, default='user_123')
 *     created_at = Column(DateTime, default=datetime.utcnow)
 *     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
 * ----------------------------------------------------------------------------
 */
export class ProjectModel extends Model {
  public id!: string;
  public title!: string;
  public studentName!: string;
  public academicLevel!: string;
  public discipline!: string;
  public status!: string;
  public initialIdea?: string;
  public user_id!: string;
  public topic!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

ProjectModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    studentName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "student_name",
    },
    academicLevel: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "academic_level",
    },
    discipline: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Topic Selection",
    },
    initialIdea: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "initial_idea",
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user_123",
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "projects",
    timestamps: true,
  }
);

/**
 * ----------------------------------------------------------------------------
 * 2. WorkflowStep Model
 * 
 * Python SQLAlchemy Equivalent:
 * 
 * class WorkflowStep(Base):
 *     __tablename__ = 'workflow_steps'
 *     
 *     id = Column(String, primary_key=True)
 *     project_id = Column(String, ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
 *     step_name = Column(String, nullable=False)
 *     description = Column(Text, nullable=True)
 *     assigned_service = Column(String, nullable=True)
 *     status = Column(String, default='Pending')
 *     is_completed = Column(Boolean, default=False)
 *     order = Column(Integer, nullable=False)
 *     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
 *     completed_at = Column(DateTime, nullable=True)
 * ----------------------------------------------------------------------------
 */
export class WorkflowStepModel extends Model {
  public id!: string;
  public project_id!: string;
  public step_name!: string;
  public description!: string;
  public assigned_service!: string;
  public status!: string;
  public is_completed!: boolean;
  public order!: number;
  public updatedAt!: Date;
  public completed_at!: Date | null;
}

WorkflowStepModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "projects",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    step_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    assigned_service: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Pending",
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "workflow_steps",
    timestamps: true,
    createdAt: false, // only updatedAt and completed_at tracked as requested
  }
);

// Establish relationships
ProjectModel.hasMany(WorkflowStepModel, { foreignKey: "project_id", as: "steps" });
WorkflowStepModel.belongsTo(ProjectModel, { foreignKey: "project_id", as: "project" });
