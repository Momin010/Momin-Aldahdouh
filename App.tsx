import React, { useState, useCallback, useEffect } from 'react';
import ChatPanel from './components/ChatPanel';
import Header from './components/Header';
import EditorPreviewPanel from './components/EditorPreviewPanel';
import PublishModal from './components/PublishModal';
import CommandPalette from './components/CommandPalette';
import LivePreview from './components/LivePreview';
import type { Message, Files, Change, FileAttachment, History, AppState } from './types';
import { sendAiChatRequest, resetChat } from './services/geminiService';
import { downloadProjectAsZip } from './services/zipService';
import { INITIAL_CHAT_MESSAGE, INITIAL_FILES } from './constants';
import usePersistentState from './hooks/usePersistentState';

type MobileView = 'chat' | 'preview';

const INITIAL_APP_STATE: AppState = {
  files: INITIAL_FILES,
  previewHtml: '',
  chatMessages: [INITIAL_CHAT_MESSAGE],
  hasGeneratedCode: false,
  projectName: 'Untitled Project',
};

const INITIAL_HISTORY: History = {
  versions: [INITIAL_APP_STATE],
  currentIndex: 0,
};


const App: React.FC = () => {
  const [history, setHistory] = usePersistentState<History>('mominai_history', INITIAL_HISTORY);
  const [activeFile, setActiveFile] = usePersistentState<string>('mominai_activeFile', '');
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('chat');
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  const currentState = history.versions[history.currentIndex];
  const { files, previewHtml, chatMessages, hasGeneratedCode, projectName } = currentState;
  
  const isProjectLoaded = Object.keys(files).length > 0;
  const canUndo = history.currentIndex > 0;
  const canRedo = history.currentIndex < history.versions.length - 1;

  useEffect(() => {
    resetChat();
  }, []);
  
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
    if (activeFile && !files.hasOwnProperty(activeFile)) {
      setActiveFile(Object.keys(files)[0] || '');
    } else if (!activeFile && Object.keys(files).length > 0) {
      const preferredFiles = ['src/App.tsx', 'src/pages/Home.tsx', 'index.html', 'package.json'];
      const defaultFile = preferredFiles.find(f => f in files) || Object.keys(files)[0];
      setActiveFile(defaultFile);
    }
  }, [files, activeFile, setActiveFile]);

  const addHistoryState = useCallback((updater: (prevState: AppState) => AppState) => {
    setHistory(prevHistory => {
        const currentVersion = prevHistory.versions[prevHistory.currentIndex];
        const newVersion = updater(currentVersion);
        
        const newVersions = prevHistory.versions.slice(0, prevHistory.currentIndex + 1);
        newVersions.push(newVersion);

        return {
            versions: newVersions,
            currentIndex: newVersions.length - 1,
        };
    });
  }, [setHistory]);

  const handleSendMessage = useCallback(async (message: string, attachment?: FileAttachment) => {
    const userMessage: Message = { role: 'user', content: message };
    
    // Add user message to a temporary chat state for immediate feedback
    // but the permanent update happens in addHistoryState
    const tempChatMessages = [...chatMessages, userMessage];
    setHistory(h => ({ ...h, versions: h.versions.map((v, i) => i === h.currentIndex ? {...v, chatMessages: tempChatMessages } : v) }));

    try {
      setAiStatus('MominAI is thinking...');
      const response = await sendAiChatRequest(tempChatMessages, hasGeneratedCode ? files : null, attachment);

      switch (response.responseType) {
        case 'CHAT': {
          addHistoryState(prev => ({
            ...prev,
            chatMessages: [...prev.chatMessages, { role: 'model', content: response.message }]
          }));
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
            
            const isFirstGeneration = !prev.hasGeneratedCode;
            const activeFileDeleted = modification.changes.some(c => c.action === 'delete' && c.filePath === activeFile);
            if (isFirstGeneration || activeFileDeleted) {
               const preferredFiles = ['src/App.tsx', 'index.html'];
               const defaultFile = preferredFiles.find(f => f in updatedFiles) || Object.keys(updatedFiles)[0] || '';
               setActiveFile(defaultFile);
            }
          
            setMobileView('preview');

            return {
              ...prev,
              files: updatedFiles,
              previewHtml: modification.previewHtml || prev.previewHtml,
              chatMessages: [...prev.chatMessages, modificationMessage],
              hasGeneratedCode: true,
              projectName: modification.projectName || prev.projectName,
            };
          });
          break;
        }
      }
    } catch (error) {
      console.error('Error in AI interaction:', error);
      const errorMessage: Message = { role: 'model', content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}` };
      addHistoryState(prev => ({...prev, chatMessages: [...prev.chatMessages, errorMessage] }));
    } finally {
      setAiStatus(null);
    }
  }, [chatMessages, files, hasGeneratedCode, activeFile, addHistoryState, setHistory, setActiveFile]);


  const handleCodeChange = useCallback((newContent: string) => {
    setHistory(prevHistory => {
        const newVersions = [...prevHistory.versions];
        const currentVersion = { ...newVersions[prevHistory.currentIndex] };
        currentVersion.files = { ...currentVersion.files, [activeFile]: newContent };
        newVersions[prevHistory.currentIndex] = currentVersion;
        return { ...prevHistory, versions: newVersions };
    });
  }, [activeFile, setHistory]);

  const handleRenameProject = useCallback((newName: string) => {
    setHistory(prevHistory => {
        const newVersions = [...prevHistory.versions];
        const currentVersion = { ...newVersions[prevHistory.currentIndex] };
        currentVersion.projectName = newName;
        newVersions[prevHistory.currentIndex] = currentVersion;
        return { ...prevHistory, versions: newVersions };
    });
  }, [setHistory]);

  const handleDownloadProject = async () => {
    if (Object.keys(files).length > 0) {
      await downloadProjectAsZip(files, projectName);
    }
  };

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistory(prev => ({ ...prev, currentIndex: prev.currentIndex - 1 }));
    }
  }, [canUndo, setHistory]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistory(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    }
  }, [canRedo, setHistory]);

  const handleSelectFileFromPalette = (path: string) => {
    setActiveFile(path);
    // Potentially switch to code view if not already there
  };

  const handleToggleFullscreen = useCallback(() => {
    setIsPreviewFullscreen(prev => !prev);
  }, []);

  if (isPreviewFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        <LivePreview
          htmlContent={previewHtml}
          isFullscreen={true}
          onExitFullscreen={handleToggleFullscreen}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent text-gray-200 font-sans">
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
      <main className="flex flex-grow p-0 md:p-4 gap-4 overflow-hidden flex-col md:flex-row">
        <div className={`
          ${mobileView === 'preview' ? 'hidden' : 'flex'}
          md:flex flex-col w-full md:w-1/3 md:max-w-lg h-full
        `}>
          <ChatPanel messages={chatMessages} onSendMessage={handleSendMessage} aiStatus={aiStatus} />
        </div>

        <div className={`
          ${mobileView === 'chat' ? 'hidden' : 'flex'}
          md:flex flex-col flex-grow h-full
        `}>
          <EditorPreviewPanel
            files={files}
            activeFile={activeFile}
            onSelectFile={setActiveFile}
            onCodeChange={handleCodeChange}
            previewHtml={previewHtml}
            onBackToChat={() => setMobileView('chat')}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </div>
      </main>
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
