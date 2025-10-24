import type { Message, Files, FileAttachment, ApiResponse } from '../types';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  model: 'fast' | 'quality' | 'creative';
  systemPrompt: string;
  icon: string;
  color: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: 'code_generation' | 'debugging' | 'optimization' | 'analysis' | 'testing';
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

// Available AI Agents
export const AVAILABLE_AGENTS: AIAgent[] = [
  {
    id: 'frontend',
    name: 'Frontend Agent',
    description: 'Specialized in building complex React frontend applications with multiple components, state management, and modern UI',
    capabilities: ['React Components', 'State Management', 'UI/UX Design', 'Routing', 'Custom Hooks'],
    model: 'quality',
    systemPrompt: 'You are a senior React frontend developer. Focus on creating complex, multi-component React applications with proper state management, custom hooks, routing, and responsive design. Ensure all components are fully functional and follow best practices.',
    icon: '⚛️',
    color: 'blue'
  },
  {
    id: 'backend',
    name: 'Backend Agent',
    description: 'Expert in building robust backend APIs, services, database schemas, and server-side logic',
    capabilities: ['API Endpoints', 'Database Design', 'Authentication', 'Services', 'Server Logic'],
    model: 'quality',
    systemPrompt: 'You are a senior backend developer. Specialize in creating API endpoints, database schemas, authentication systems, services, and server-side logic. Ensure secure, scalable, and efficient backend code with proper error handling.',
    icon: '🔧',
    color: 'green'
  },
  {
    id: 'standalone',
    name: 'Standalone Agent',
    description: 'Master at converting React apps to high-quality standalone HTML with vanilla JavaScript',
    capabilities: ['HTML Conversion', 'Vanilla JS', 'State Management', 'CSS Integration', 'Full Functionality'],
    model: 'quality',
    systemPrompt: 'You are a vanilla JavaScript expert specializing in converting React applications to standalone HTML. Create pixel-perfect, fully functional conversions with advanced state management, component systems, and butter-smooth interactions. Ensure every feature works identically to the original React app.',
    icon: '🌐',
    color: 'purple'
  }
];

export class AIAgentService {
  private activeAgents: Map<string, AIAgent> = new Map();
  private agentTasks: Map<string, AgentTask> = new Map();

  constructor() {
    // Initialize all agents
    AVAILABLE_AGENTS.forEach(agent => {
      this.activeAgents.set(agent.id, agent);
    });
  }

  // Get all available agents
  getAvailableAgents(): AIAgent[] {
    return AVAILABLE_AGENTS;
  }

  // Get agent by ID
  getAgent(agentId: string): AIAgent | undefined {
    return this.activeAgents.get(agentId);
  }

  // Create a new task for an agent
  createTask(agentId: string, type: AgentTask['type'], description: string): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: AgentTask = {
      id: taskId,
      agentId,
      type,
      description,
      status: 'pending',
      progress: 0
    };

    this.agentTasks.set(taskId, task);
    return taskId;
  }

  // Execute a task with a specific agent
  async executeTask(taskId: string, messages: Message[], files?: Files, attachments?: FileAttachment[]): Promise<ApiResponse | null> {
    const task = this.agentTasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const agent = this.activeAgents.get(task.agentId);
    if (!agent) {
      throw new Error(`Agent ${task.agentId} not found`);
    }

    // Update task status
    task.status = 'running';
    this.agentTasks.set(taskId, task);

    try {
      // Create agent-specific system instruction
      const agentSystemInstruction = this.buildAgentSystemInstruction(agent);

      // Modify the last message to include agent context
      const modifiedMessages = [...messages];
      const lastMessage = modifiedMessages[modifiedMessages.length - 1];

      if (lastMessage && lastMessage.role === 'user') {
        lastMessage.content = `[${agent.name}] ${lastMessage.content}\n\nAgent Capabilities: ${agent.capabilities.join(', ')}\nTask: ${task.description}`;
      }

      // Here you would call the actual AI service with the agent-specific instructions
      // For now, we'll simulate the response
      const response = await this.simulateAgentResponse(agent, modifiedMessages, files, attachments);

      // Update task as completed
      task.status = 'completed';
      task.progress = 100;
      task.result = response;
      this.agentTasks.set(taskId, task);

      return response;

    } catch (error) {
      // Update task as failed
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.agentTasks.set(taskId, task);

      throw error;
    }
  }

  // Build agent-specific system instruction
  private buildAgentSystemInstruction(agent: AIAgent): string {
    const baseInstruction = `You are ${agent.name}, ${agent.description}.

Core Capabilities: ${agent.capabilities.join(', ')}

Focus on: ${agent.systemPrompt}

Always respond with a valid JSON object in the exact format specified by the RESPONSE_SCHEMA.

When generating code, ensure it follows these principles:
1. Complex React architecture with multiple components
2. Proper state management and custom hooks
3. TypeScript interfaces and type safety
4. Error handling and validation
5. Responsive design and accessibility
6. Performance optimization

Response Format: Always return a single, valid JSON object with no additional text.`;

    return baseInstruction;
  }

  // Simulate agent response (replace with actual AI service call)
  private async simulateAgentResponse(
    agent: AIAgent,
    messages: Message[],
    files?: Files,
    attachments?: FileAttachment[]
  ): Promise<ApiResponse> {
    // Simulate different response times based on agent model
    const delay = agent.model === 'fast' ? 1000 : agent.model === 'quality' ? 2000 : 1500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate different response types based on agent
    switch (agent.id) {
      case 'frontend':
        return {
          responseType: 'MODIFY_CODE',
          modification: {
            projectName: 'Frontend Implementation',
            reason: `${agent.name} has generated the complete React frontend application with multiple components, state management, and modern UI.`,
            changes: [
              {
                filePath: 'src/App.tsx',
                action: 'create',
                content: `// Generated by ${agent.name}\nimport React from 'react';\n\n// Main App component with routing and state management\nconst App: React.FC = () => {\n  return (\n    <div className="app">\n      <h1>Frontend Application</h1>\n      {/* Add your components here */}\n    </div>\n  );\n};\n\nexport default App;`
              },
              {
                filePath: 'src/components/Header.tsx',
                action: 'create',
                content: `// Generated by ${agent.name}\nimport React from 'react';\n\n// Header component\nconst Header: React.FC = () => {\n  return (\n    <header className="header">\n      <h2>Header Component</h2>\n    </header>\n  );\n};\n\nexport default Header;`
              }
              // Add more components as needed
            ],
            standaloneHtml: '' // Frontend agent focuses only on React code
          }
        };

      case 'backend':
        return {
          responseType: 'MODIFY_CODE',
          modification: {
            projectName: 'Backend Implementation',
            reason: `${agent.name} has generated the complete backend API, services, and database schema.`,
            changes: [
              {
                filePath: 'api/users.ts',
                action: 'create',
                content: `// Generated by ${agent.name}\nimport express from 'express';\n\nconst router = express.Router();\n\n// User API endpoints\nrouter.get('/users', (req, res) => {\n  // Get all users logic\n  res.json({ users: [] });\n});\n\nrouter.post('/users', (req, res) => {\n  // Create user logic\n  res.json({ message: 'User created' });\n});\n\nexport default router;`
              },
              {
                filePath: 'services/userService.ts',
                action: 'create',
                content: `// Generated by ${agent.name}\n// User service logic\n\nexport const getUsers = async () => {\n  // Database query logic\n  return [];\n};\n\nexport const createUser = async (userData: any) => {\n  // Create user logic\n  return { id: 1, ...userData };\n};`
              }
              // Add more backend files as needed
            ],
            standaloneHtml: '' // Backend agent focuses only on server-side code
          }
        };

      case 'standalone':
        return {
          responseType: 'MODIFY_CODE',
          modification: {
            projectName: 'Standalone HTML Conversion',
            reason: `${agent.name} has created a high-quality standalone HTML conversion with full vanilla JavaScript functionality.`,
            changes: [], // No file changes, only standalone HTML
            standaloneHtml: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Standalone Application</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-gray-900 text-white">\n    <div id="app"></div>\n    <script>\n        // Generated by ${agent.name}\n        // Complete vanilla JavaScript implementation\n        let state = {};\n        \n        function render() {\n            document.getElementById('app').innerHTML = \`\n                <div class="container mx-auto p-4">\n                    <h1 class="text-3xl font-bold">Standalone Application</h1>\n                    <p>Full functionality implemented in vanilla JS</p>\n                    <!-- Add more UI elements here -->\n                </div>\n            \`;\n        }\n        \n        function init() {\n            render();\n            // Add event listeners and functionality\n        }\n        \n        init();\n    </script>\n</body>\n</html>`
          }
        };

      default:
        return {
          responseType: 'CHAT',
          message: `${agent.name} has completed the task. Here's what I accomplished...`
        };
    }
  }

  // Get task status
  getTaskStatus(taskId: string): AgentTask | undefined {
    return this.agentTasks.get(taskId);
  }

  // Get all tasks for an agent
  getAgentTasks(agentId: string): AgentTask[] {
    return Array.from(this.agentTasks.values()).filter(task => task.agentId === agentId);
  }

  // Cancel a task
  cancelTask(taskId: string): boolean {
    const task = this.agentTasks.get(taskId);
    if (task && task.status === 'running') {
      task.status = 'failed';
      task.error = 'Task cancelled by user';
      this.agentTasks.set(taskId, task);
      return true;
    }
    return false;
  }

  // Clean up completed tasks
  cleanupCompletedTasks(): void {
    const completedTasks = Array.from(this.agentTasks.values())
      .filter(task => task.status === 'completed' || task.status === 'failed');

    completedTasks.forEach(task => {
      this.agentTasks.delete(task.id);
    });
  }
}

// Singleton instance
export const aiAgentService = new AIAgentService();