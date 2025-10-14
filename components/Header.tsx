import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  onDownloadProject: () => void;
  onPublish: () => void;
  onSettings: () => void;
  onCheckErrors?: () => void;
  mobileView: 'chat' | 'preview';
  isProjectLoaded: boolean;
  onToggleView: () => void;
  onToggleSidebar: () => void;
  onTemplateLibrary?: () => void;
  onVisualEditor?: () => void;
  onStylePresets?: () => void;
  onAIAgents?: () => void;
  onDeployment?: () => void;
  onDatabase?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  projectName,
  onRenameProject,
  onDownloadProject,
  onPublish,
  onSettings,
  onCheckErrors,
  mobileView,
  isProjectLoaded,
  onToggleView,
  onToggleSidebar,
  onTemplateLibrary,
  onVisualEditor,
  onStylePresets,
  onAIAgents,
  onDeployment,
  onDatabase
}) => {
  const [isRenaming, setRenaming] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onRenameProject(tempName.trim());
    }
    setRenaming(false);
  };
  
  return (
    <header className="flex items-center justify-between px-4 py-3 bg-transparent">
      {/* Left side - Project name and mobile menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg md:hidden text-gray-400 hover:text-white hover:bg-white/10"
          aria-label="Toggle sidebar"
        >
          <Icon name="menu" className="w-5 h-5" />
        </button>

        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleRenameSubmit}
              className="bg-white/10 text-white font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-white/20 text-sm"
            />
          </form>
        ) : (
          <h1
            onDoubleClick={() => setRenaming(true)}
            className="font-semibold text-white cursor-pointer hover:text-blue-400 transition-colors"
            title="Double-click to rename"
          >
            {projectName}
          </h1>
        )}
      </div>

      {/* Center - Main action buttons (like Bolt.new/Lovable) */}
      <div className="hidden md:flex items-center gap-1">
        {onTemplateLibrary && (
          <button
            onClick={onTemplateLibrary}
            className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            title="Template Library"
          >
            <Icon name="layout" className="w-4 h-4" />
            Templates
          </button>
        )}

        {onVisualEditor && (
          <button
            onClick={onVisualEditor}
            className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            title="Visual Editor"
          >
            <Icon name="edit" className="w-4 h-4" />
            Edit
          </button>
        )}

        {onStylePresets && (
          <button
            onClick={onStylePresets}
            className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            title="Style Presets"
          >
            <Icon name="palette" className="w-4 h-4" />
            Styles
          </button>
        )}

        {onAIAgents && (
          <button
            onClick={onAIAgents}
            className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            title="AI Agents"
          >
            <Icon name="bot" className="w-4 h-4" />
            Agents
          </button>
        )}

        {onDeployment && (
          <button
            onClick={onDeployment}
            className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            title="Deploy Project"
          >
            <Icon name="cloud" className="w-4 h-4" />
            Deploy
          </button>
        )}

        {onDatabase && (
          <button
            onClick={onDatabase}
            className="px-3 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
            title="Database Manager"
          >
            <Icon name="database" className="w-4 h-4" />
            Database
          </button>
        )}
      </div>

      {/* Right side - Settings and Publish */}
      <div className="flex items-center gap-2">
        {isProjectLoaded && (
          <div className="md:hidden">
            <button
              onClick={onToggleView}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              {mobileView === 'chat' ? (
                <>
                  <Icon name="eye" className="w-4 h-4" />
                  Preview
                </>
              ) : (
                <>
                  <Icon name="message-circle" className="w-4 h-4" />
                  Chat
                </>
              )}
            </button>
          </div>
        )}

        <button
          onClick={onSettings}
          disabled={!isProjectLoaded}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:text-gray-600"
          aria-label="Settings"
        >
          <Icon name="settings" className="w-5 h-5" />
        </button>

        <button
          onClick={onPublish}
          disabled={!isProjectLoaded}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Publish
        </button>
      </div>
    </header>
  );
};

export default Header;