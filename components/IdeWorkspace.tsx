import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChatPanel from './ChatPanel';
import ConsolidatedHeader from './ConsolidatedHeader';
import EditorPreviewPanel from './EditorPreviewPanel';
import PublishModal from './PublishModal';
import CommandPalette from './CommandPalette';
import SettingsModal from './SettingsModal';
import LivePreview, { Device } from './LivePreview';
import ResizablePanel from './ResizablePanel';
import Sidebar from './Sidebar';
import { Icon } from './Icon';
import MessageContextMenu from './MessageContextMenu';
import VisualEditor from './VisualEditor';
import TemplateLibrary from './TemplateLibrary';
import StylePresets from './StylePresets';
import { aiAgentService, AVAILABLE_AGENTS, AIAgent } from '../services/aiAgentService';
import { deploymentService, DEPLOYMENT_PLATFORMS } from '../services/deploymentService';
import { databaseService } from '../services/databaseService';
import { ThemeProvider } from '../lib/themeContext';
import { CreditService } from '../lib/creditService';
import type { Message, Files, Change, FileAttachment, History, AppState, ConsoleMessage, Plan, Workspace, Project, User, Modification, ApiResponse, PreviewChange } from '../types';
import { sendAiChatRequest, resetChat } from '../services/geminiService';
import { downloadProjectAsZip } from '../services/zipService';
import * as projectService from '../services/projectService';
import { validateJavaScriptCode, validateHtmlContent, validatePreviewHtml, validationErrorsToConsoleMessages } from '../lib/codeValidation';
import { v4 as uuidv4 } from 'uuid';

type MobileView = 'chat' | 'preview';

interface IdeWorkspaceProps {
    user: User | null;
    workspace: Workspace;
    onWorkspaceChange: (updater: React.SetStateAction<Workspace | null>) => void;
    onSignOut: () => void;
    onSignUpClick: () => void;
    initialPrompt: string | null;
    clearInitialPrompt: () => void;
    initialAttachment: FileAttachment | null;
    clearInitialAttachment: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  messageIndex: number;
  message: Message | null;
}

interface ProjectRunState {
  aiStatus: string | null;
  isVerifying: boolean;
  abortController: AbortController | null;
  isCancelling: boolean;
  stopwatchSeconds: number;
  isStopwatchRunning: boolean;
  streamingProgress: {
    receivedBytes: number;
    totalBytes?: number;
    progress: number;
  } | null;
  retryAttempt: number;
}

const IdeWorkspace: React.FC<IdeWorkspaceProps> = ({ user, workspace, onWorkspaceChange, onSignOut, onSignUpClick, initialPrompt, clearInitialPrompt, initialAttachment, clearInitialAttachment }) => {
  const isGuest = !user;
  const storageKey = isGuest ? 'mominai_guest_activeFile' : `mominai_activeFile_${user?.email}`;
  const [activeFile, setActiveFile] = useState<string>(() => localStorage.getItem(storageKey) || '');
  
  const [projectRunStates, setProjectRunStates] = useState<Record<string, ProjectRunState>>({});
  
  const [mobileView, setMobileView] = useState<MobileView>('chat');
  const [view, setView] = useState<'code' | 'preview' | 'database' | 'visual-editor'>('preview');
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMessage[]>([]);
  const [device, setDevice] = useState<Device>('desktop');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, messageIndex: -1, message: null });
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

  // New feature modals
  const [isVisualEditorOpen, setIsVisualEditorOpen] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [isStylePresetsOpen, setIsStylePresetsOpen] = useState(false);
  const [isAIAgentsOpen, setIsAIAgentsOpen] = useState(false);
  const [isDeploymentOpen, setIsDeploymentOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [isVisualEditMode, setIsVisualEditMode] = useState(false);

  // Progress and retry tracking moved to projectRunStates for isolation

  const activeProject = workspace.projects.find(p => p.id === workspace.activeProjectId);
  const activeProjectRunState = activeProject ? projectRunStates[activeProject.id] : undefined;
  
  // Stopwatch timer effect
  useEffect(() => {
    let intervalId: number | undefined;
    if (activeProject && activeProjectRunState?.isStopwatchRunning) {
      intervalId = window.setInterval(() => {
        setProjectRunStates(prev => {
          const currentProjectState = prev[activeProject.id];
          if (!currentProjectState) return prev;
          return {
            ...prev,
            [activeProject.id]: {
              ...currentProjectState,
              stopwatchSeconds: currentProjectState.stopwatchSeconds + 1,
              isCancelling: currentProjectState.isCancelling
            }
          };
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [activeProject, activeProjectRunState?.isStopwatchRunning]);


  useEffect(() => {
    setProjectRunStates(prevStates => {
        const newStates: Record<string, ProjectRunState> = {};
        for (const project of workspace.projects) {
            newStates[project.id] = prevStates[project.id] || {
                aiStatus: null,
                isVerifying: false,
                abortController: null,
                isCancelling: false,
                stopwatchSeconds: 0,
                isStopwatchRunning: false,
                streamingProgress: null,
                retryAttempt: 0,
            };
        }
        return newStates;
    });
  }, [workspace.projects]);

  useEffect(() => {
    if (!workspace.activeProjectId && workspace.projects.length > 0) {
        onWorkspaceChange(ws => ws ? ({ ...ws, activeProjectId: ws.projects[0].id }) : null);
    }
  }, [workspace.activeProjectId, workspace.projects, onWorkspaceChange]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setDevice('mobile');
    }
  }, []);

  const currentState = activeProject?.history.versions[activeProject.history.currentIndex];
  
  const { files, previewHtml, standaloneHtml, chatMessages, hasGeneratedCode, projectName, projectPlan } = currentState || {
    files: {}, previewHtml: '', standaloneHtml: '', chatMessages: [], hasGeneratedCode: false, projectName: 'Loading...', projectPlan: null
  };
  
  const isProjectLoaded = !!activeProject;
  const canUndo = activeProject ? activeProject.history.currentIndex > 0 : false;
  const canRedo = activeProject ? activeProject.history.currentIndex < activeProject.history.versions.length - 1 : false;

  useEffect(() => {
    resetChat();
  }, [workspace.activeProjectId]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isPreviewFullscreen) {
        setIsPreviewFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewFullscreen]);

  useEffect(() => {
    localStorage.setItem(storageKey, activeFile);
    if (!currentState) return;
    if (activeFile && !currentState.files.hasOwnProperty(activeFile)) {
      setActiveFile(Object.keys(currentState.files)[0] || '');
    } else if (!activeFile && Object.keys(currentState.files).length > 0) {
      const preferredFiles = ['src/App.tsx', 'src/pages/Home.tsx', 'index.html', 'package.json'];
      const defaultFile = preferredFiles.find(f => f in currentState.files) || Object.keys(currentState.files)[0];
      setActiveFile(defaultFile);
    }
  }, [files, activeFile, currentState, storageKey]);

  const updateProjectById = useCallback((projectId: string, updater: (project: Project) => Project) => {
    onWorkspaceChange(prevWorkspace => {
        if (!prevWorkspace) return null;
        const newProjects = prevWorkspace.projects.map(p => {
            if (p.id === projectId) {
                return updater(p);
            }
            return p;
        });
        return { ...prevWorkspace, projects: newProjects };
    });
  }, [onWorkspaceChange]);
  
  const addHistoryStateForProject = useCallback((projectId: string, updater: (prevState: AppState) => AppState) => {
    updateProjectById(projectId, project => {
        const currentVersion = project.history.versions[project.history.currentIndex];
        const newVersion = updater(currentVersion);
        
        const newVersions = project.history.versions.slice(0, project.history.currentIndex + 1);
        newVersions.push(newVersion);

        if (newVersions.length > 20) newVersions.splice(0, newVersions.length - 20);

        const newHistory: History = {
            versions: newVersions,
            currentIndex: newVersions.length - 1,
        };
        return { ...project, history: newHistory, projectName: newVersion.projectName };
    });
  }, [updateProjectById]);
  
  const handleStreamingComplete = useCallback((projectId: string, messageIndex: number) => {
      updateProjectById(projectId, project => {
        const newHistory = { ...project.history };
        const newVersions = [...newHistory.versions];
        const currentVersion = { ...newVersions[project.history.currentIndex] };
        const newMessages = [...currentVersion.chatMessages];
        
        if (newMessages[messageIndex] && newMessages[messageIndex].streaming) {
          const updatedMessage = { ...newMessages[messageIndex] };
          delete updatedMessage.streaming;
          newMessages[messageIndex] = updatedMessage;
        }

        currentVersion.chatMessages = newMessages;
        newVersions[project.history.currentIndex] = currentVersion;
        newHistory.versions = newVersions;
        return { ...project, history: newHistory };
      });
  }, [updateProjectById]);

  const applyModification = useCallback((projectId: string, modification: Modification) => {
    addHistoryStateForProject(projectId, prev => {
        const updatedFiles = { ...prev.files };
        modification.changes.forEach((change: Change) => {
            if (change.action === 'delete') {
                delete updatedFiles[change.filePath];
            } else {
                updatedFiles[change.filePath] = change.content || '';
            }
        });
        
        let newMessages = [...prev.chatMessages];
        if (modification.reason) {
            newMessages.push({ role: 'model' as const, content: modification.reason });
        }
        
        newMessages.push({ role: 'system', content: 'Go to Preview', action: 'GOTO_PREVIEW' });

        return {
            ...prev,
            files: updatedFiles,
            previewHtml: modification.previewHtml || prev.previewHtml,
            standaloneHtml: modification.standaloneHtml || prev.standaloneHtml,
            chatMessages: newMessages,
            hasGeneratedCode: true,
            projectName: modification.projectName || prev.projectName,
            projectPlan: null,
        };
    });
    setConsoleLogs([]);
  }, [addHistoryStateForProject]);

  const makeAiRequest = useCallback(async (
    projectId: string,
    messagesForAI: Message[],
    filesForContext: Files | null,
    attachments: FileAttachment[] | null = null,
    prototypeContext: string | null = null
  ): Promise<ApiResponse | null> => {
    const controller = new AbortController();
    setProjectRunStates(prev => ({
        ...prev,
        [projectId]: { ...prev[projectId], abortController: controller }
    }));

    // Reset progress and retry counter at start for this project
    setProjectRunStates(prev => ({
        ...prev,
        [projectId]: {
            ...prev[projectId],
            streamingProgress: { receivedBytes: 0, progress: 0 },
            retryAttempt: 0
        }
    }));

    // Add prototype context to the last message if available
    if (prototypeContext) {
        const lastMessage = messagesForAI[messagesForAI.length - 1];
        lastMessage.content += `\n\n### Approved Prototype HTML Context:\n\`\`\`html\n${prototypeContext}\n\`\`\``;
    }

    const progressCallback = (receivedBytes: number, totalBytes?: number, isRetry: boolean = false) => {
      setProjectRunStates(prev => {
        const currentState = prev[projectId] || {
          aiStatus: null,
          isVerifying: false,
          abortController: null,
          isCancelling: false,
          stopwatchSeconds: 0,
          isStopwatchRunning: false,
          streamingProgress: null,
          retryAttempt: 0
        };

        if (isRetry) {
          return {
            ...prev,
            [projectId]: {
              ...currentState,
              retryAttempt: currentState.retryAttempt + 1,
              streamingProgress: { receivedBytes: 0, progress: 0 }, // Reset progress on retry
              isCancelling: false
            }
          };
        }

        const progress = totalBytes ? (receivedBytes / totalBytes) * 100 : Math.min((receivedBytes / 67000) * 100, 95); // Estimate progress if no total
        return {
          ...prev,
          [projectId]: {
            ...currentState,
            streamingProgress: { receivedBytes, totalBytes, progress }
          }
        };
      });
    };

    try {
        const result = await sendAiChatRequest(messagesForAI, filesForContext, attachments, controller.signal, progressCallback);
        // Set to 100% when complete and reset retry counter for this project
        setProjectRunStates(prev => ({
            ...prev,
            [projectId]: {
                ...prev[projectId],
                streamingProgress: { receivedBytes: result ? 100000 : 0, progress: 100 },
                retryAttempt: 0
            }
        }));
        return result;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            console.log('AI request was cancelled by user');
            addHistoryStateForProject(projectId, prev => ({...prev, chatMessages: [...prev.chatMessages, { role: 'model', content: 'AI generation cancelled.' }]}));
        } else {
            const errorMessageContent = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            addHistoryStateForProject(projectId, prev => ({ ...prev, chatMessages: [...prev.chatMessages, { role: 'model', content: errorMessageContent }], projectPlan: null }));
        }
        setProjectRunStates(prev => ({
            ...prev,
            [projectId]: {
                ...prev[projectId],
                aiStatus: null,
                isVerifying: false,
                abortController: null,
                isCancelling: false,
                isStopwatchRunning: false,
                streamingProgress: null
            }
        }));
        return null;
    } finally {
        // Clear abort controller after request completes
        setProjectRunStates(prev => ({...prev, [projectId]: { ...prev[projectId], abortController: null } }));
    }
  }, [addHistoryStateForProject]);

  const triggerAiResponse = useCallback(async (projectId: string, messagesForAI: Message[], attachments: FileAttachment[] | null = null) => {
    const projectForRequest = workspace.projects.find(p => p.id === projectId);
    if (!projectForRequest) return;
    
    const currentProjectState = projectForRequest.history.versions[projectForRequest.history.currentIndex];
    const { files: projectFiles, hasGeneratedCode: projectHasCode } = currentProjectState;

    const lastModelMessage = currentProjectState.chatMessages.slice().reverse().find(m => m.role === 'model' || m.role === 'system');
    const isPlanApproval = lastModelMessage?.action === 'AWAITING_PLAN_APPROVAL';
    
    let status = 'MominAI is working...';
    let filesForContext: Files | null = null;

    if (isPlanApproval) {
        status = "Generating application...";
    } else if (projectHasCode) {
        status = "Applying changes...";
        filesForContext = projectFiles;
    }

    setProjectRunStates(prev => ({
        ...prev,
        [projectId]: {
            ...prev[projectId],
            aiStatus: status,
            isVerifying: false,
            abortController: null,
            isCancelling: false,
            isStopwatchRunning: true,
            stopwatchSeconds: 0
        }
    }));

    const response = await makeAiRequest(projectId, messagesForAI, filesForContext, attachments, null);
    if (!response) return;

    setProjectRunStates(prev => ({ ...prev, [projectId]: {...prev[projectId], aiStatus: null, isCancelling: false } }));

    switch (response.responseType) {
        case 'CHAT':
            addHistoryStateForProject(projectId, prev => ({...prev, chatMessages: [...prev.chatMessages, { role: 'model', content: response.message, streaming: true }]}));
            break;
        case 'PROJECT_PLAN':
            const { plan } = response;
            const planMessage: Message = { role: 'model', content: `I've drafted a plan for **${plan.projectName}**. Please review it.`, plan: plan, action: 'AWAITING_PLAN_APPROVAL' };
            addHistoryStateForProject(projectId, prev => ({ ...prev, projectPlan: plan, chatMessages: [...prev.chatMessages, planMessage] }));
            setProjectRunStates(prev => ({ ...prev, [projectId]: {...prev[projectId], aiStatus: "Awaiting your approval...", isStopwatchRunning: false, isCancelling: false }}));
            break;
        case 'MODIFY_CODE':
            applyModification(projectId, response.modification);
            // Immediately validate the preview HTML after code generation
            setTimeout(() => {
              const project = workspace.projects.find(p => p.id === projectId);
              if (project) {
                const currentState = project.history.versions[project.history.currentIndex];
                const previewHtml = currentState.standaloneHtml || currentState.previewHtml || '';
                if (previewHtml.trim()) {
                  const validationErrors = validatePreviewHtml(previewHtml);
                  if (validationErrors.length > 0) {
                    const consoleMessages = validationErrorsToConsoleMessages(validationErrors);
                    setConsoleLogs(consoleMessages);
                    // Trigger self-correction for validation errors
                    triggerSelfCorrection(projectId, consoleMessages);
                  } else {
                    // No validation errors, mark as verified
                    setProjectRunStates(prev => ({ ...prev, [projectId]: {...prev[projectId], isVerifying: false, aiStatus: null, isStopwatchRunning: false, isCancelling: false} }));
                  }
                }
              }
            }, 100); // Small delay to ensure DOM is updated
            break;
    }
  }, [workspace.projects, addHistoryStateForProject, makeAiRequest, applyModification]);
  
  const handleSendMessage = useCallback(async (message: string, attachments?: FileAttachment[]) => {
    if (!activeProject || !currentState) return;
    const projectId = activeProject.id;

    // Check credits before sending message
    if (user) {
      const hasCredits = CreditService.useCredit(user.email);
      if (!hasCredits) {
        alert('You have reached your daily limit of 10 messages. Please try again tomorrow.');
        return;
      }
    }

    const userMessage: Message = {
      role: 'user',
      content: message,
      attachments: attachments
    };
    addHistoryStateForProject(projectId, prev => ({ ...prev, chatMessages: [...prev.chatMessages, userMessage] }));

    const messagesForAI = [...currentState.chatMessages, userMessage];
    triggerAiResponse(projectId, messagesForAI, attachments || null);

  }, [activeProject, currentState, addHistoryStateForProject, triggerAiResponse, user]);

  const handleNewProject = useCallback(async (name: string = 'New Project', andThenSend?: {prompt: string, attachment: FileAttachment | null}) => {
      try {
        if (user) {
          // For authenticated users, create project on server first
          const serverProject = await projectService.createProject(name);
          onWorkspaceChange(ws => ws ? ({ projects: [...ws.projects, serverProject], activeProjectId: serverProject.id }) : null);
          
          if (andThenSend) {
            setTimeout(() => handleSendMessage(andThenSend.prompt, andThenSend.attachment ? [andThenSend.attachment] : undefined), 0);
          }
        } else {
          // For guest users, create project locally
          const newProject: Project = {
            id: uuidv4(),
            projectName: name,
            history: {
              versions: [{
                files: {}, previewHtml: '', standaloneHtml: '', chatMessages: [ { role: 'model', content: "Hello! I'm MominAI. How can I help you build something amazing today?" } ],
                hasGeneratedCode: false, projectName: name, projectPlan: null,
              }],
              currentIndex: 0
            }
          };
          
          onWorkspaceChange(ws => ws ? ({ projects: [...ws.projects, newProject], activeProjectId: newProject.id }) : null);

          if (andThenSend) {
              setTimeout(() => handleSendMessage(andThenSend.prompt, andThenSend.attachment ? [andThenSend.attachment] : undefined), 0);
          }
        }
      } catch (error) {
        console.error('Failed to create new project:', error);
        alert('Failed to create new project. Please try again.');
      }
  }, [handleSendMessage, onWorkspaceChange, user]);

  useEffect(() => {
      if ((initialPrompt || initialAttachment) && currentState) {
          const prompt = initialPrompt || '';
          const attachment = initialAttachment;
          clearInitialPrompt();
          clearInitialAttachment();
          const isFreshProject = !hasGeneratedCode && chatMessages.length <= 1 && (projectName === 'Untitled Project' || projectName === 'New Project');
          if (isFreshProject) {
              if (prompt) addHistoryStateForProject(activeProject!.id, prev => ({...prev, projectName: prompt.substring(0, 30)}));
              handleSendMessage(prompt, attachment ? [attachment] : undefined);
          } else {
              handleNewProject(prompt.substring(0, 30) || 'New Visual Project', { prompt, attachment });
          }
      }
  }, [initialPrompt, initialAttachment, clearInitialPrompt, clearInitialAttachment, currentState, hasGeneratedCode, chatMessages.length, projectName, handleSendMessage, addHistoryStateForProject, handleNewProject, activeProject]);

  const triggerSelfCorrection = useCallback(async (projectId: string, errors: ConsoleMessage[]) => {
    const projectForRequest = workspace.projects.find(p => p.id === projectId);
    if (!projectForRequest) return;

    setProjectRunStates(prev => ({...prev, [projectId]: {...prev[projectId], aiStatus: 'Errors detected. Attempting to fix...', isCancelling: false}}));

    const currentProjectState = projectForRequest.history.versions[projectForRequest.history.currentIndex];

    // Find the user's last request to understand what they wanted to add/modify
    const userMessages = currentProjectState.chatMessages.filter(msg => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    // Format errors in a more helpful way for the AI
    const formattedErrors = errors.map((error, index) => {
      const errorText = Array.isArray(error.payload) ? error.payload.join(' ') : String(error.payload);
      return `${index + 1}. ${error.level.toUpperCase()}: ${errorText}`;
    }).join('\n');

    const errorContent = `I found errors in the code I just generated. The user asked me to: "${lastUserMessage?.content || 'modify the application'}"

IMPORTANT: You MUST preserve all existing functionality and only fix the specific errors listed below. Do NOT remove or change working features that the user requested.

The errors to fix are:
${formattedErrors}

CRITICAL INSTRUCTIONS:
1. Keep all existing features and functionality that were working before
2. Only fix the specific errors mentioned above
3. Do not remove entire components or features - just correct the bugs
4. Maintain the user's original request: "${lastUserMessage?.content || 'modify the application'}"
5. If you need to restructure code, ensure all user-requested functionality remains intact

Focus on fixing:
- Syntax errors (missing brackets, semicolons, etc.)
- Undefined variables or functions
- Type mismatches (especially with Date objects)
- HTML structure issues

DO NOT remove working code or features the user asked for.`;

    const correctionMessage: Message = { role: 'correction', content: errorContent };

    // Include the full conversation history so the AI understands what was requested
    const messagesForCorrection = [...currentProjectState.chatMessages, correctionMessage];
    const filesForContext = currentProjectState.hasGeneratedCode ? currentProjectState.files : null;
    const prototypeForContext = null;

    const response = await makeAiRequest(projectId, messagesForCorrection, filesForContext, null, prototypeForContext);
    if (!response) return;

    if (response.responseType === 'MODIFY_CODE') {
        applyModification(projectId, response.modification);
    } else {
        addHistoryStateForProject(projectId, prev => ({...prev, chatMessages: [...prev.chatMessages, { role: 'model', content: response.message }] }));
    }
    setProjectRunStates(prev => ({...prev, [projectId]: {...prev[projectId], aiStatus: null, isStopwatchRunning: false, isCancelling: false}}));
  }, [addHistoryStateForProject, workspace.projects, makeAiRequest, applyModification]);

  // Instant error detection with fallback timeout
  useEffect(() => {
    const projectToVerifyId = Object.keys(projectRunStates).find(id => projectRunStates[id].isVerifying);
    if (!projectToVerifyId) return;

    const errors = consoleLogs.filter(log => log.level === 'error');
    
    if (errors.length > 0) {
      // Errors detected - fix immediately
      setProjectRunStates(prev => ({...prev, [projectToVerifyId]: {...prev[projectToVerifyId], isVerifying: false, isCancelling: false}}));
      triggerSelfCorrection(projectToVerifyId, errors);
    } else if (consoleLogs.length > 0) {
      // No errors but console logs exist - code is working
      setProjectRunStates(prev => ({...prev, [projectToVerifyId]: {...prev[projectToVerifyId], isVerifying: false, aiStatus: null, isStopwatchRunning: false, isCancelling: false}}));
    } else {
      // Fallback: if no logs after 2 seconds, assume code is working
      const fallbackTimeout = setTimeout(() => {
        setProjectRunStates(prev => ({...prev, [projectToVerifyId]: {...prev[projectToVerifyId], isVerifying: false, aiStatus: null, isStopwatchRunning: false, isCancelling: false}}));
      }, 2000);
      return () => clearTimeout(fallbackTimeout);
    }
  }, [projectRunStates, consoleLogs, triggerSelfCorrection]);

  const handleResubmitMessage = useCallback(async (messageIndex: number, newContent: string) => {
    if (!activeProject || !currentState) return;
    const projectId = activeProject.id;
    const newMessages = currentState.chatMessages.slice(0, messageIndex);
    newMessages.push({ role: 'user', content: newContent });
    addHistoryStateForProject(projectId, prev => ({ ...prev, chatMessages: newMessages }));
    triggerAiResponse(projectId, newMessages);
  }, [activeProject, currentState, addHistoryStateForProject, triggerAiResponse]);

  const handleDeleteMessage = useCallback((messageIndex: number) => {
    if (!activeProject) return;
    addHistoryStateForProject(activeProject.id, prev => {
      const newMessages = [...prev.chatMessages];
      if (newMessages[messageIndex].role === 'user' && newMessages[messageIndex + 1]?.role === 'model') newMessages.splice(messageIndex, 2);
      else newMessages.splice(messageIndex, 1);
      return { ...prev, chatMessages: newMessages };
    });
  }, [activeProject, addHistoryStateForProject]);

  const handleCancelRequest = useCallback(() => {
    if (activeProjectRunState?.abortController && !activeProjectRunState.isCancelling) {
      console.log('Cancelling AI request for project:', activeProject?.id);
      activeProjectRunState.abortController.abort();

      // Update state to show cancelling
      setProjectRunStates(prev => ({
        ...prev,
        [activeProject!.id]: {
          ...prev[activeProject!.id],
          aiStatus: 'Cancelling...',
          isCancelling: true,
          isStopwatchRunning: false
        }
      }));
    }
  }, [activeProjectRunState, activeProject]);

  const handleOpenContextMenu = useCallback((event: React.MouseEvent, index: number) => {
    event.preventDefault();
    if (!chatMessages[index]) return;
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, messageIndex: index, message: chatMessages[index] });
  }, [chatMessages]);

  const handleCloseContextMenu = useCallback(() => setContextMenu(prev => ({ ...prev, visible: false })), []);
  const handleEditMessage = useCallback(() => {
    if (contextMenu.messageIndex !== -1) setEditingMessageIndex(contextMenu.messageIndex);
    handleCloseContextMenu();
  }, [contextMenu.messageIndex, handleCloseContextMenu]);

  const handleCodeChange = useCallback((newContent: string) => {
    if (!activeProject) return;
    updateProjectById(activeProject.id, project => {
        const newHistory = { ...project.history };
        const newVersions = [...newHistory.versions];
        const currentVersion = { ...newVersions[project.history.currentIndex] };
        currentVersion.files = { ...currentVersion.files, [activeFile]: newContent };
        newVersions[project.history.currentIndex] = currentVersion;
        newHistory.versions = newVersions;
        return { ...project, history: newHistory };
    });
  }, [activeFile, activeProject, updateProjectById]);

  const handleRenameProject = useCallback((newName: string) => {
    if (!activeProject) return;
    addHistoryStateForProject(activeProject.id, prev => ({...prev, projectName: newName }));
  }, [activeProject, addHistoryStateForProject]);

  const handleDownloadProject = async () => {
    if (Object.keys(files).length > 0) await downloadProjectAsZip(files, projectName);
  };

  const handleUndo = useCallback(() => {
    if (canUndo) updateProjectById(activeProject!.id, p => ({ ...p, history: { ...p.history, currentIndex: p.history.currentIndex - 1 }}));
  }, [canUndo, activeProject, updateProjectById]);

  const handleRedo = useCallback(() => {
    if (canRedo) updateProjectById(activeProject!.id, p => ({ ...p, history: { ...p.history, currentIndex: p.history.currentIndex + 1 }}));
  }, [canRedo, activeProject, updateProjectById]);

  const handleToggleFullscreen = useCallback(() => setIsPreviewFullscreen(prev => !prev), []);
  const handleNavigateToPreview = useCallback(() => setMobileView('preview'), []);
  const handleNewLog = useCallback((log: ConsoleMessage) => setConsoleLogs(prev => [...prev, log]), []);

  const handleCheckErrors = useCallback(() => {
    if (!activeProject || !currentState) return;
    const projectId = activeProject.id;

    // Clear existing logs to start fresh
    setConsoleLogs([]);

    // Set verifying state to trigger error checking
    setProjectRunStates(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        isVerifying: true,
        aiStatus: "Checking for errors...",
        isStopwatchRunning: false,
        isCancelling: false
      }
    }));

    // Run static code validation on the PREVIEW HTML that users actually see
    const validationErrors: ConsoleMessage[] = [];

    // Validate the preview HTML content (this is what gets executed in the iframe)
    const previewHtml = currentState.standaloneHtml || currentState.previewHtml || '';
    if (previewHtml.trim()) {
      const previewErrors = validatePreviewHtml(previewHtml);
      validationErrors.push(...validationErrorsToConsoleMessages(previewErrors));
    } else {
      // No preview HTML yet
      validationErrors.push({
        level: 'warn',
        payload: ['No preview HTML available to validate. Generate some code first.']
      });
    }

    // Add validation errors to console logs
    if (validationErrors.length > 0) {
      setConsoleLogs(validationErrors);
    }

    // The useEffect will handle triggering self-correction if errors are found
  }, [activeProject, currentState]);
  
  const handleSelectProject = useCallback((id: string) => {
    onWorkspaceChange(ws => ws ? ({ ...ws, activeProjectId: id }) : null);
    setMobileSidebarOpen(false);
  }, [onWorkspaceChange]);

  const handleDeleteProject = useCallback(async (id: string) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    onWorkspaceChange(ws => {
      if (!ws) return null;
      const newProjects = ws.projects.filter(p => p.id !== id);
      const newActiveId = ws.activeProjectId === id ? (newProjects[0]?.id || null) : ws.activeProjectId;
      if (user) {
        projectService.deleteProject(id).catch(error => {
          console.error("Failed to delete project on server:", error);
          alert("Failed to delete project on the server. Your local view has been updated, but you may need to refresh to sync with the server.");
        });
      }
      return { projects: newProjects, activeProjectId: newActiveId };
    });
  }, [onWorkspaceChange, user]);
  
  const handleCreateNewProject = () => {
      handleNewProject();
  };

  // New feature handlers
  const handleTemplateSelect = (template: any) => {
    setIsTemplateLibraryOpen(false);
    // Apply template logic here
    handleSendMessage(template.prompt);
  };

  const handleStylePresetApply = (preset: any) => {
    // Apply style preset to current project
    console.log('Applied style preset:', preset);
  };

  const handleAIAgentTask = async (agent: AIAgent, taskType: string) => {
    if (!activeProject) return;

    const taskId = aiAgentService.createTask(agent.id, taskType as any, `Using ${agent.name} for ${taskType}`);
    setIsAIAgentsOpen(false);

    try {
      await aiAgentService.executeTask(taskId, [
        ...currentState.chatMessages,
        { role: 'user', content: `Use ${agent.name} to ${taskType} this project` }
      ], currentState.files);
    } catch (error) {
      console.error('Agent task failed:', error);
    }
  };

  const handleDeployProject = async (platform: string) => {
    if (!activeProject) return;

    try {
      await deploymentService.deployProject(
        currentState.files,
        {
          platform,
          projectName: projectName,
          buildSettings: {
            buildCommand: 'npm run build',
            outputDir: 'dist'
          }
        },
        (progress, message) => {
          console.log(`${progress}%: ${message}`);
        }
      );
      setIsDeploymentOpen(false);
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  };

  const handleDatabaseAction = (action: string) => {
    if (!activeProject) return;

    switch (action) {
      case 'create':
        databaseService.createDatabase(`${projectName} Database`);
        break;
      case 'schema':
        const schema = databaseService.generateSQLSchema();
        console.log('Generated schema:', schema);
        break;
      case 'export':
        const exportData = databaseService.exportDatabase();
        console.log('Exported database:', exportData);
        break;
    }
  };

  if (isPreviewFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        <LivePreview device={device} htmlContent={standaloneHtml || previewHtml || ''} isFullscreen onExitFullscreen={handleToggleFullscreen} logs={consoleLogs} onNewLog={handleNewLog} onClearLogs={() => setConsoleLogs([])} />
      </div>
    );
  }
  
  const sidebarProps = {
    projects: workspace.projects,
    activeProjectId: workspace.activeProjectId,
    onSelectProject: handleSelectProject,
    onNewProject: handleCreateNewProject,
    onDeleteProject: handleDeleteProject,
    user: user || { email: 'Guest' },
    onSignOut: onSignOut,
    isMobile: false,
    onClose: () => {}
  };

  const renderWorkspaceContent = () => {
    if (!activeProject || !currentState) {
      return (
        <main className="flex-grow flex items-center justify-center bg-transparent text-white">
          <div>No project selected. Create one to get started!</div>
        </main>
      );
    }

    const onStreamingCompleteForActive = (messageIndex: number) => handleStreamingComplete(activeProject.id, messageIndex);

    return (
      <div className="flex flex-col h-full overflow-hidden flex-grow">
        <main className="hidden md:flex flex-grow p-4 gap-4 overflow-auto">
          <ResizablePanel direction="horizontal" initialSize={450} minSize={320}>
            <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} aiStatus={activeProjectRunState?.aiStatus || null} onStreamingComplete={onStreamingCompleteForActive} hasGeneratedCode={hasGeneratedCode} onNavigateToPreview={handleNavigateToPreview} onCancelRequest={handleCancelRequest} isCancelling={activeProjectRunState?.isCancelling || false} onContextMenu={handleOpenContextMenu} onDeleteMessage={handleDeleteMessage} onResubmitMessage={handleResubmitMessage} editingIndex={editingMessageIndex} onCancelEditing={() => setEditingMessageIndex(null)} stopwatchSeconds={activeProjectRunState?.stopwatchSeconds || 0} isStopwatchRunning={activeProjectRunState?.isStopwatchRunning || false} streamingProgress={activeProjectRunState?.streamingProgress || null} retryAttempt={activeProjectRunState?.retryAttempt || 0} />
            <EditorPreviewPanel
              device={device}
              onDeviceChange={setDevice}
              files={files}
              activeFile={activeFile}
              onSelectFile={setActiveFile}
              onCodeChange={handleCodeChange}
              previewHtml={previewHtml}
              standaloneHtml={standaloneHtml}
              onBackToChat={() => {}}
              onToggleFullscreen={handleToggleFullscreen}
              consoleLogs={consoleLogs}
              onNewLog={handleNewLog}
              onClearConsole={() => setConsoleLogs([])}
              view={view}
              currentView={view}
              onDatabaseAction={handleDatabaseAction}
              onVisualEditorChange={(content) => {
                if (activeProject) {
                  updateProjectById(activeProject.id, project => {
                    const newHistory = { ...project.history };
                    const newVersions = [...newHistory.versions];
                    const currentVersion = { ...newVersions[project.history.currentIndex] };
                    currentVersion.standaloneHtml = content;
                    newVersions[project.history.currentIndex] = currentVersion;
                    newHistory.versions = newVersions;
                    return { ...project, history: newHistory };
                  });
                }
              }}
              isVisualEditMode={isVisualEditMode}
              onVisualEditModeChange={setIsVisualEditMode}
              onPreviewEdit={(change: PreviewChange) => {
                // Handle preview edits - for now just log them
                console.log('Preview edit:', change);
                // TODO: Implement actual HTML modification based on the change
              }}
            />
          </ResizablePanel>
        </main>

        <main className="md:hidden flex flex-col flex-grow p-0 overflow-auto">
          <div className={`${mobileView === 'preview' ? 'hidden' : 'flex'} flex-col w-full h-full`}>
            <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} aiStatus={activeProjectRunState?.aiStatus || null} onStreamingComplete={onStreamingCompleteForActive} hasGeneratedCode={hasGeneratedCode} onNavigateToPreview={handleNavigateToPreview} onCancelRequest={handleCancelRequest} isCancelling={activeProjectRunState?.isCancelling || false} onContextMenu={handleOpenContextMenu} onDeleteMessage={handleDeleteMessage} onResubmitMessage={handleResubmitMessage} editingIndex={editingMessageIndex} onCancelEditing={() => setEditingMessageIndex(null)} stopwatchSeconds={activeProjectRunState?.stopwatchSeconds || 0} isStopwatchRunning={activeProjectRunState?.isStopwatchRunning || false} streamingProgress={activeProjectRunState?.streamingProgress || null} retryAttempt={activeProjectRunState?.retryAttempt || 0} />
          </div>
          <div className={`${mobileView === 'chat' ? 'hidden' : 'flex'} flex-col flex-grow h-full`}>
            <EditorPreviewPanel device={device} onDeviceChange={setDevice} files={files} activeFile={activeFile} onSelectFile={setActiveFile} onCodeChange={handleCodeChange} previewHtml={previewHtml} standaloneHtml={standaloneHtml} onBackToChat={() => setMobileView('chat')} onToggleFullscreen={handleToggleFullscreen} consoleLogs={consoleLogs} onNewLog={handleNewLog} onClearConsole={() => setConsoleLogs([])} />
          </div>
        </main>
      </div>
    );
  };
  
  return (
    <div className="h-screen bg-black text-gray-200 font-sans flex flex-col overflow-hidden relative" onClick={handleCloseContextMenu}>
      {isGuest && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-yellow-500/20 backdrop-blur-xl border-b border-yellow-400/30 text-yellow-100 text-xs md:text-sm p-2 md:p-3 text-center flex items-center justify-center gap-2 md:gap-4 animate-fadeInUp shadow-lg">
            <Icon name="help" className="w-4 h-4 md:w-5 md:h-5 text-yellow-300 flex-shrink-0" />
            <p className="flex-1 min-w-0">
                <span className="font-bold">Temporary Session:</span> <span className="hidden sm:inline">Your work is stored in your browser and will be lost if you clear your data.</span><span className="sm:hidden">Data not saved permanently.</span>
            </p>
            <button onClick={onSignUpClick} className="px-3 py-1 md:px-4 md:py-1.5 text-xs font-semibold rounded-md bg-white text-yellow-900 hover:bg-yellow-50 backdrop-blur-xl border border-white/20 transition-colors flex-shrink-0 shadow-lg">
                Sign Up
            </button>
        </div>
      )}

      <div 
        className={`hidden md:block absolute top-0 h-full z-40 transition-transform duration-300 ease-in-out ${isSidebarHovered ? 'translate-x-0' : '-translate-x-full'} ${isGuest ? 'pt-12 md:pt-14' : ''}`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <Sidebar {...sidebarProps} />
      </div>

      <div 
        onMouseEnter={() => setIsSidebarHovered(true)}
        className={`hidden md:block fixed bottom-4 left-4 z-50 cursor-pointer transition-opacity duration-300 ${isSidebarHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className="p-3 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 text-white shadow-2xl">
            <Icon name="menu" className="w-6 h-6" />
        </div>
      </div>
      
       <div className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>
          <div className={`relative w-64 h-full transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <Sidebar {...sidebarProps} isMobile={true} onClose={() => setMobileSidebarOpen(false)} />
          </div>
      </div>
      
      <div className={`flex-grow h-full flex flex-col overflow-hidden ${isGuest ? 'pt-12 md:pt-14' : ''}`}>
        <ConsolidatedHeader
          projectName={projectName}
          onRenameProject={handleRenameProject}
          onDownloadProject={handleDownloadProject}
          onPublish={isGuest ? onSignUpClick : () => setPublishModalOpen(true)}
          onSettings={() => setSettingsModalOpen(true)}
          onCheckErrors={handleCheckErrors}
          mobileView={mobileView}
          isProjectLoaded={isProjectLoaded}
          onToggleView={() => setMobileView(prev => prev === 'chat' ? 'preview' : 'chat')}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
          onTemplateLibrary={() => setIsTemplateLibraryOpen(true)}
          onVisualEditor={() => setIsVisualEditorOpen(true)}
          onStylePresets={() => setIsStylePresetsOpen(true)}
          onAIAgents={() => setIsAIAgentsOpen(true)}
          onDeployment={() => setIsDeploymentOpen(true)}
          onDatabase={() => setIsDatabaseOpen(true)}
          device={device}
          onDeviceChange={setDevice}
          view={view}
          onViewChange={setView}
          onToggleFullscreen={handleToggleFullscreen}
          userEmail={user?.email}
        />
        <div className="flex-grow overflow-auto">
          {renderWorkspaceContent()}
        </div>
      </div>

      {isPublishModalOpen && activeProject && <PublishModal projectName={projectName} files={files} onClose={() => setPublishModalOpen(false)} />}
      {isSettingsModalOpen && activeProject && (
        <SettingsModal 
          user={user}
          project={activeProject}
          onClose={() => setSettingsModalOpen(false)}
          onRestoreVersion={(versionIndex) => {
            updateProjectById(activeProject.id, p => ({ ...p, history: { ...p.history, currentIndex: versionIndex } }));
            setSettingsModalOpen(false);
          }}
          onDownloadProject={handleDownloadProject}
        />
      )}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} files={files} onSelectFile={setActiveFile} onDownloadProject={handleDownloadProject} onPublish={isGuest ? onSignUpClick : () => setPublishModalOpen(true)} />
      <MessageContextMenu {...contextMenu} onClose={handleCloseContextMenu} onDelete={() => handleDeleteMessage(contextMenu.messageIndex)} onEdit={handleEditMessage} />

      {/* New Feature Modals */}
      {isTemplateLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <TemplateLibrary
              onSelectTemplate={handleTemplateSelect}
              className="max-h-full"
            />
            <button
              onClick={() => setIsTemplateLibraryOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isVisualEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <VisualEditor
              htmlContent={standaloneHtml || previewHtml || ''}
              onContentChange={(content) => {
                if (activeProject) {
                  updateProjectById(activeProject.id, project => {
                    const newHistory = { ...project.history };
                    const newVersions = [...newHistory.versions];
                    const currentVersion = { ...newVersions[project.history.currentIndex] };
                    currentVersion.standaloneHtml = content;
                    newVersions[project.history.currentIndex] = currentVersion;
                    newHistory.versions = newVersions;
                    return { ...project, history: newHistory };
                  });
                }
              }}
              isEditMode={isVisualEditMode}
              onEditModeChange={setIsVisualEditMode}
              className="max-h-full"
            />
            <button
              onClick={() => {
                setIsVisualEditorOpen(false);
                setIsVisualEditMode(false);
              }}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isStylePresetsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <StylePresets
              onApplyPreset={handleStylePresetApply}
              className="max-h-full"
            />
            <button
              onClick={() => setIsStylePresetsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isAIAgentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-h-full overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">AI Agents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_AGENTS.map(agent => (
                  <div key={agent.id} className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{agent.icon}</span>
                      <div>
                        <h3 className="font-bold text-white">{agent.name}</h3>
                        <p className="text-gray-400 text-sm">{agent.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {agent.capabilities.slice(0, 3).map(cap => (
                        <span key={cap} className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                          {cap}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAIAgentTask(agent, 'code_generation')}
                        className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Generate
                      </button>
                      <button
                        onClick={() => handleAIAgentTask(agent, 'debugging')}
                        className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Debug
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setIsAIAgentsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isDeploymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-h-full overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Deploy Project</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEPLOYMENT_PLATFORMS.map(platform => (
                  <div key={platform.id} className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{platform.icon}</span>
                      <div>
                        <h3 className="font-bold text-white">{platform.name}</h3>
                        <p className="text-gray-400 text-sm">{platform.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {platform.features.slice(0, 2).map(feature => (
                        <span key={feature} className="px-2 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleDeployProject(platform.id)}
                      className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Deploy to {platform.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setIsDeploymentOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {isDatabaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-h-full overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-6">Database Manager</h2>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => handleDatabaseAction('create')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Create Database
                </button>
                <button
                  onClick={() => handleDatabaseAction('schema')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Generate Schema
                </button>
                <button
                  onClick={() => handleDatabaseAction('export')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Export Data
                </button>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-gray-400 text-sm">
                  Database management features will be displayed here. Current database: {databaseService.getCurrentDatabase()?.name || 'None'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDatabaseOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeWorkspace;