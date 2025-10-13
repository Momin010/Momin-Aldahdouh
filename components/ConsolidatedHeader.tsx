import React, { useState } from 'react';
import { Icon } from './Icon';
import { useTheme } from '../lib/themeContext';
import ProjectActionsModal from './ProjectActionsModal';

interface ConsolidatedHeaderProps {
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
  device: 'desktop' | 'tablet' | 'mobile';
  onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void;
  view: 'code' | 'preview';
  onViewChange: (view: 'code' | 'preview') => void;
  onToggleFullscreen: () => void;
  userEmail?: string;
}

const ConsolidatedHeader: React.FC<ConsolidatedHeaderProps> = ({
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
  onDatabase,
  device,
  onDeviceChange,
  view,
  onViewChange,
  onToggleFullscreen,
  userEmail
}) => {
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const deviceButtons = [
    { name: 'desktop' as const, icon: 'desktop' },
    { name: 'tablet' as const, icon: 'tablet' },
    { name: 'mobile' as const, icon: 'mobile' },
  ];

  return (
    <>
      <header className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl ${
        theme === 'light'
          ? 'bg-white/80 border-gray-200'
          : 'bg-black/80 border-white/10'
      }`}>
        {/* Left side - Project name and mobile menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={`p-2 rounded-lg md:hidden transition-colors ${
              theme === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Toggle sidebar"
          >
            <Icon name="menu" className="w-5 h-5" />
          </button>

          <button
            onClick={() => setProjectModalOpen(true)}
            className={`font-semibold transition-colors ${
              theme === 'light'
                ? 'text-gray-900 hover:text-blue-600'
                : 'text-white hover:text-blue-400'
            }`}
          >
            {projectName}
          </button>
        </div>

        {/* Center - View toggle and device selection */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className={`hidden md:flex items-center gap-1 p-1 rounded-xl ${
            theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
          }`}>
            <button
              onClick={() => onViewChange('code')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                view === 'code'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon name="code" className="w-4 h-4" />
              <span className="hidden lg:inline">Code</span>
            </button>
            <button
              onClick={() => onViewChange('preview')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                view === 'preview'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900'
                    : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon name="eye" className="w-4 h-4" />
              <span className="hidden lg:inline">Preview</span>
            </button>
          </div>

          {/* Device Selection - Only show in preview mode */}
          {view === 'preview' && (
            <div className={`hidden md:flex items-center gap-1 p-1 rounded-xl ${
              theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
            }`}>
              {deviceButtons.map(({ name, icon }) => (
                <button
                  key={name}
                  onClick={() => onDeviceChange(name)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    device === name
                      ? theme === 'light'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-white/20 text-white'
                      : theme === 'light'
                        ? 'text-gray-600 hover:text-gray-900'
                        : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label={`Switch to ${name} view`}
                >
                  <Icon name={icon} className="w-5 h-5" />
                </button>
              ))}
            </div>
          )}

          {/* Mobile View Toggle */}
          {isProjectLoaded && (
            <div className="md:hidden">
              <button
                onClick={onToggleView}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {mobileView === 'chat' ? 'Preview' : 'Chat'}
              </button>
            </div>
          )}
        </div>

        {/* Right side - Theme toggle, settings and publish */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} className="w-5 h-5" />
          </button>

          {onCheckErrors && (
            <button
              onClick={onCheckErrors}
              disabled={!isProjectLoaded}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                theme === 'light'
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Check for errors"
            >
              <Icon name="bug" className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onSettings}
            disabled={!isProjectLoaded}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              theme === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Settings"
          >
            <Icon name="settings" className="w-5 h-5" />
          </button>

          <button
            onClick={onPublish}
            disabled={!isProjectLoaded}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
              theme === 'light'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Publish
          </button>
        </div>
      </header>

      <ProjectActionsModal
        isOpen={isProjectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        projectName={projectName}
        onRenameProject={onRenameProject}
        onDownloadProject={onDownloadProject}
        userEmail={userEmail}
      />
    </>
  );
};

export default ConsolidatedHeader;