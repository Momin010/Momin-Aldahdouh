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
  standaloneHtml: string;
  onBackToChat: () => void; // For mobile view
  onToggleFullscreen: () => void;
  consoleLogs: ConsoleMessage[];
  onNewLog: (log: ConsoleMessage) => void;
  onClearConsole: () => void;
  device: Device;
  onDeviceChange: (device: Device) => void;
  view: 'code' | 'preview';
}

const EditorPreviewPanel: React.FC<EditorPreviewPanelProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCodeChange,
  previewHtml,
  standaloneHtml,
  onBackToChat,
  onToggleFullscreen,
  consoleLogs,
  onNewLog,
  onClearConsole,
  device,
  onDeviceChange,
  view,
}) => {
  
  const deviceButtons: { name: Device, icon: string }[] = [
    { name: 'desktop', icon: 'desktop' },
    { name: 'tablet', icon: 'tablet' },
    { name: 'mobile', icon: 'mobile' },
  ];
  
  const displayHtml = standaloneHtml || previewHtml;

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
      <div className="flex-grow overflow-auto relative">
        {view === 'preview' && (
          <LivePreview 
            htmlContent={displayHtml} 
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