import React, { useState, useEffect, useRef } from 'react';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import LivePreview, { Device } from './LivePreview';
import VisualEditor from './VisualEditor';
import PreviewVisualEditor from './PreviewVisualEditor';
import { Icon } from './Icon';
import type { Files, ConsoleMessage, PreviewChange } from '../types';
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
   view: 'code' | 'preview' | 'database' | 'visual-editor';
   currentView: 'code' | 'preview' | 'database' | 'visual-editor';
   onDatabaseAction?: (action: string) => void;
   onVisualEditorChange?: (content: string) => void;
   isVisualEditMode?: boolean;
   onVisualEditModeChange?: (mode: boolean) => void;
   onPreviewEdit?: (change: PreviewChange) => void;
   isVisualEditorEnabled?: boolean;
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
  currentView,
  onDatabaseAction,
  onVisualEditorChange,
  isVisualEditMode,
  onVisualEditModeChange,
  onPreviewEdit,
  isVisualEditorEnabled,
}) => {

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const deviceButtons: { name: Device, icon: string }[] = [
    { name: 'desktop', icon: 'desktop' },
    { name: 'tablet', icon: 'tablet' },
    { name: 'mobile', icon: 'mobile' },
  ];

  const displayHtml = standaloneHtml || previewHtml;

  // Show placeholder only when there's no content to display in preview mode
  if (!displayHtml && view === 'preview') {
    return (
      <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
        <div className="flex-grow flex items-center justify-center text-white">
          <div className="text-center">
            <Icon name="eye" className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Live Preview</h3>
            <p className="text-gray-400">Your generated project preview will appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  // Database View Content
  if (view === 'database') {
    return (
      <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
        <div className="flex-grow p-6 overflow-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Database Manager</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => onDatabaseAction && onDatabaseAction('create')}
                className="p-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                Create Database
              </button>
              <button
                onClick={() => onDatabaseAction && onDatabaseAction('schema')}
                className="p-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Generate Schema
              </button>
              <button
                onClick={() => onDatabaseAction && onDatabaseAction('export')}
                className="p-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                Export Data
              </button>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm">
                Database management features will be displayed here.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Visual Editor View Content
  if (view === 'visual-editor') {
    return (
      <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
        <div className="flex-grow overflow-hidden">
          <VisualEditor
            htmlContent={standaloneHtml || previewHtml || ''}
            onContentChange={onVisualEditorChange || (() => {})}
            isEditMode={isVisualEditMode || false}
            onEditModeChange={onVisualEditModeChange || (() => {})}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
      <div className="flex-grow overflow-auto relative">
        {view === 'preview' && (
          <>
            <LivePreview
              ref={previewIframeRef}
              htmlContent={displayHtml}
              device={device}
              logs={consoleLogs}
              onNewLog={onNewLog}
              onClearLogs={onClearConsole}
              isVisualEditorEnabled={isVisualEditorEnabled}
            />
            <PreviewVisualEditor
              htmlContent={displayHtml}
              onPreviewEdit={onPreviewEdit || (() => {})}
              isEnabled={isVisualEditorEnabled}
              iframeRef={previewIframeRef}
            />
          </>
        )}
        {view === 'preview' && (
          <PreviewVisualEditor
            htmlContent={displayHtml}
            onPreviewEdit={onPreviewEdit || (() => {})}
            isEnabled={isVisualEditorEnabled}
            iframeRef={previewIframeRef}
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