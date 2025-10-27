import type { Message, Files, FileAttachment, ApiResponse } from '../types';
import { sendAiChatRequest } from './geminiService';

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

// Available AI Agents with multiple provider support
export const AVAILABLE_AGENTS: AIAgent[] = [
  {
    id: 'universal',
    name: 'Universal Agent',
    description: 'Fast agent for simple projects like basic portfolios or landing pages. Generates all code in one response.',
    capabilities: ['Quick Generation', 'Simple Projects', 'All-in-One', 'Fast Delivery'],
    model: 'fast',
    systemPrompt: 'You are a universal developer for simple projects. Generate complete React applications with backend and standalone HTML in one response. Focus on speed and simplicity for basic requests like portfolios or landing pages. Always respect the user\'s specific requests - if they only want backend, only generate backend code.',
    icon: '🚀',
    color: 'orange'
  },
  {
    id: 'frontend',
    name: 'Frontend Agent',
    description: 'Specialized in building complex React frontend applications with multiple components, state management, and modern UI',
    capabilities: ['React Components', 'State Management', 'UI/UX Design', 'Routing', 'Custom Hooks'],
    model: 'quality',
    systemPrompt: 'You are a senior React frontend developer. Focus on creating complex, multi-component React applications with proper state management, custom hooks, routing, and responsive design. Ensure all components are fully functional and follow best practices. Always respect the user\'s specific requests - if they only want frontend, only generate frontend code.',
    icon: '⚛️',
    color: 'blue'
  },
  {
    id: 'backend',
    name: 'Backend Agent',
    description: 'Expert in building robust backend APIs, services, database schemas, and server-side logic',
    capabilities: ['API Endpoints', 'Database Design', 'Authentication', 'Services', 'Server Logic'],
    model: 'quality',
    systemPrompt: 'You are a senior backend developer. Specialize in creating API endpoints, database schemas, authentication systems, services, and server-side logic. Ensure secure, scalable, and efficient backend code with proper error handling. Always respect the user\'s specific requests - if they only want backend, only generate backend code.',
    icon: '🔧',
    color: 'green'
  },
  {
    id: 'standalone',
    name: 'Standalone Agent',
    description: 'Master at creating high-quality standalone HTML with vanilla JavaScript from scratch',
    capabilities: ['HTML Creation', 'Vanilla JS', 'State Management', 'CSS Integration', 'Full Functionality'],
    model: 'quality',
    systemPrompt: 'You are a vanilla JavaScript expert specializing in creating standalone HTML applications from scratch. Generate complete, pixel-perfect, fully functional HTML pages with advanced state management, component systems, and butter-smooth interactions. Focus on creating the initial HTML structure and functionality. Always respect the user\'s specific requests - if they only want HTML, only generate HTML code.',
    icon: '🌐',
    color: 'purple'
  }
];

// AI Provider configurations
export interface AIProvider {
  id: string;
  name: string;
  model: string;
  apiKey: string;
  baseURL?: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    model: 'gemini-2.5-flash',
    apiKey: 'GEMINI_API_KEY_1'
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    model: 'claude-3-5-sonnet-20241022',
    apiKey: 'ANTHROPIC_API_KEY'
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4',
    model: 'gpt-4',
    apiKey: 'OPENAI_API_KEY'
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

      // Call the actual AI service with the agent-specific instructions
      const response = await sendAiChatRequest(modifiedMessages, files, attachments);

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

IMPORTANT: Always respect the user's specific requests. If they mention specific parts (e.g., "only backend", "just HTML", "frontend only"), generate ONLY that part. Do not generate other parts unless explicitly requested.

Generation Order (when generating multiple parts):
1. Standalone HTML first (complete, functional HTML page)
2. Frontend React components second (build upon HTML structure)
3. Backend API last (support the frontend functionality)

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