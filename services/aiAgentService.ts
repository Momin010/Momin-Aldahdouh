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
    id: 'creator',
    name: 'Creator Agent',
    description: 'Specialized in building new features and applications from scratch',
    capabilities: ['React Components', 'Full Applications', 'UI/UX Design', 'Feature Implementation'],
    model: 'quality',
    systemPrompt: 'You are a senior React developer specializing in creating beautiful, functional user interfaces. Focus on component architecture, state management, and user experience.',
    icon: '🚀',
    color: 'purple'
  },
  {
    id: 'debugger',
    name: 'Debugger Agent',
    description: 'Expert at finding and fixing bugs, errors, and performance issues',
    capabilities: ['Error Detection', 'Bug Fixes', 'Performance Optimization', 'Code Review'],
    model: 'fast',
    systemPrompt: 'You are a senior debugging specialist. Analyze code for errors, performance issues, and potential bugs. Provide clear, actionable fixes.',
    icon: '🔧',
    color: 'red'
  },
  {
    id: 'optimizer',
    name: 'Optimizer Agent',
    description: 'Focuses on improving code quality, performance, and maintainability',
    capabilities: ['Code Refactoring', 'Performance Tuning', 'Best Practices', 'Code Quality'],
    model: 'quality',
    systemPrompt: 'You are a code optimization expert. Focus on improving performance, maintainability, and following best practices. Suggest architectural improvements.',
    icon: '⚡',
    color: 'green'
  },
  {
    id: 'analyst',
    name: 'Analyst Agent',
    description: 'Analyzes codebases and provides insights and recommendations',
    capabilities: ['Code Analysis', 'Architecture Review', 'Security Audit', 'Documentation'],
    model: 'quality',
    systemPrompt: 'You are a senior software architect. Analyze codebases for architecture, security, and maintainability. Provide detailed insights and recommendations.',
    icon: '📊',
    color: 'blue'
  },
  {
    id: 'tester',
    name: 'Tester Agent',
    description: 'Creates comprehensive tests and validates functionality',
    capabilities: ['Unit Tests', 'Integration Tests', 'Test Coverage', 'Quality Assurance'],
    model: 'fast',
    systemPrompt: 'You are a QA automation expert. Create comprehensive tests that cover edge cases and ensure code reliability. Focus on test coverage and quality.',
    icon: '🧪',
    color: 'orange'
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
      case 'creator':
        return {
          responseType: 'MODIFY_CODE',
          modification: {
            projectName: 'New Feature Implementation',
            reason: `${agent.name} has created new components and features based on your requirements.`,
            changes: [
              {
                filePath: 'src/components/NewComponent.tsx',
                action: 'create',
                content: `// Generated by ${agent.name}\nimport React from 'react';\n\ninterface NewComponentProps {\n  // Props interface\n}\n\nconst NewComponent: React.FC<NewComponentProps> = () => {\n  return (\n    <div className="new-component">\n      <h1>New Component Created</h1>\n    </div>\n  );\n};\n\nexport default NewComponent;`
              }
            ],
            standaloneHtml: `<html><head><title>Preview</title></head><body><div id="app"><h1>Generated by ${agent.name}</h1></div></body></html>`
          }
        };

      case 'debugger':
        return {
          responseType: 'CHAT',
          message: `${agent.name} has analyzed your code and found several issues that need to be addressed. Here's my analysis and recommended fixes...`
        };

      case 'optimizer':
        return {
          responseType: 'MODIFY_CODE',
          modification: {
            projectName: 'Optimized Implementation',
            reason: `${agent.name} has optimized your code for better performance and maintainability.`,
            changes: [
              {
                filePath: 'src/components/OptimizedComponent.tsx',
                action: 'update',
                content: `// Optimized by ${agent.name}\nimport React, { useMemo, useCallback } from 'react';\n\n// Performance optimizations applied\nconst OptimizedComponent = () => {\n  const optimizedValue = useMemo(() => {\n    return expensiveComputation();\n  }, []);\n  \n  const handleClick = useCallback(() => {\n    // Optimized event handler\n  }, []);\n  \n  return <div>Optimized Component</div>;\n};`
              }
            ],
            standaloneHtml: `<html><head><title>Optimized Preview</title></head><body><div>Optimized by ${agent.name}</div></body></html>`
          }
        };

      default:
        return {
          responseType: 'CHAT',
          message: `${agent.name} has completed the analysis. Here's what I found...`
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