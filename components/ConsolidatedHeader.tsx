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
  const [expandedButton, setExpandedButton] = useState<string | null>(null);
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
          {/* Expanded View Toggle - Smooth panel-like animation */}
          <div
            className={`hidden md:flex items-center gap-1 p-1 rounded-xl transition-all duration-800 ${
              theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
            }`}
            style={{
              transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <button
              onClick={() => {
                onViewChange('preview');
                setExpandedButton(expandedButton === 'preview' ? null : 'preview');
              }}
              className={`relative group flex items-center px-2 py-1.5 text-sm rounded-lg overflow-hidden ${
                view === 'preview'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              style={{
                transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: 'center left'
              }}
            >
              <Icon
                name="eye"
                className="w-5 h-5 flex-shrink-0 transition-transform duration-500 group-hover:scale-110"
              />
              <span
                className={`ml-2 whitespace-nowrap transition-all duration-800 overflow-hidden ${
                  expandedButton === 'preview' || view === 'preview'
                    ? 'w-20 opacity-100 transform translate-x-0'
                    : 'w-0 opacity-0 transform -translate-x-2'
                }`}
                style={{
                  transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Preview
              </span>
            </button>
            <button
              onClick={() => {
                onViewChange('code');
                setExpandedButton(expandedButton === 'code' ? null : 'code');
              }}
              className={`relative group flex items-center px-2 py-1.5 text-sm rounded-lg overflow-hidden ${
                view === 'code'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              style={{
                transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: 'center left'
              }}
            >
              <Icon
                name="code"
                className="w-5 h-5 flex-shrink-0 transition-transform duration-500 group-hover:scale-110"
              />
              <span
                className={`ml-2 whitespace-nowrap transition-all duration-800 overflow-hidden ${
                  expandedButton === 'code' || view === 'code'
                    ? 'w-16 opacity-100 transform translate-x-0'
                    : 'w-0 opacity-0 transform -translate-x-2'
                }`}
                style={{
                  transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Code
              </span>
            </button>
            <button
              onClick={() => {
                onViewChange('database');
                setExpandedButton(expandedButton === 'database' ? null : 'database');
              }}
              className={`relative group flex items-center px-2 py-1.5 text-sm rounded-lg overflow-hidden ${
                view === 'database'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              style={{
                transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: 'center left'
              }}
            >
              <Icon
                name="database"
                className="w-5 h-5 text-gray-300 flex-shrink-0 transition-transform duration-500 group-hover:scale-110"
              />
              <span
                className={`ml-2 whitespace-nowrap transition-all duration-800 overflow-hidden ${
                  expandedButton === 'database' || view === 'database'
                    ? 'w-20 opacity-100 transform translate-x-0'
                    : 'w-0 opacity-0 transform -translate-x-2'
                }`}
                style={{
                  transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Database
              </span>
            </button>
            <button
              onClick={() => {
                onViewChange('visual-editor');
                setExpandedButton(expandedButton === 'visual-editor' ? null : 'visual-editor');
              }}
              className={`relative group flex items-center px-2 py-1.5 text-sm rounded-lg overflow-hidden ${
                view === 'visual-editor'
                  ? theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-white/20 text-white'
                  : theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              style={{
                transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                transformOrigin: 'center left'
              }}
            >
              <Icon
                name="edit"
                className="w-5 h-5 flex-shrink-0 transition-transform duration-500 group-hover:scale-110"
              />
              <span
                className={`ml-2 whitespace-nowrap transition-all duration-800 overflow-hidden ${
                  expandedButton === 'visual-editor' || view === 'visual-editor'
                    ? 'w-24 opacity-100 transform translate-x-0'
                    : 'w-0 opacity-0 transform -translate-x-2'
                }`}
                style={{
                  transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Visual Editor
              </span>
            </button>
          </div>

          {/* Device Selection - Only show in preview mode */}
          {view === 'preview' && (
            <div
              className={`hidden md:flex items-center gap-1 p-1 rounded-xl transition-all duration-600 ${
                theme === 'light' ? 'bg-gray-100' : 'bg-white/10'
              }`}
              style={{
                transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {deviceButtons.map(({ name, icon }) => (
                <button
                  key={name}
                  onClick={() => onDeviceChange(name)}
                  className={`relative group flex items-center px-2 py-1.5 rounded-lg overflow-hidden ${
                    device === name
                      ? theme === 'light'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-white/20 text-white'
                      : theme === 'light'
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  style={{
                    transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  aria-label={`Switch to ${name} view`}
                >
                  <Icon
                    name={icon}
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-400 group-hover:scale-110"
                  />
                  <span
                    className={`ml-1 whitespace-nowrap overflow-hidden ${
                      device === name
                        ? 'w-12 opacity-100 transform translate-x-0'
                        : 'w-0 opacity-0 transform -translate-x-1'
                    }`}
                    style={{
                      transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
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
        <div
          className="flex items-center gap-2"
          style={{
            transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Theme Toggle */}
          <button
            onClick={() => {
              toggleTheme();
              setExpandedButton(expandedButton === 'theme' ? null : 'theme');
            }}
            className={`relative group flex items-center px-2 py-2 rounded-lg overflow-hidden ${
              theme === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            style={{
              transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <Icon
              name={theme === 'light' ? 'moon' : 'sun'}
              className="w-4 h-4 flex-shrink-0 transition-transform duration-400 group-hover:scale-110"
            />
            <span
              className={`ml-1 whitespace-nowrap overflow-hidden ${
                expandedButton === 'theme'
                  ? 'w-12 opacity-100 transform translate-x-0'
                  : 'w-0 opacity-0 transform -translate-x-1'
              }`}
              style={{
                transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {theme === 'light' ? 'Dark' : 'Light'}
            </span>
          </button>

          {onCheckErrors && (
            <button
              onClick={() => {
                onCheckErrors();
                setExpandedButton(expandedButton === 'errors' ? null : 'errors');
              }}
              disabled={!isProjectLoaded}
              className={`relative group flex items-center px-2 py-2 rounded-lg overflow-hidden disabled:opacity-50 ${
                theme === 'light'
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              style={{
                transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              aria-label="Check for errors"
            >
              <Icon
                name="bug"
                className="w-4 h-4 flex-shrink-0 transition-transform duration-400 group-hover:scale-110"
              />
              <span
                className={`ml-1 whitespace-nowrap overflow-hidden ${
                  expandedButton === 'errors'
                    ? 'w-24 opacity-100 transform translate-x-0'
                    : 'w-0 opacity-0 transform -translate-x-1'
                }`}
                style={{
                  transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Check Errors
              </span>
            </button>
          )}

          <button
            onClick={() => {
              onSettings();
              setExpandedButton(expandedButton === 'settings' ? null : 'settings');
            }}
            disabled={!isProjectLoaded}
            className={`relative group flex items-center px-2 py-2 rounded-lg overflow-hidden disabled:opacity-50 ${
              theme === 'light'
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            style={{
              transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            aria-label="Settings"
          >
            <Icon
              name="settings"
              className="w-4 h-4 flex-shrink-0 transition-transform duration-400 group-hover:scale-110"
            />
            <span
              className={`ml-1 whitespace-nowrap overflow-hidden ${
                expandedButton === 'settings'
                  ? 'w-16 opacity-100 transform translate-x-0'
                  : 'w-0 opacity-0 transform -translate-x-1'
              }`}
              style={{
                transition: 'all 600ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
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