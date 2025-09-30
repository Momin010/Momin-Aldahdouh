import React, { useState } from 'react';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import LivePreview from './LivePreview';
import { Icon } from './Icon';
import type { Files, ConsoleMessage } from '../types';
import ResizablePanel from './ResizablePanel';

interface EditorPreviewPanelProps {
  files: Files;
  activeFile: string;
  onSelectFile: (path: string) => void;
  onCodeChange: (newContent: string) => void;
  previewHtml: string;
  onBackToChat: () => void; // For mobile view
  onToggleFullscreen: () => void;
  consoleLogs: ConsoleMessage[];
  onNewLog: (log: ConsoleMessage) => void;
  onClearConsole: () => void;
}

const EditorPreviewPanel: React.FC<EditorPreviewPanelProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCodeChange,
  previewHtml,
  onBackToChat,
  onToggleFullscreen,
  consoleLogs,
  onNewLog,
  onClearConsole,
}) => {
  const [view, setView] = useState<'code' | 'preview'>('preview');

  return (
    <div className="flex flex-col h-full bg-white/20 backdrop-blur-2xl md:border border-white/30 md:rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b border-black/10 flex-shrink-0">
        <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl">
          <button
            onClick={() => setView('code')}
            className={`flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition-colors ${
              view === 'code' ? 'bg-white/50 text-gray-800' : 'text-gray-600 hover:bg-black/5'
            }`}
            aria-pressed={view === 'code'}
          >
            <Icon name="code" className="w-4 h-4" /> Code
          </button>
          <button
            onClick={() => setView('preview')}
            className={`flex items-center gap-2 px-3 py-1 text-sm rounded-lg transition-colors ${
              view === 'preview' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:bg-black/5'
            }`}
            aria-pressed={view === 'preview'}
          >
            <Icon name="eye" className="w-4 h-4" /> Preview
          </button>
        </div>
        <button onClick={onToggleFullscreen} className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-black/10" aria-label="Toggle fullscreen">
          <Icon name="fullscreen" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow overflow-hidden relative">
        {view === 'preview' && (
          <LivePreview 
            htmlContent={previewHtml} 
            onToggleFullscreen={onToggleFullscreen}
            logs={consoleLogs}
            onNewLog={onNewLog}
            onClearLogs={onClearConsole}
          />
        )}
        {view === 'code' && (
           <ResizablePanel direction="horizontal" initialSize={250} minSize={150}>
            <FileExplorer files={files} activeFile={activeFile} onSelectFile={onSelectFile} />
            <CodeEditor
              filePath={activeFile}
              code={files[activeFile] || ''}
              onCodeChange={onCodeChange}
            />
          </ResizablePanel>
        )}
      </div>
    </div>
  );
};

export default EditorPreviewPanel;