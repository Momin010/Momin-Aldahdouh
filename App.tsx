import React, { useState, useCallback, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import Header from './components/Header';
import EditorPreviewPanel from './components/EditorPreviewPanel';
import PublishModal from './components/PublishModal';
import CommandPalette from './components/CommandPalette';
import LivePreview from './components/LivePreview';
import ResizablePanel from './components/ResizablePanel';
import Sidebar from './components/Sidebar';
import { Icon } from './components/Icon';
import type { Message, Files, Change, FileAttachment, History, AppState, ConsoleMessage, Plan, Workspace, Project } from './types';
import { sendAiChatRequest, resetChat } from './services/geminiService';
import { downloadProjectAsZip } from './services/zipService';
import { INITIAL_CHAT_MESSAGE, INITIAL_FILES } from './constants';
import usePersistentState from './hooks/usePersistentState';


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
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

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
  
  const isProjectLoaded = activeProject && Object.keys(files).length > 0;
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


  const handleSendMessage = useCallback(async (message: string, attachment?: FileAttachment) => {
    if (!currentState) return;

    const userMessage: Message = { role: 'user', content: message };
    
    addHistoryState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages.map(msg => 
            msg.action === 'AWAITING_PLAN_APPROVAL' 
            ? { ...msg, action: undefined } 
            : msg
        ), userMessage]
    }));

    setStreamingContent(null);
    setAiStatus('MominAI is working...');
    setIsVerifying(false);

    try {
      const messagesForAI = [...currentState.chatMessages, userMessage];

      const response = await sendAiChatRequest(
        messagesForAI,
        hasGeneratedCode ? files : null, 
        attachment
      );
      
      setAiStatus(null);

      switch (response.responseType) {
        case 'CHAT': {
          setStreamingContent(response.message);
          break;
        }
        case 'PROJECT_PLAN': {
          const { plan } = response;
          const planContent = `I've drafted a plan for your project, **${plan.projectName}**. Please review it below.`;
          const planMessage: Message = {
            role: 'model',
            content: planContent,
            plan: plan,
            action: 'AWAITING_PLAN_APPROVAL'
          };
          addHistoryState(prev => ({
            ...prev,
            projectPlan: plan,
            chatMessages: [...prev.chatMessages, planMessage]
          }));
          setAiStatus("Awaiting your approval...");
          break;
        }
        case 'MODIFY_CODE': {
          setAiStatus('Generating files...');
          const { modification } = response;
          
          addHistoryState(prev => {
            const updatedFiles = prev.hasGeneratedCode ? { ...prev.files } : {};
            modification.changes.forEach((change: Change) => {
              if (change.action === 'delete') {
                delete updatedFiles[change.filePath];
              } else { 
                updatedFiles[change.filePath] = change.content || '';
              }
            });

            const modificationMessage: Message = { role: 'model', content: modification.reason };
            const gotoPreviewMessage: Message = { role: 'system', content: 'Go to Preview', action: 'GOTO_PREVIEW' };
            
            const isFirstGeneration = !prev.hasGeneratedCode;
            const activeFileDeleted = modification.changes.some(c => c.action === 'delete' && c.filePath === activeFile);
            if (isFirstGeneration || activeFileDeleted) {
               const preferredFiles = ['src/App.tsx', 'index.html'];
               const defaultFile = preferredFiles.find(f => f in updatedFiles) || Object.keys(updatedFiles)[0] || '';
               setActiveFile(defaultFile);
            }
          
            return {
              ...prev,
              files: updatedFiles,
              previewHtml: modification.previewHtml || prev.previewHtml,
              chatMessages: [...prev.chatMessages, modificationMessage, gotoPreviewMessage],
              hasGeneratedCode: true,
              projectName: modification.projectName || prev.projectName,
              projectPlan: null,
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
      const errorMessage: Message = { role: 'model', content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}` };
      addHistoryState(prev => ({...prev, chatMessages: [...prev.chatMessages, errorMessage], projectPlan: null }));
      setAiStatus(null);
      setStreamingContent(null);
    }
  }, [currentState, files, hasGeneratedCode, activeFile, addHistoryState, setActiveFile]);


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
  }, [setWorkspace]);

  const handleNewProject = useCallback(() => {
    const newProj = createNewProject('New Project');
    setWorkspace(ws => ({
      projects: [...ws.projects, newProj],
      activeProjectId: newProj.id,
    }));
  }, [setWorkspace]);

  const handleDeleteProject = useCallback((id: string) => {
    setWorkspace(ws => {
      const newProjects = ws.projects.filter(p => p.id !== id);
      // If we deleted the active project, select another one
      if (ws.activeProjectId === id) {
        return {
          projects: newProjects,
          activeProjectId: newProjects[0]?.id || null,
        };
      }
      return { ...ws, projects: newProjects };
    });
  }, [setWorkspace]);

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
     return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Loading Workspace...</div>;
  }

  return (
    <div className="h-screen bg-transparent text-gray-200 font-sans">
       <div
        className="fixed top-0 left-0 h-full z-40"
        onMouseLeave={() => setIsSidebarVisible(false)}
      >
        <div
          className={`h-full transition-transform duration-300 ease-in-out ${
            isSidebarVisible ? 'translate-x-0' : '-translate-x-full'
          }`}
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
          onMouseEnter={() => setIsSidebarVisible(true)}
          className={`absolute bottom-4 left-4 p-2 rounded-full bg-purple-600/80 backdrop-blur-sm text-white shadow-lg border border-white/20 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
            isSidebarVisible ? 'opacity-0 pointer-events-none' : 'opacity-80 hover:opacity-100'
          }`}
          aria-label="Show sidebar"
        >
          <Icon name="logo" className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex flex-col h-full overflow-hidden">
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
        />
        
        <main className="hidden md:flex flex-grow p-4 gap-4 overflow-hidden">
          <ResizablePanel direction="horizontal" initialSize={450} minSize={320}>
            <ChatPanel 
              messages={chatMessages} 
              onSendMessage={handleSendMessage} 
              aiStatus={aiStatus}
              streamingContent={streamingContent}
              onAnimationComplete={handleAnimationComplete}
              hasGeneratedCode={hasGeneratedCode}
              onNavigateToPreview={handleNavigateToPreview}
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
              streamingContent={streamingContent}
              onAnimationComplete={handleAnimationComplete}
              hasGeneratedCode={hasGeneratedCode}
              onNavigateToPreview={handleNavigateToPreview}
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
    </div>
  );
};

export default App;