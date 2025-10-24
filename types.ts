export interface Files {
  [path: string]: string;
}

export interface Plan {
  projectName: string;
  description: string;
  features: string[];
  techStack: string[];
  backendRequirements: {
    apiEndpoints: string[];
    databaseSchema: string;
    authentication: string;
    services: string[];
    fileStructure: string[];
  };
  frontendRequirements: {
    components: string[];
    stateManagement: string;
    routing: string;
    styling: string;
    fileStructure: string[];
  };
  standaloneRequirements: {
    htmlStructure: string;
    cssIntegration: string;
    jsFunctionality: string;
    features: string[];
    qualityStandards: string[];
  };
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