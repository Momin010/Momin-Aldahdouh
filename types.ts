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
  action?: 'GOTO_PREVIEW' | 'AWAITING_PLAN_APPROVAL';
  plan?: Plan;
  streaming?: boolean;
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