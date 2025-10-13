import React, { useState } from 'react';
import { Icon } from './Icon';
import type { User, Project } from '../types';

interface SettingsModalProps {
  user: User | null;
  project: Project;
  onClose: () => void;
  onRestoreVersion: (versionIndex: number) => void;
  onDownloadProject: () => void;
}

type SettingsTab = 'project' | 'agents' | 'versions' | 'database';

const SettingsModal: React.FC<SettingsModalProps> = ({ user, project, onClose, onRestoreVersion, onDownloadProject }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('project');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderAccountTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300">
              {user?.email || 'Guest User'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
            <div className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300">
              {user ? 'Registered User' : 'Guest (Temporary Session)'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVersionsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Version History</h3>
        <p className="text-sm text-gray-400 mb-4">
          Click on any version to restore your project to that state.
        </p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {project.history.versions.map((version, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                index === project.history.currentIndex
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => onRestoreVersion(index)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    Version {index + 1}
                    {index === project.history.currentIndex && (
                      <span className="ml-2 text-xs bg-purple-600 px-2 py-1 rounded">Current</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {version.projectName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Object.keys(version.files).length} files • {version.chatMessages.length} messages
                  </div>
                </div>
                <Icon name="history" className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProjectTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Project General Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project name</label>
            <input
              type="text"
              defaultValue={project.projectName}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">
              Save
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Agent</label>
            <div className="space-y-2">
              <button className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-left flex items-center gap-2">
                <Icon name="bot" className="w-4 h-4" />
                Claude Agent
              </button>
              <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-left flex items-center gap-2 opacity-50">
                <Icon name="code" className="w-4 h-4" />
                Codex
                <span className="text-xs bg-yellow-600 px-2 py-1 rounded ml-auto">COMING SOON</span>
              </button>
              <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-left flex items-center gap-2">
                <Icon name="zap" className="w-4 h-4" />
                v1 Agent (Legacy)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Context</label>
            <p className="text-sm text-gray-400 mb-2">
              Free up context. This is useful when a part of your app is completed and you want to work on a new one.
            </p>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded">
              Clear context
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Project Visibility</label>
            <div className="grid grid-cols-3 gap-2">
              <button className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-center">
                <Icon name="lock" className="w-5 h-5 mx-auto mb-1" />
                Private
                <div className="text-xs text-gray-400">Only owner can access</div>
              </button>
              <button className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-center">
                <Icon name="link" className="w-5 h-5 mx-auto mb-1" />
                Secret
                <div className="text-xs text-gray-400">Accessible via shared URL</div>
              </button>
              <button className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-center">
                <Icon name="globe" className="w-5 h-5 mx-auto mb-1" />
                Public
                <div className="text-xs text-gray-400">Everyone can view</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAgentsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">AI Agents</h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Creator Agent</span>
              <span className="text-sm text-green-400">Active</span>
            </div>
            <p className="text-sm text-gray-400">
              Specialized in building new features and applications from scratch
            </p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Debugger Agent</span>
              <span className="text-sm text-green-400">Active</span>
            </div>
            <p className="text-sm text-gray-400">
              Expert at finding and fixing bugs, errors, and performance issues
            </p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Optimizer Agent</span>
              <span className="text-sm text-green-400">Active</span>
            </div>
            <p className="text-sm text-gray-400">
              Focuses on improving code quality, performance, and maintainability
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabaseTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Database</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Database Status</span>
              <span className="text-sm text-green-400">Connected</span>
            </div>
            <p className="text-sm text-gray-400">
              Database, storage, authentication, and backend logic—all ready to use.
            </p>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Add an LLM to your app</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Powerful AI models with zero setup. Add chat, image generation, and text analysis instantly.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
              Enable AI Features
            </button>
          </div>

          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Free to start, pay as you scale</span>
            </div>
            <p className="text-sm text-gray-400">
              Free usage included everywhere. Top up on paid plans. Track usage in Settings → Usage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex">
          <div className="w-64 border-r border-gray-700 bg-gray-800/50">
            <nav className="p-4 space-y-1">
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Project Settings</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab('project')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'project'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon name="settings" className="w-4 h-4" />
                    General
                  </button>
                  <button
                    onClick={() => setActiveTab('database')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'database'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon name="database" className="w-4 h-4" />
                    Database
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AI & Tools</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab('agents')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'agents'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon name="bot" className="w-4 h-4" />
                    AI Agents
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">History</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab('versions')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      activeTab === 'versions'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon name="history" className="w-4 h-4" />
                    Versions
                  </button>
                </div>
              </div>
            </nav>
          </div>

          <div className="flex-1 p-6 bg-gray-900">
            {activeTab === 'project' && renderProjectTab()}
            {activeTab === 'agents' && renderAgentsTab()}
            {activeTab === 'versions' && renderVersionsTab()}
            {activeTab === 'database' && renderDatabaseTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;