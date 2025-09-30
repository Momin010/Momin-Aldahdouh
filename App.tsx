import React, { useState, useCallback, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import Header from './components/Header';
import EditorPreviewPanel from './components/EditorPreviewPanel';
import PublishModal from './components/PublishModal';
import CommandPalette from './components/CommandPalette';
import LivePreview from './components/LivePreview';
import ResizablePanel from './components/ResizablePanel';
import Sidebar from './components/Sidebar';
import type { Message, Files, Change, FileAttachment, History, AppState, ConsoleMessage, Plan, Workspace, Project } from './types';
import { sendAiChatRequest, resetChat } from './services/geminiService';
import { downloadProjectAsZip } from './services/zipService';
import { INITIAL_CHAT_MESSAGE, INITIAL_FILES } from './constants';
import usePersistentState from './hooks/usePersistentState';
import { Icon } from './components/Icon';


type MobileView = 'chat' | 'preview';

const createNewProject = (name: string): Project => ({
  id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  projectName: name,
  history: {
    versions: [{
      files: INITIAL_FILES,
      previewHtml: '',
      chatMessages: [INITIAL_CHAT_MESSAGE],
      hasGeneratedCode: false,
      projectName: name,
      projectPlan: null,
    }],
    currentIndex: 0,
  }
});

const INITIAL_WORKSPACE: Workspace = {
  projects: [createNewProject('Untitled Project')],
  activeProjectId: null,
};


const App: React.FC = () => {
  const [workspace, setWorkspace] = usePersistentState<Workspace>('mominai_workspace', INITIAL_WORKSPACE);
  const [activeFile, setActiveFile] = usePersistentState<string>('mominai_activeFile', '');
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('chat');
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMessage[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);


  useEffect(() => {
    // On initial load, if no project is active, activate the first one.
    if (!workspace.activeProjectId && workspace.projects.length > 0) {
        setWorkspace(ws => ({ ...ws, activeProjectId: ws.projects[0].id }));
    }
    // If the active project was deleted, reset to the first one.
    if (workspace.activeProjectId && !workspace.projects.some(p => p.id === workspace.activeProjectId)) {
        setWorkspace(ws => ({ ...ws, activeProjectId: ws.projects[0]?.id || null }));
    }
  }, [workspace, setWorkspace]);

  const activeProject = workspace.projects.find(p => p.id === workspace.activeProjectId);
  const currentState = activeProject?.history.versions[activeProject.history.currentIndex];
  
  const { files, previewHtml, chatMessages, hasGeneratedCode, projectName, projectPlan } = currentState || {
    files: {}, previewHtml: '', chatMessages: [], hasGeneratedCode: false, projectName: 'Loading...', projectPlan: null
  };
  
  const isProjectLoaded = !!activeProject && Object.keys(files).length > 0;
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
    if (!activeProject) return;
    const currentFiles = activeProject.history.versions[activeProject.history.currentIndex].files;
    if (activeFile && !currentFiles.hasOwnProperty(activeFile)) {
      setActiveFile(Object.keys(currentFiles)[0] || '');
    } else if (!activeFile && Object.keys(currentFiles).length > 0) {
      const preferredFiles = ['src/App.tsx', 'src/pages/Home.tsx', 'index.html', 'package.json'];
      const defaultFile = preferredFiles.find(f => f in currentFiles) || Object.keys(currentFiles)[0];
      setActiveFile(defaultFile);
    }
  }, [files, activeFile, setActiveFile, activeProject]);

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
  }, [setWorkspace]);

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

  const handleAnimationComplete = useCallback((content: string) => {
    const modelMessage: Message = { role: 'model', content };
    addHistoryState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, modelMessage],
    }));
    setStreamingContent(null);
  }, [addHistoryState]);

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
                if (change.action === 'create' || change.action === 'update') {
                    updatedFiles[change.filePath] = change.content || '';
                } else if (change.action === 'delete') {
                    delete updatedFiles[change.filePath];
                }
            });
            return {
                ...prev,
                files: updatedFiles,
                previewHtml: modification.previewHtml !== undefined ? modification.previewHtml : prev.previewHtml,
                chatMessages: [...prev.chatMessages, { role: 'system', content: `Self-correction applied: ${modification.reason}` }],
                hasGeneratedCode: true,
            };
        });
        setAiStatus(null);
        setConsoleLogs([]); // Clear logs after applying fix
      } else {
        throw new Error("AI did not return a code modification for the correction.");
      }
    } catch (e) {
        console.error("Self-correction failed:", e);
        setAiStatus('Failed to apply fix.');
    }
  }, [currentState, files, addHistoryState, setAiStatus]);

  useEffect(() => {
    if (consoleLogs.some(log => log.level === 'error') && !isVerifying) {
      setIsVerifying(true);
      const errors = consoleLogs.filter(log => log.level === 'error');
      // Use a timeout to allow multiple errors to be logged before triggering
      const timer = setTimeout(() => {
        triggerSelfCorrection(errors);
        setIsVerifying(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [consoleLogs, isVerifying, triggerSelfCorrection]);

  const handleSendMessage = useCallback(async (message: string, attachment: FileAttachment | null = null) => {
    const userMessage: Message = { role: 'user', content: message };
    addHistoryState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, userMessage] }));

    setAiStatus('MominAI is working...');
    setConsoleLogs([]);

    try {
        const response = await sendAiChatRequest([...chatMessages, userMessage], files, attachment);
        setAiStatus('Generating files...');
        
        if (response.responseType === 'MODIFY_CODE') {
            const { modification } = response;
            addHistoryState(prev => {
                const updatedFiles = { ...prev.files };
                modification.changes.forEach((change: Change) => {
                    if (change.action === 'create' || change.action === 'update') {
                        updatedFiles[change.filePath] = change.content || '';
                    } else if (change.action === 'delete') {
                        delete updatedFiles[change.filePath];
                    }
                });
                const newProjectName = modification.projectName || prev.projectName;

                return {
                    ...prev,
                    files: updatedFiles,
                    previewHtml: modification.previewHtml !== undefined ? modification.previewHtml : prev.previewHtml,
                    chatMessages: [...prev.chatMessages, { role: 'system', content: modification.reason }],
                    hasGeneratedCode: true,
                    projectName: newProjectName
                };
            });
            setStreamingContent(modification.reason);
        } else if (response.responseType === 'CHAT') {
             setStreamingContent(response.message);
        } else if (response.responseType === 'PROJECT_PLAN') {
            const { plan } = response;
            addHistoryState(prev => ({
                ...prev,
                projectPlan: plan,
                projectName: plan.projectName,
                chatMessages: [...prev.chatMessages, {
                  role: 'model',
                  content: "I've drafted a plan for your project. Take a look and let me know if you'd like any changes before I start building.",
                  action: 'AWAITING_PLAN_APPROVAL',
                  plan: plan,
                }]
            }));
        }

    } catch (e: any) {
        console.error("Error from AI:", e);
        const errorMessage = `An error occurred: ${e.message}`;
        setStreamingContent(errorMessage);
    } finally {
        setAiStatus(null);
    }
  }, [addHistoryState, chatMessages, files]);


  const handleCodeChange = useCallback((newContent: string) => {
    if (activeFile && files[activeFile] !== newContent) {
       addHistoryState(prev => ({
        ...prev,
        files: {
          ...prev.files,
          [activeFile]: newContent,
        }
       }));
    }
  }, [activeFile, files, addHistoryState]);

  const handleUndo = useCallback(() => {
    updateActiveProject(project => {
      if (project.history.currentIndex > 0) {
        return { ...project, history: { ...project.history, currentIndex: project.history.currentIndex - 1 } };
      }
      return project;
    });
  }, [updateActiveProject]);

  const handleRedo = useCallback(() => {
     updateActiveProject(project => {
      if (project.history.currentIndex < project.history.versions.length - 1) {
        return { ...project, history: { ...project.history, currentIndex: project.history.currentIndex + 1 } };
      }
      return project;
    });
  }, [updateActiveProject]);

  const handleRenameProject = useCallback((newName: string) => {
    addHistoryState(prev => ({ ...prev, projectName: newName }));
  }, [addHistoryState]);
  
  const handleDownloadProject = useCallback(() => {
    downloadProjectAsZip(files, projectName);
  }, [files, projectName]);

  const handleNewProject = useCallback(() => {
    setWorkspace(prev => {
        const newProj = createNewProject(`Project ${prev.projects.length + 1}`);
        return {
            ...prev,
            projects: [...prev.projects, newProj],
            activeProjectId: newProj.id,
        };
    });
  }, [setWorkspace]);

  const handleSelectProject = useCallback((id: string) => {
    setWorkspace(prev => ({ ...prev, activeProjectId: id }));
  }, [setWorkspace]);

  const handleDeleteProject = useCallback((id: string) => {
    setWorkspace(prev => {
        if (prev.projects.length <= 1) {
            alert("You cannot delete the last project.");
            return prev;
        }
        return {
            ...prev,
            projects: prev.projects.filter(p => p.id !== id),
            // activeProjectId will be reset by useEffect if it was the deleted one
        };
    });
  }, [setWorkspace]);

  if (isPreviewFullscreen) {
    return (
      <LivePreview
        htmlContent={previewHtml}
        isFullscreen={true}
        onExitFullscreen={() => setIsPreviewFullscreen(false)}
        logs={consoleLogs}
        onNewLog={(log) => setConsoleLogs(prev => [...prev, log])}
        onClearLogs={() => setConsoleLogs([])}
      />
    );
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
        
        <div
            className={`absolute top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            onMouseLeave={() => setSidebarOpen(false)}
        >
            <Sidebar
                projects={workspace.projects}
                activeProjectId={workspace.activeProjectId}
                onSelectProject={handleSelectProject}
                onNewProject={handleNewProject}
                onDeleteProject={handleDeleteProject}
            />
        </div>

        <button
            onMouseEnter={() => setSidebarOpen(true)}
            className={`fixed bottom-6 left-6 z-30 p-3 bg-white/40 backdrop-blur-md border border-black/10 rounded-full text-purple-600 hover:text-white hover:bg-purple-500 transition-all duration-300 ${isSidebarOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
            aria-label="Toggle Project Sidebar"
        >
            <Icon name="logo" className="w-6 h-6" />
        </button>

        <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out`} style={{ marginLeft: isSidebarOpen ? '16rem' : '0' }}>
            <Header
                projectName={projectName}
                onRenameProject={handleRenameProject}
                onDownloadProject={handleDownloadProject}
                onPublish={() => setPublishModalOpen(true)}
                mobileView={mobileView}
                isProjectLoaded={isProjectLoaded}
                onToggleView={() => setMobileView(v => v === 'chat' ? 'preview' : 'chat')}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
            />
            <div className="flex-grow p-1 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                <div className={`h-full ${mobileView === 'preview' ? 'hidden md:block' : ''}`}>
                  <ChatPanel
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      aiStatus={aiStatus}
                      streamingContent={streamingContent}
                      onAnimationComplete={handleAnimationComplete}
                      hasGeneratedCode={hasGeneratedCode}
                      onNavigateToPreview={() => setMobileView('preview')}
                  />
                </div>
                <div className={`h-full ${mobileView === 'chat' ? 'hidden md:block' : ''}`}>
                   <EditorPreviewPanel
                        files={files}
                        activeFile={activeFile}
                        onSelectFile={setActiveFile}
                        onCodeChange={handleCodeChange}
                        previewHtml={previewHtml}
                        onBackToChat={() => setMobileView('chat')}
                        onToggleFullscreen={() => setIsPreviewFullscreen(true)}
                        consoleLogs={consoleLogs}
                        onNewLog={(log) => setConsoleLogs(prev => [...prev, log])}
                        onClearConsole={() => setConsoleLogs([])}
                    />
                </div>
            </div>
        </main>
      
        {isPublishModalOpen && currentState && (
            <PublishModal
                projectName={projectName}
                files={files}
                onClose={() => setPublishModalOpen(false)}
            />
        )}
        {isCommandPaletteOpen && (
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
                files={files}
                onSelectFile={(path) => { setActiveFile(path); setCommandPaletteOpen(false); }}
                onDownloadProject={handleDownloadProject}
                onPublish={() => setPublishModalOpen(true)}
            />
        )}
    </div>
  );
};

export default App;