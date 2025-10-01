import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChatPanel from './ChatPanel';
import Header from './Header';
import EditorPreviewPanel from './EditorPreviewPanel';
import PublishModal from './PublishModal';
import CommandPalette from './CommandPalette';
import LivePreview from './LivePreview';
import ResizablePanel from './ResizablePanel';
import Sidebar from './Sidebar';
import { Icon } from './Icon';
import MessageContextMenu from './MessageContextMenu';
import type { Message, Files, Change, FileAttachment, History, AppState, ConsoleMessage, Plan, Workspace, Project, User } from '../types';
import { sendAiChatRequest, resetChat } from '../services/geminiService';
import * as projectService from '../services/projectService';
import { downloadProjectAsZip } from '../services/zipService';
import { INITIAL_CHAT_MESSAGE } from '../constants';
import { useDebounce } from '../hooks/useDebounce';

type MobileView = 'chat' | 'preview';

interface IdeWorkspaceProps {
    user: User;
    initialWorkspace: Workspace;
    onSignOut: () => void;
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

// New interface for transient, per-project operational state
interface ProjectRunState {
  aiStatus: string | null;
  isVerifying: boolean;
  abortController: AbortController | null;
}

const IdeWorkspace: React.FC<IdeWorkspaceProps> = ({ user, initialWorkspace, onSignOut, initialPrompt, clearInitialPrompt, initialAttachment, clearInitialAttachment }) => {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const storageKey = `mominai_activeFile_${user.email}`;
  const [activeFile, setActiveFile] = useState<string>(() => localStorage.getItem(storageKey) || '');
  
  // Per-project state for AI operations
  const [projectRunStates, setProjectRunStates] = useState<Record<string, ProjectRunState>>({});
  
  const [mobileView, setMobileView] = useState<MobileView>('chat');
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMessage[]>([]);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, messageIndex: -1, message: null });
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);

  const activeProject = workspace.projects.find(p => p.id === workspace.activeProjectId);
  const activeProjectRunState = activeProject ? projectRunStates[activeProject.id] : undefined;

  const debouncedProject = useDebounce(activeProject, 2000);
  const isInitialMountRef = useRef(true);

  // Auto-save debounced project changes
  useEffect(() => {
    if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        return;
    }
    if (debouncedProject) {
        projectService.updateProject(debouncedProject).catch(err => {
            console.error("Failed to auto-save project:", err);
        });
    }
  }, [debouncedProject]);

  // Initialize/update run states when projects change
  useEffect(() => {
    setProjectRunStates(prevStates => {
        const newStates: Record<string, ProjectRunState> = {};
        for (const project of workspace.projects) {
            newStates[project.id] = prevStates[project.id] || {
                aiStatus: null,
                isVerifying: false,
                abortController: null,
            };
        }
        return newStates;
    });
  }, [workspace.projects]);

  // Activate the first project on initial load if none is active
  useEffect(() => {
    if (!workspace.activeProjectId && workspace.projects.length > 0) {
        setWorkspace(ws => ({ ...ws, activeProjectId: ws.projects[0].id }));
    }
  }, [workspace.activeProjectId, workspace.projects]);

  const currentState = activeProject?.history.versions[activeProject.history.currentIndex];
  
  const { files, previewHtml, chatMessages, hasGeneratedCode, projectName, projectPlan } = currentState || {
    files: {}, previewHtml: '', chatMessages: [], hasGeneratedCode: false, projectName: 'Loading...', projectPlan: null
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

  // Updater function that targets a specific project by its ID
  const updateProjectById = useCallback((projectId: string, updater: (project: Project) => Project) => {
    setWorkspace(prevWorkspace => {
        const newProjects = prevWorkspace.projects.map(p => {
            if (p.id === projectId) {
                return updater(p);
            }
            return p;
        });
        return { ...prevWorkspace, projects: newProjects };
    });
  }, []);

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

  const triggerAiResponse = useCallback(async (projectId: string, messagesForAI: Message[], attachment: FileAttachment | null = null) => {
    const projectForRequest = workspace.projects.find(p => p.id === projectId);
    if (!projectForRequest) return;
    
    const { files: projectFiles, hasGeneratedCode: projectHasCode } = projectForRequest.history.versions[projectForRequest.history.currentIndex];

    const controller = new AbortController();
    setProjectRunStates(prev => ({
        ...prev, [projectId]: { aiStatus: 'MominAI is working...', isVerifying: false, abortController: controller }
    }));

    try {
      const response = await sendAiChatRequest(messagesForAI, projectHasCode ? projectFiles : null, attachment, controller.signal);

      setProjectRunStates(prev => ({ ...prev, [projectId]: {...prev[projectId], aiStatus: null } }));

      switch (response.responseType) {
        case 'CHAT':
          addHistoryStateForProject(projectId, prev => ({...prev, chatMessages: [...prev.chatMessages, { role: 'model', content: response.message, streaming: true }]}));
          break;
        case 'PROJECT_PLAN': {
          const { plan } = response;
          const planContent = `I've drafted a plan for your project, **${plan.projectName}**. Please review it below.`;
          const planMessage: Message = { role: 'model', content: planContent, plan: plan, action: 'AWAITING_PLAN_APPROVAL' };
          addHistoryStateForProject(projectId, prev => ({ ...prev, projectPlan: plan, chatMessages: [...prev.chatMessages, planMessage] }));
          setProjectRunStates(prev => ({ ...prev, [projectId]: {...prev[projectId], aiStatus: "Awaiting your approval..."}}));
          break;
        }
        case 'MODIFY_CODE': {
          setProjectRunStates(prev => ({ ...prev, [projectId]: {...prev[projectId], aiStatus: "Generating files..."}}));
          const { modification } = response;
          addHistoryStateForProject(projectId, prev => {
            const updatedFiles = prev.hasGeneratedCode ? { ...prev.files } : {};
            modification.changes.forEach((change: Change) => {
              if (change.action === 'delete') { delete updatedFiles[change.filePath]; } 
              else { updatedFiles[change.filePath] = change.content || ''; }
            });
            return {
              ...prev, files: updatedFiles, previewHtml: modification.previewHtml || prev.previewHtml,
              chatMessages: [...prev.chatMessages, { role: 'model', content: modification.reason }, { role: 'system', content: 'Go to Preview', action: 'GOTO_PREVIEW' }],
              hasGeneratedCode: true, projectName: modification.projectName || prev.projectName, projectPlan: null,
            };
          });
          setConsoleLogs([]);
          setProjectRunStates(prev => ({ ...prev, [projectId]: { ...prev[projectId], isVerifying: true, aiStatus: "Verifying generated code..." } }));
          break;
        }
      }
    } catch (error) {
      let errorMessageContent = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (error instanceof DOMException && error.name === 'AbortError') errorMessageContent = 'AI generation cancelled.';
      addHistoryStateForProject(projectId, prev => ({ ...prev, chatMessages: [...prev.chatMessages, { role: 'model', content: errorMessageContent }], projectPlan: null }));
      setProjectRunStates(prev => ({ ...prev, [projectId]: { aiStatus: null, isVerifying: false, abortController: null } }));
    } finally {
      setProjectRunStates(prev => ({ ...prev, [projectId]: {...prev[projectId], abortController: null } }));
    }
  }, [workspace.projects, addHistoryStateForProject]);

  const handleSendMessage = useCallback(async (message: string, attachment?: FileAttachment | null) => {
    if (!activeProject || !currentState) return;
    const projectId = activeProject.id;
    const userMessage: Message = { role: 'user', content: message };
    const messagesWithUser = [...currentState.chatMessages.map(msg => msg.action === 'AWAITING_PLAN_APPROVAL' ? { ...msg, action: undefined } : msg), userMessage];
    addHistoryStateForProject(projectId, prev => ({ ...prev, chatMessages: messagesWithUser }));
    await triggerAiResponse(projectId, messagesWithUser, attachment);
  }, [activeProject, currentState, addHistoryStateForProject, triggerAiResponse]);

  const handleNewProject = useCallback(async (name: string = 'New Project', andThenSend?: {prompt: string, attachment: FileAttachment | null}) => {
      try {
          const newProject = await projectService.createProject(name);
          setWorkspace(ws => ({ projects: [...ws.projects, newProject], activeProjectId: newProject.id }));
          if (andThenSend) setTimeout(() => handleSendMessage(andThenSend.prompt, andThenSend.attachment), 0);
      } catch (error) {
          console.error("Failed to create new project:", error);
      }
  }, [handleSendMessage]);

  useEffect(() => {
      if ((initialPrompt || initialAttachment) && currentState) {
          const prompt = initialPrompt || '';
          const attachment = initialAttachment;
          clearInitialPrompt();
          clearInitialAttachment();
          const isFreshProject = !hasGeneratedCode && chatMessages.length <= 1 && (projectName === 'Untitled Project' || projectName === 'New Project');
          if (isFreshProject) {
              if (prompt) addHistoryStateForProject(activeProject!.id, prev => ({...prev, projectName: prompt.substring(0, 30)}));
              handleSendMessage(prompt, attachment);
          } else {
              handleNewProject(prompt.substring(0, 30) || 'New Visual Project', { prompt, attachment });
          }
      }
  }, [initialPrompt, initialAttachment, clearInitialPrompt, clearInitialAttachment, currentState, hasGeneratedCode, chatMessages.length, projectName, handleSendMessage, addHistoryStateForProject, handleNewProject, activeProject]);

  const triggerSelfCorrection = useCallback(async (projectId: string, errors: ConsoleMessage[]) => {
    const projectForRequest = workspace.projects.find(p => p.id === projectId);
    if (!projectForRequest) return;
    
    setProjectRunStates(prev => ({...prev, [projectId]: {...prev[projectId], aiStatus: 'Errors detected. Attempting to fix...'}}));
    
    const errorContent = `The code you just generated produced the following errors: ${JSON.stringify(errors, null, 2)}`;
    const correctionMessage: Message = { role: 'correction', content: errorContent };
    const messagesForCorrection = [...projectForRequest.history.versions[projectForRequest.history.currentIndex].chatMessages, correctionMessage];

    try {
      const response = await sendAiChatRequest(messagesForCorrection, files, null);
       if (response.responseType === 'MODIFY_CODE') {
        const { modification } = response;
        addHistoryStateForProject(projectId, prev => {
            const updatedFiles = { ...prev.files };
            modification.changes.forEach((change: Change) => {
              if (change.action === 'delete') delete updatedFiles[change.filePath];
              else updatedFiles[change.filePath] = change.content || '';
            });
            return {...prev, files: updatedFiles, previewHtml: modification.previewHtml || prev.previewHtml, chatMessages: [...prev.chatMessages, { role: 'model', content: `**Self-Correction:** ${modification.reason}` }]};
        });
       } else {
         addHistoryStateForProject(projectId, prev => ({...prev, chatMessages: [...prev.chatMessages, { role: 'model', content: response.message }] }));
       }
       setProjectRunStates(prev => ({...prev, [projectId]: {...prev[projectId], aiStatus: null}}));
    } catch (error) {
       const errorMessage = `Sorry, I encountered an error while trying to fix the code: ${error instanceof Error ? error.message : 'Unknown error'}`;
       addHistoryStateForProject(projectId, prev => ({...prev, chatMessages: [...prev.chatMessages, { role: 'model', content: errorMessage }] }));
       setProjectRunStates(prev => ({...prev, [projectId]: {...prev[projectId], aiStatus: null}}));
    }
  }, [addHistoryStateForProject, workspace.projects, files]);

  useEffect(() => {
    const projectToVerifyId = Object.keys(projectRunStates).find(id => projectRunStates[id].isVerifying);
    if (!projectToVerifyId) return;

    const verificationTimeout = setTimeout(() => {
      const errors = consoleLogs.filter(log => log.level === 'error');
      if (errors.length > 0) {
        triggerSelfCorrection(projectToVerifyId, errors);
      } else {
        setProjectRunStates(prev => ({...prev, [projectToVerifyId]: {...prev[projectToVerifyId], aiStatus: null}}));
      }
      setProjectRunStates(prev => ({...prev, [projectToVerifyId]: {...prev[projectToVerifyId], isVerifying: false}}));
    }, 3000);
    return () => clearTimeout(verificationTimeout);
  }, [projectRunStates, consoleLogs, triggerSelfCorrection]);

  const handleResubmitMessage = useCallback(async (messageIndex: number, newContent: string) => {
    if (!activeProject || !currentState) return;
    const projectId = activeProject.id;
    const newMessages = currentState.chatMessages.slice(0, messageIndex);
    newMessages.push({ role: 'user', content: newContent });
    addHistoryStateForProject(projectId, prev => ({ ...prev, chatMessages: newMessages }));
    await triggerAiResponse(projectId, newMessages);
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
    activeProjectRunState?.abortController?.abort();
  }, [activeProjectRunState]);

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

  const updateActiveProjectState = useCallback((updater: (project: Project) => Project) => {
    if (!workspace.activeProjectId) return;
    updateProjectById(workspace.activeProjectId, updater);
  }, [workspace.activeProjectId, updateProjectById]);

  const handleCodeChange = useCallback((newContent: string) => {
    updateActiveProjectState(project => {
        const newHistory = { ...project.history };
        const newVersions = [...newHistory.versions];
        const currentVersion = { ...newVersions[project.history.currentIndex] };
        currentVersion.files = { ...currentVersion.files, [activeFile]: newContent };
        newVersions[project.history.currentIndex] = currentVersion;
        newHistory.versions = newVersions;
        return { ...project, history: newHistory };
    });
  }, [activeFile, updateActiveProjectState]);

  const handleRenameProject = useCallback((newName: string) => {
    if (!activeProject) return;
    addHistoryStateForProject(activeProject.id, prev => ({...prev, projectName: newName }));
  }, [activeProject, addHistoryStateForProject]);

  const handleDownloadProject = async () => {
    if (Object.keys(files).length > 0) await downloadProjectAsZip(files, projectName);
  };

  const handleUndo = useCallback(() => {
    if (canUndo) updateActiveProjectState(p => ({ ...p, history: { ...p.history, currentIndex: p.history.currentIndex - 1 }}));
  }, [canUndo, updateActiveProjectState]);

  const handleRedo = useCallback(() => {
    if (canRedo) updateActiveProjectState(p => ({ ...p, history: { ...p.history, currentIndex: p.history.currentIndex + 1 }}));
  }, [canRedo, updateActiveProjectState]);

  const handleToggleFullscreen = useCallback(() => setIsPreviewFullscreen(prev => !prev), []);
  const handleNavigateToPreview = useCallback(() => setMobileView('preview'), []);
  const handleNewLog = useCallback((log: ConsoleMessage) => setConsoleLogs(prev => [...prev, log]), []);
  const handleSelectProject = useCallback((id: string) => {
    setWorkspace(ws => ({ ...ws, activeProjectId: id }));
    setMobileSidebarOpen(false); // Close sidebar on selection
  }, []);

  const handleDeleteProject = useCallback(async (id: string) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
        await projectService.deleteProject(id);
        setWorkspace(ws => {
            const newProjects = ws.projects.filter(p => p.id !== id);
            let newActiveId = ws.activeProjectId === id ? (newProjects[0]?.id || null) : ws.activeProjectId;
            return { projects: newProjects, activeProjectId: newActiveId };
        });
    } catch (error) { console.error("Failed to delete project:", error); }
  }, []);

  if (isPreviewFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        <LivePreview htmlContent={previewHtml} isFullscreen onExitFullscreen={handleToggleFullscreen} logs={consoleLogs} onNewLog={handleNewLog} onClearLogs={() => setConsoleLogs([])} />
      </div>
    );
  }
  
  const sidebarProps = {
    projects: workspace.projects,
    activeProjectId: workspace.activeProjectId,
    onSelectProject: handleSelectProject,
    onNewProject: () => handleNewProject(),
    onDeleteProject: handleDeleteProject,
    user: user,
    onSignOut: onSignOut
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
        <Header 
            projectName={projectName} 
            onRenameProject={handleRenameProject} 
            onDownloadProject={handleDownloadProject} 
            onPublish={() => setPublishModalOpen(true)} 
            mobileView={mobileView} 
            isProjectLoaded={isProjectLoaded} 
            onToggleView={() => setMobileView(prev => prev === 'chat' ? 'preview' : 'chat')} 
            onUndo={handleUndo} 
            onRedo={handleRedo} 
            canUndo={canUndo} 
            canRedo={canRedo} 
            onToggleSidebar={() => setMobileSidebarOpen(true)}
        />
        
        <main className="hidden md:flex flex-grow p-4 gap-4 overflow-hidden">
          <ResizablePanel direction="horizontal" initialSize={450} minSize={320}>
            <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} aiStatus={activeProjectRunState?.aiStatus || null} onStreamingComplete={onStreamingCompleteForActive} hasGeneratedCode={hasGeneratedCode} onNavigateToPreview={handleNavigateToPreview} onCancelRequest={handleCancelRequest} isCancelling={!!activeProjectRunState?.abortController} onContextMenu={handleOpenContextMenu} onDeleteMessage={handleDeleteMessage} onResubmitMessage={handleResubmitMessage} editingIndex={editingMessageIndex} onCancelEditing={() => setEditingMessageIndex(null)} />
            <EditorPreviewPanel files={files} activeFile={activeFile} onSelectFile={setActiveFile} onCodeChange={handleCodeChange} previewHtml={previewHtml} onBackToChat={() => {}} onToggleFullscreen={handleToggleFullscreen} consoleLogs={consoleLogs} onNewLog={handleNewLog} onClearConsole={() => setConsoleLogs([])} />
          </ResizablePanel>
        </main>

        <main className="md:hidden flex flex-col flex-grow p-0 overflow-hidden">
          <div className={`${mobileView === 'preview' ? 'hidden' : 'flex'} flex-col w-full h-full`}>
            <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} aiStatus={activeProjectRunState?.aiStatus || null} onStreamingComplete={onStreamingCompleteForActive} hasGeneratedCode={hasGeneratedCode} onNavigateToPreview={handleNavigateToPreview} onCancelRequest={handleCancelRequest} isCancelling={!!activeProjectRunState?.abortController} onContextMenu={handleOpenContextMenu} onDeleteMessage={handleDeleteMessage} onResubmitMessage={handleResubmitMessage} editingIndex={editingMessageIndex} onCancelEditing={() => setEditingMessageIndex(null)} />
          </div>
          <div className={`${mobileView === 'chat' ? 'hidden' : 'flex'} flex-col flex-grow h-full`}>
            <EditorPreviewPanel files={files} activeFile={activeFile} onSelectFile={setActiveFile} onCodeChange={handleCodeChange} previewHtml={previewHtml} onBackToChat={() => setMobileView('chat')} onToggleFullscreen={handleToggleFullscreen} consoleLogs={consoleLogs} onNewLog={handleNewLog} onClearConsole={() => setConsoleLogs([])} />
          </div>
        </main>
      </div>
    );
  };
  
  return (
    <div className="h-screen bg-transparent text-gray-200 font-sans flex overflow-hidden" onClick={handleCloseContextMenu}>
      {/* Desktop Sidebar (Hover-based) */}
      <div className="hidden md:block relative h-full flex-shrink-0 z-40" onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)}>
        <div className={`h-full transition-transform duration-300 ease-in-out ${isSidebarHovered ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar {...sidebarProps} />
        </div>
        <div className="absolute bottom-4 left-4 pointer-events-none">
           <div className={`p-3 rounded-full bg-purple-600/80 backdrop-blur-md border border-white/10 text-white shadow-lg transition-opacity duration-300 ${isSidebarHovered ? 'opacity-0' : 'opacity-100'}`}>
              <Icon name="menu" className="w-6 h-6" />
           </div>
        </div>
      </div>
      
       {/* Mobile Sidebar (Overlay) */}
      <div className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)}></div>
          <div className={`relative w-64 h-full transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <Sidebar {...sidebarProps} isMobile={true} onClose={() => setMobileSidebarOpen(false)} />
          </div>
      </div>
      
      {/* Main Content */}
      <div className={`flex-grow h-full transition-all duration-300 ease-in-out ${isSidebarHovered ? 'md:ml-0' : 'md:-ml-64'}`}>
        {renderWorkspaceContent()}
      </div>

      {isPublishModalOpen && activeProject && <PublishModal projectName={projectName} files={files} onClose={() => setPublishModalOpen(false)} />}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} files={files} onSelectFile={setActiveFile} onDownloadProject={handleDownloadProject} onPublish={() => setPublishModalOpen(true)} />
      <MessageContextMenu {...contextMenu} onClose={handleCloseContextMenu} onDelete={() => handleDeleteMessage(contextMenu.messageIndex)} onEdit={handleEditMessage} />
    </div>
  );
};

export default IdeWorkspace;