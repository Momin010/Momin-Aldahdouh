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
  view: 'code' | 'preview' | 'database' | 'visual-editor';
  onViewChange: (view: 'code' | 'preview' | 'database' | 'visual-editor') => void;
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

        {/* Center - Expanded View toggle and device selection */}
        <div className="flex items-center gap-2">
          {/* Expanded View Toggle - Icons only, text on hover */}
          <div className={`hidden md:flex items-center gap-1 p-1 rounded-xl ${
            theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
          }`}>
            <button
              onClick={() => onViewChange('preview')}
              className={`relative group flex items-center justify-center px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                view === 'preview'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon name="eye" className="w-5 h-5" />
              <span className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
                view === 'preview' ? 'opacity-100' : ''
              }`}>
                Preview
              </span>
            </button>
            <button
              onClick={() => onViewChange('code')}
              className={`relative group flex items-center justify-center px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                view === 'code'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon name="code" className="w-5 h-5" />
              <span className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
                view === 'code' ? 'opacity-100' : ''
              }`}>
                Code
              </span>
            </button>
            <button
              onClick={() => onViewChange('database')}
              className={`relative group flex items-center justify-center px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                view === 'database'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon name="database" className="w-5 h-5 text-gray-300" />
              <span className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
                view === 'database' ? 'opacity-100' : ''
              }`}>
                Database
              </span>
            </button>
            <button
              onClick={() => onViewChange('visual-editor')}
              className={`relative group flex items-center justify-center px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                view === 'visual-editor'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon name="edit" className="w-5 h-5" />
              <span className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
                view === 'visual-editor' ? 'opacity-100' : ''
              }`}>
                Visual Editor
              </span>
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
                  className={`relative group p-1.5 rounded-lg transition-all duration-200 ${
                    device === name
                      ? theme === 'light'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-white/20 text-white'
                      : theme === 'light'
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  aria-label={`Switch to ${name} view`}
                >
                  <Icon name={icon} className="w-5 h-5" />
                  <span className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap ${
                    device === name ? 'opacity-100' : ''
                  }`}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </span>
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
            className={`relative group p-2 rounded-lg transition-all duration-200 ${
              theme === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <Icon name={theme === 'light' ? 'moon' : 'sun'} className="w-5 h-5" />
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              {theme === 'light' ? 'Dark' : 'Light'}
            </span>
          </button>

          {onCheckErrors && (
            <button
              onClick={onCheckErrors}
              disabled={!isProjectLoaded}
              className={`relative group p-2 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                theme === 'light'
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Check for errors"
            >
              <Icon name="bug" className="w-5 h-5" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Check Errors
              </span>
            </button>
          )}

          <button
            onClick={onSettings}
            disabled={!isProjectLoaded}
            className={`relative group p-2 rounded-lg transition-all duration-200 disabled:opacity-50 ${
              theme === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Settings"
          >
            <Icon name="settings" className="w-5 h-5" />
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Settings
            </span>
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