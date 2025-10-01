
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
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  messageIndex: number;
  message: Message | null;
}

const IdeWorkspace: React.FC<IdeWorkspaceProps> = ({ user, initialWorkspace, onSignOut, initialPrompt, clearInitialPrompt }) => {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const storageKey = `mominai_activeFile_${user.email}`;
  const [activeFile, setActiveFile] = useState<string>(() => localStorage.getItem(storageKey) || '');
  
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('chat');
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMessage[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, messageIndex: -1, message: null });
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);

  const activeProject = workspace.projects.find(p => p.id === workspace.activeProjectId);
  const debouncedProject = useDebounce(activeProject, 2000); // Debounce project saving
  const isInitialMountRef = useRef(true);

  // Effect for auto-saving debounced project changes
  useEffect(() => {
    if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
        return;
    }
    if (debouncedProject) {
        projectService.updateProject(debouncedProject).catch(err => {
            console.error("Failed to auto-save project:", err);
            // Here you could add a visual indicator for failed save
        });
    }
  }, [debouncedProject]);

  useEffect(() => {
    // On initial load, if no project is active, activate the first one.
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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewFullscreen) {
        setIsPreviewFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewFullscreen]);

  useEffect(() => {
    localStorage.setItem(storageKey, activeFile);
    if (!activeProject) return;
    const currentFiles = activeProject.history.versions[activeProject.history.currentIndex].files;
    if (activeFile && !currentFiles.hasOwnProperty(activeFile)) {
      setActiveFile(Object.keys(currentFiles)[0] || '');
    } else if (!activeFile && Object.keys(currentFiles).length > 0) {
      const preferredFiles = ['src/App.tsx', 'src/pages/Home.tsx', 'index.html', 'package.json'];
      const defaultFile = preferredFiles.find(f => f in currentFiles) || Object.keys(currentFiles)[0];
      setActiveFile(defaultFile);
    }
  }, [files, activeFile, activeProject, storageKey]);

  const updateActiveProject = useCallback((updater: (project: Project) => Project) => {
    setWorkspace(prevWorkspace => {
        const newProjects = prevWorkspace.projects.map(p => {
            if (p.id === prevWorkspace.activeProjectId) {
                return updater(p);
            }
            return p;
        });
        return { ...prevWorkspace, projects: newProjects };
    });
  }, []);

  const addHistoryState = useCallback((updater: (prevState: AppState) => AppState) => {
    updateActiveProject(project => {
        const currentVersion = project.history.versions[project.history.currentIndex];
        const newVersion = updater(currentVersion);
        
        const newVersions = project.history.versions.slice(0, project.history.currentIndex + 1);
        newVersions.push(newVersion);

        if (newVersions.length > 20) {
            newVersions.splice(0, newVersions.length - 20);
        }

        const newHistory: History = {
            versions: newVersions,
            currentIndex: newVersions.length - 1,
        };
        return { ...project, history: newHistory, projectName: newVersion.projectName };
    });
  }, [updateActiveProject]);

  const handleStreamingComplete = useCallback((messageIndex: number) => {
      updateActiveProject(project => {
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
  }, [updateActiveProject]);

  const triggerAiResponse = useCallback(async (messagesForAI: Message[], attachment: FileAttachment | null = null) => {
    setAiStatus('MominAI is working...');
    setIsVerifying(false);
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await sendAiChatRequest(
        messagesForAI,
        hasGeneratedCode ? files : null,
        attachment,
        controller.signal
      );

      setAiStatus(null);

      switch (response.responseType) {
        case 'CHAT': {
          const streamingMessage: Message = { role: 'model', content: response.message, streaming: true };
          addHistoryState(prev => ({
            ...prev,
            chatMessages: [...prev.chatMessages, streamingMessage]
          }));
          break;
        }
        case 'PROJECT_PLAN': {
          const { plan } = response;
          const planContent = `I've drafted a plan for your project, **${plan.projectName}**. Please review it below.`;
          const planMessage: Message = { role: 'model', content: planContent, plan: plan, action: 'AWAITING_PLAN_APPROVAL' };
          addHistoryState(prev => ({ ...prev, projectPlan: plan, chatMessages: [...prev.chatMessages, planMessage] }));
          setAiStatus("Awaiting your approval...");
          break;
        }
        case 'MODIFY_CODE': {
          setAiStatus('Generating files...');
          const { modification } = response;
          addHistoryState(prev => {
            const updatedFiles = prev.hasGeneratedCode ? { ...prev.files } : {};
            modification.changes.forEach((change: Change) => {
              if (change.action === 'delete') { delete updatedFiles[change.filePath]; } 
              else { updatedFiles[change.filePath] = change.content || ''; }
            });
            const modificationMessage: Message = { role: 'model', content: modification.reason };
            const gotoPreviewMessage: Message = { role: 'system', content: 'Go to Preview', action: 'GOTO_PREVIEW' };
            if (!prev.hasGeneratedCode || modification.changes.some(c => c.action === 'delete' && c.filePath === activeFile)) {
              const preferredFiles = ['src/App.tsx', 'index.html'];
              const defaultFile = preferredFiles.find(f => f in updatedFiles) || Object.keys(updatedFiles)[0] || '';
              setActiveFile(defaultFile);
            }
            return {
              ...prev, files: updatedFiles, previewHtml: modification.previewHtml || prev.previewHtml,
              chatMessages: [...prev.chatMessages, modificationMessage, gotoPreviewMessage],
              hasGeneratedCode: true, projectName: modification.projectName || prev.projectName, projectPlan: null,
            };
          });
          setConsoleLogs([]);
          setIsVerifying(true);
          setAiStatus('Verifying generated code...');
          break;
        }
      }
    } catch (error) {
      console.error('Error in AI interaction:', error);
      let errorMessageContent = `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessageContent = 'AI generation cancelled.';
      }
      const errorMessage: Message = { role: 'model', content: errorMessageContent };
      addHistoryState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, errorMessage], projectPlan: null }));
      setAiStatus(null);
    } finally {
      setAbortController(null);
    }
  }, [hasGeneratedCode, files, addHistoryState, activeFile, setActiveFile]);

  const handleSendMessage = useCallback(async (message: string, attachment?: FileAttachment) => {
    if (!currentState) return;
    const userMessage: Message = { role: 'user', content: message };
    const messagesWithUser = [
      ...currentState.chatMessages.map(msg => msg.action === 'AWAITING_PLAN_APPROVAL' ? { ...msg, action: undefined } : msg),
      userMessage
    ];
    addHistoryState(prev => ({ ...prev, chatMessages: messagesWithUser }));
    await triggerAiResponse(messagesWithUser, attachment);
  }, [currentState, addHistoryState, triggerAiResponse]);

    const handleNewProject = useCallback(async (name: string = 'New Project', andThenSend?: string) => {
        try {
            const newProject = await projectService.createProject(name);
            setWorkspace(ws => ({
                projects: [...ws.projects, newProject],
                activeProjectId: newProject.id,
            }));
            if (andThenSend) {
                // Wait for state to update then send message
                setTimeout(() => handleSendMessage(andThenSend), 0);
            }
        } catch (error) {
            console.error("Failed to create new project:", error);
            // Optionally, display an error message to the user
        }
    }, [handleSendMessage]);

    // Effect to handle the initial prompt from the landing page
    useEffect(() => {
        if (initialPrompt && currentState) {
            const prompt = initialPrompt;
            clearInitialPrompt(); // Consume the prompt
            
            const isFreshWorkspace = workspace.projects.length === 1 && chatMessages.length === 1 &&
                                  (workspace.projects[0].projectName === 'Untitled Project' || workspace.projects[0].projectName === 'New Project');
            
            if (isFreshWorkspace) {
                addHistoryState(prev => ({...prev, projectName: prompt.substring(0, 30)}));
                handleSendMessage(prompt);
            } else {
                handleNewProject(prompt.substring(0, 30), prompt);
            }
        }
    }, [initialPrompt, clearInitialPrompt, currentState, workspace.projects, handleSendMessage, addHistoryState, handleNewProject]);

  const triggerSelfCorrection = useCallback(async (errors: ConsoleMessage[]) => {
    if (!currentState) return;
    setAiStatus('Errors detected. Attempting to fix...');
    const errorContent = `The code you just generated produced the following errors in the browser console. Please analyze these errors and the current project files to identify the root cause and provide the necessary code changes to fix them.

Errors:
${JSON.stringify(errors, null, 2)}
`;
    const correctionMessage: Message = { role: 'correction', content: errorContent };
    
    const messagesForCorrection = [...currentState.chatMessages, correctionMessage];

    try {
      const response = await sendAiChatRequest(messagesForCorrection, files, null);
       if (response.responseType === 'MODIFY_CODE') {
        const { modification } = response;
        addHistoryState(prev => {
            const updatedFiles = { ...prev.files };
            modification.changes.forEach((change: Change) => {
              if (change.action === 'delete') {
                delete updatedFiles[change.filePath];
              } else { 
                updatedFiles[change.filePath] = change.content || '';
              }
            });

            const fixMessage: Message = { role: 'model', content: `**Self-Correction:** ${modification.reason}` };
            
            return {
              ...prev,
              files: updatedFiles,
              previewHtml: modification.previewHtml || prev.previewHtml,
              chatMessages: [...prev.chatMessages, fixMessage],
            };
        });
        setAiStatus(null);
       } else {
         const chatMessage: Message = { role: 'model', content: response.message };
         addHistoryState(prev => ({...prev, chatMessages: [...prev.chatMessages, chatMessage] }));
         setAiStatus(null);
       }

    } catch (error) {
       console.error('Error during self-correction:', error);
       const errorMessage: Message = { role: 'model', content: `Sorry, I encountered an error while trying to fix the code: ${error instanceof Error ? error.message : 'Unknown error'}` };
       addHistoryState(prev => ({...prev, chatMessages: [...prev.chatMessages, errorMessage] }));
       setAiStatus(null);
    }

  }, [addHistoryState, currentState, files]);

  useEffect(() => {
    if (!isVerifying) return;
    const verificationTimeout = setTimeout(() => {
      const errors = consoleLogs.filter(log => log.level === 'error');
      if (errors.length > 0) {
        triggerSelfCorrection(errors);
      } else {
        setAiStatus(null); // No errors, we're done
      }
      setIsVerifying(false);
    }, 3000);
    return () => clearTimeout(verificationTimeout);
  }, [isVerifying, consoleLogs, triggerSelfCorrection]);

  const handleResubmitMessage = useCallback(async (messageIndex: number, newContent: string) => {
    if (!currentState) return;
    const newMessages = currentState.chatMessages.slice(0, messageIndex);
    newMessages.push({ role: 'user', content: newContent });
    addHistoryState(prev => ({
      ...prev,
      chatMessages: newMessages,
    }));
    await triggerAiResponse(newMessages);
  }, [currentState, addHistoryState, triggerAiResponse]);

  const handleDeleteMessage = useCallback((messageIndex: number) => {
    addHistoryState(prev => {
      const newMessages = [...prev.chatMessages];
      const messageToDelete = newMessages[messageIndex];
      if (messageToDelete.role === 'user' && newMessages[messageIndex + 1]?.role === 'model') {
        newMessages.splice(messageIndex, 2);
      } else {
        newMessages.splice(messageIndex, 1);
      }
      return { ...prev, chatMessages: newMessages };
    });
  }, [addHistoryState]);

  const handleCancelRequest = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  const handleOpenContextMenu = useCallback((event: React.MouseEvent, index: number) => {
    event.preventDefault();
    if (!chatMessages[index]) return;
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      messageIndex: index,
      message: chatMessages[index]
    });
  }, [chatMessages]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  const handleEditMessage = useCallback(() => {
    if (contextMenu.messageIndex !== -1) {
      setEditingMessageIndex(contextMenu.messageIndex);
    }
    handleCloseContextMenu();
  }, [contextMenu.messageIndex, handleCloseContextMenu]);

  const handleCodeChange = useCallback((newContent: string) => {
    updateActiveProject(project => {
        const newHistory = { ...project.history };
        const newVersions = [...newHistory.versions];
        const currentVersion = { ...newVersions[project.history.currentIndex] };
        currentVersion.files = { ...currentVersion.files, [activeFile]: newContent };
        newVersions[project.history.currentIndex] = currentVersion;
        newHistory.versions = newVersions;
        return { ...project, history: newHistory };
    });
  }, [activeFile, updateActiveProject]);

  const handleRenameProject = useCallback((newName: string) => {
    addHistoryState(prev => ({...prev, projectName: newName }));
  }, [addHistoryState]);

  const handleDownloadProject = async () => {
    if (Object.keys(files).length > 0) {
      await downloadProjectAsZip(files, projectName);
    }
  };

  const handleUndo = useCallback(() => {
    if (canUndo) {
      updateActiveProject(project => ({
        ...project,
        history: { ...project.history, currentIndex: project.history.currentIndex - 1 }
      }));
    }
  }, [canUndo, updateActiveProject]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      updateActiveProject(project => ({
        ...project,
        history: { ...project.history, currentIndex: project.history.currentIndex + 1 }
      }));
    }
  }, [canRedo, updateActiveProject]);

  const handleSelectFileFromPalette = (path: string) => {
    setActiveFile(path);
  };

  const handleToggleFullscreen = useCallback(() => {
    setIsPreviewFullscreen(prev => !prev);
  }, []);

  const handleNavigateToPreview = useCallback(() => {
    setMobileView('preview');
  }, []);

  const handleNewLog = useCallback((log: ConsoleMessage) => {
    setConsoleLogs(prev => [...prev, log]);
  }, []);

  const handleSelectProject = useCallback((id: string) => {
    setWorkspace(ws => ({ ...ws, activeProjectId: id }));
  }, []);

  const handleDeleteProject = useCallback(async (id: string) => {
    try {
        await projectService.deleteProject(id);
        setWorkspace(ws => {
            const newProjects = ws.projects.filter(p => p.id !== id);
            let newActiveId = ws.activeProjectId;
            if (ws.activeProjectId === id) {
                newActiveId = newProjects[0]?.id || null;
            }
            return { projects: newProjects, activeProjectId: newActiveId };
        });
    } catch (error) {
        console.error("Failed to delete project:", error);
    }
  }, []);

  if (isPreviewFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        <LivePreview
          htmlContent={previewHtml}
          isFullscreen={true}
          onExitFullscreen={handleToggleFullscreen}
          logs={consoleLogs}
          onNewLog={handleNewLog}
          onClearLogs={() => setConsoleLogs([])}
        />
      </div>
    );
  }

  if (!activeProject || !currentState) {
     return (
        <div className="flex h-screen w-full">
            <Sidebar
                isExpanded={isSidebarExpanded}
                projects={workspace.projects}
                activeProjectId={workspace.activeProjectId}
                onSelectProject={handleSelectProject}
                onNewProject={() => handleNewProject()}
                onDeleteProject={handleDeleteProject}
                user={user}
                onSignOut={onSignOut}
            />
            <main className="flex-grow flex items-center justify-center bg-transparent text-white">
                <div>No project selected. Create one to get started!</div>
            </main>
        </div>
     );
  }

  return (
    <div className="h-screen bg-transparent text-gray-200 font-sans flex" onClick={handleCloseContextMenu}>
        <Sidebar
            isExpanded={isSidebarExpanded}
            projects={workspace.projects}
            activeProjectId={workspace.activeProjectId}
            onSelectProject={handleSelectProject}
            onNewProject={() => handleNewProject()}
            onDeleteProject={handleDeleteProject}
            user={user}
            onSignOut={onSignOut}
        />
      
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
          onToggleSidebar={() => setIsSidebarExpanded(p => !p)}
        />
        
        <main className="hidden md:flex flex-grow p-4 gap-4 overflow-hidden">
          <ResizablePanel direction="horizontal" initialSize={450} minSize={320}>
            <ChatPanel 
              messages={chatMessages} 
              onSendMessage={handleSendMessage} 
              aiStatus={aiStatus}
              onStreamingComplete={handleStreamingComplete}
              hasGeneratedCode={hasGeneratedCode}
              onNavigateToPreview={handleNavigateToPreview}
              onCancelRequest={handleCancelRequest}
              isCancelling={!!abortController}
              onContextMenu={handleOpenContextMenu}
              onDeleteMessage={handleDeleteMessage}
              onResubmitMessage={handleResubmitMessage}
              editingIndex={editingMessageIndex}
              onCancelEditing={() => setEditingMessageIndex(null)}
            />
            <EditorPreviewPanel
              files={files}
              activeFile={activeFile}
              onSelectFile={setActiveFile}
              onCodeChange={handleCodeChange}
              previewHtml={previewHtml}
              onBackToChat={() => {}}
              onToggleFullscreen={handleToggleFullscreen}
              consoleLogs={consoleLogs}
              onNewLog={handleNewLog}
              onClearConsole={() => setConsoleLogs([])}
            />
          </ResizablePanel>
        </main>

        <main className="md:hidden flex flex-col flex-grow p-0 overflow-hidden">
          <div className={`${mobileView === 'preview' ? 'hidden' : 'flex'} flex-col w-full h-full`}>
            <ChatPanel 
              messages={chatMessages} 
              onSendMessage={handleSendMessage} 
              aiStatus={aiStatus}
              onStreamingComplete={handleStreamingComplete}
              hasGeneratedCode={hasGeneratedCode}
              onNavigateToPreview={handleNavigateToPreview}
              onCancelRequest={handleCancelRequest}
              isCancelling={!!abortController}
              onContextMenu={handleOpenContextMenu}
              onDeleteMessage={handleDeleteMessage}
              onResubmitMessage={handleResubmitMessage}
              editingIndex={editingMessageIndex}
              onCancelEditing={() => setEditingMessageIndex(null)}
            />
          </div>

          <div className={`${mobileView === 'chat' ? 'hidden' : 'flex'} flex-col flex-grow h-full`}>
            <EditorPreviewPanel
              files={files}
              activeFile={activeFile}
              onSelectFile={setActiveFile}
              onCodeChange={handleCodeChange}
              previewHtml={previewHtml}
              onBackToChat={() => setMobileView('chat')}
              onToggleFullscreen={handleToggleFullscreen}
              consoleLogs={consoleLogs}
              onNewLog={handleNewLog}
              onClearConsole={() => setConsoleLogs([])}
            />
          </div>
        </main>
      </div>

      {isPublishModalOpen && (
        <PublishModal
          projectName={projectName}
          files={files}
          onClose={() => setPublishModalOpen(false)}
        />
      )}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        files={files}
        onSelectFile={handleSelectFileFromPalette}
        onDownloadProject={handleDownloadProject}
        onPublish={() => setPublishModalOpen(true)}
       />
       <MessageContextMenu
        {...contextMenu}
        onClose={handleCloseContextMenu}
        onDelete={() => handleDeleteMessage(contextMenu.messageIndex)}
        onEdit={handleEditMessage}
       />
    </div>
  );
};

export default IdeWorkspace;
