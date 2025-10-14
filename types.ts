export interface Files {
  [path: string]: string;
}

export interface Plan {
  projectName: string;
  description: string;
  features: string[];
  fileStructure: { path: string, purpose: string }[];
  techStack: string[];
}

export interface Message {
  role: 'user' | 'model' | 'system' | 'correction';
  content: string;
  action?: 'GOTO_PREVIEW' | 'AWAITING_PLAN_APPROVAL' | 'AWAITING_BUILD_APPROVAL';
  plan?: Plan;
  streaming?: boolean;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  type: string;
  content: string; // base64 encoded string
}

export interface Change {
  filePath: string;
  content?: string;
  action: 'create' | 'update' | 'delete';
}

export interface Modification {
  projectName?: string;
  reason: string;
  changes: Change[];
  previewHtml?: string;
  standaloneHtml?: string;
}

export type ApiResponse =
  | {
      responseType: 'CHAT';
      message: string;
      modification?: never;
      plan?: never;
    }
  | {
      responseType: 'MODIFY_CODE';
      modification: Modification;
      message?: never;
      plan?: never;
    }
  | {
      responseType: 'PROJECT_PLAN';
      plan: Plan;
      message?: never;
      modification?: never;
    };

// New types for version history
export interface AppState {
  files: Files;
  previewHtml: string;
  standaloneHtml: string;
  chatMessages: Message[];
  hasGeneratedCode: boolean;
  projectName: string;
  projectPlan: Plan | null;
}

export interface History {
  versions: AppState[];
  currentIndex: number;
}

export interface ConsoleMessage {
  level: 'log' | 'warn' | 'error' | 'info';
  payload: any[];
}


// New types for multi-project workspace
export interface Project {
  id: string;
  projectName: string;
  history: History;
}

export interface Workspace {
  projects: Project[];
  activeProjectId: string | null;
}

// New type for user authentication
export interface User {
  email: string;
}

// New type for Design Blueprints
export interface DesignBlueprint {
  name: string;
  description: string;
  promptFragment: string;
}

// New types for Visual Editor
export interface PreviewElement {
  id: string;
  tagName: string;
  className: string;
  textContent?: string;
  styles: Record<string, string>;
  attributes: Record<string, string>;
  children: PreviewElement[];
  rect: DOMRect;
}

export interface PreviewChange {
  elementId: string;
  type: 'text' | 'style' | 'attribute' | 'resize';
  property: string;
  value: string;
  oldValue?: string;
}

export interface VisualEditorState {
  isEnabled: boolean;
  hoveredElement: PreviewElement | null;
  selectedElement: PreviewElement | null;
  isEditing: boolean;
}

// New types for Database Management
export interface DatabaseColumn {
  name: string;
  type: string;
  primaryKey?: boolean;
  nullable?: boolean;
  unique?: boolean;
  default?: string;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface DatabaseIndex {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface DatabaseTable {
  id: string;
  name: string;
  columns: DatabaseColumn[];
  indexes: DatabaseIndex[];
  rowCount: number;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  tables: DatabaseTable[];
}

export interface DatabaseSchema {
  tables: DatabaseTable[];
  connections: DatabaseConnection[];
}

// New types for Deployment Services
export interface DeploymentPlatform {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  pricing: string;
  status: 'available' | 'maintenance' | 'disabled';
}

export interface DeploymentConfig {
  platform: string;
  projectName: string;
  buildSettings?: {
    buildCommand: string;
    outputDir: string;
    nodeVersion?: string;
  };
}

export interface DeploymentResult {
  id: string;
  platform: string;
  projectName: string;
  url: string;
  status: 'pending' | 'building' | 'success' | 'failed';
  createdAt: string;
  buildTime?: number;
  size?: string;
}

export interface DeploymentStatus {
  id: string;
  status: string;
  url?: string;
  buildTime?: number;
  size?: string;
  logs?: string[];
}

// New types for Git Integration
export interface GitRepository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  cloneUrl: string;
  defaultBranch: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GitCommit {
  id: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: string;
  url: string;
}

export interface GitBranch {
  name: string;
  commit: {
    sha: string;
    message: string;
  };
  protected: boolean;
}

// New types for Supabase Integration
export interface SupabaseTable {
  id: string;
  name: string;
  schema: string;
  columns: DatabaseColumn[];
  rowCount: number;
  createdAt: string;
}

export interface SupabaseProject {
  id: string;
  name: string;
  databaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  tables: SupabaseTable[];
  status: 'active' | 'suspended' | 'deleted';
}