
import React, { useState, useEffect } from 'react';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import LivePreview, { Device } from './LivePreview';
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
  device: Device;
  onDeviceChange: (device: Device) => void;
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
  device,
  onDeviceChange,
}) => {
  const [view, setView] = useState<'code' | 'preview'>('preview');
  
  const deviceButtons: { name: Device, icon: string }[] = [
    { name: 'desktop', icon: 'desktop' },
    { name: 'tablet', icon: 'tablet' },
    { name: 'mobile', icon: 'mobile' },
  ];

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-1.5 sm:p-2 border-b border-white/10 flex-shrink-0 gap-2">
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl">
          <button
            onClick={() => setView('code')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              view === 'code' ? 'bg-white/10' : 'text-gray-400 hover:bg-white/5'
            }`}
            aria-pressed={view === 'code'}
          >
            <Icon name="code" className="w-4 h-4" />
            <span className="hidden sm:inline">Code</span>
          </button>
          <button
            onClick={() => setView('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              view === 'preview' ? 'bg-purple-600' : 'text-gray-400 hover:bg-white/5'
            }`}
            aria-pressed={view === 'preview'}
          >
            <Icon name="eye" className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </button>
        </div>
        
        {view === 'preview' && (
           <div className='hidden sm:flex items-center gap-1 bg-black/20 p-1 rounded-xl'>
            {deviceButtons.map(({ name, icon }) => (
              <button
                key={name}
                onClick={() => onDeviceChange(name)}
                className={`p-1.5 rounded-lg transition-colors ${
                  device === name ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
                aria-label={`Switch to ${name} view`}
                aria-pressed={device === name}
              >
                <Icon name={icon} className="w-5 h-5" />
              </button>
            ))}
          </div>
        )}
        
        <div className="flex-1" />

        <button onClick={onToggleFullscreen} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" aria-label="Toggle fullscreen">
          <Icon name="fullscreen" className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow overflow-hidden relative">
        {view === 'preview' && (
          <LivePreview 
            htmlContent={previewHtml} 
            device={device}
            logs={consoleLogs}
            onNewLog={onNewLog}
            onClearLogs={onClearConsole}
          />
        )}
        {view === 'code' && (
          <div className="h-full w-full">
            {/* Desktop: Resizable horizontal panel */}
            <div className="hidden md:flex h-full">
              <ResizablePanel direction="horizontal" initialSize={250} minSize={150}>
                <FileExplorer files={files} activeFile={activeFile} onSelectFile={onSelectFile} />
                <CodeEditor
                  filePath={activeFile}
                  code={files[activeFile] || ''}
                  onCodeChange={onCodeChange}
                />
              </ResizablePanel>
            </div>
            {/* Mobile: Vertical stack */}
            <div className="md:hidden flex flex-col h-full">
              <div className="h-2/5 border-b border-white/10 overflow-hidden">
                <FileExplorer files={files} activeFile={activeFile} onSelectFile={onSelectFile} />
              </div>
              <div className="h-3/5">
                <CodeEditor
                  filePath={activeFile}
                  code={files[activeFile] || ''}
                  onCodeChange={onCodeChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPreviewPanel;
