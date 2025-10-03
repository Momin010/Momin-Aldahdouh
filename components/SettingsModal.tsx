import React, { useState } from 'react';
import { Icon } from './Icon';
import type { User, Project } from '../types';

interface SettingsModalProps {
  user: User | null;
  project: Project;
  onClose: () => void;
  onRestoreVersion: (versionIndex: number) => void;
}

type SettingsTab = 'account' | 'versions' | 'backups';

const SettingsModal: React.FC<SettingsModalProps> = ({ user, project, onClose, onRestoreVersion }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

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

  const renderBackupsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Backup & Storage</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Local Storage</span>
              <span className="text-sm text-green-400">Active</span>
            </div>
            <p className="text-sm text-gray-400">
              Your project is automatically saved to your browser's local storage.
            </p>
          </div>
          
          {user ? (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">Cloud Backup</span>
                <span className="text-sm text-green-400">Enabled</span>
              </div>
              <p className="text-sm text-gray-400">
                Your projects are backed up to our secure cloud storage.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-600">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-yellow-300">Cloud Backup</span>
                <span className="text-sm text-yellow-400">Unavailable</span>
              </div>
              <p className="text-sm text-yellow-200">
                Sign up for an account to enable cloud backup and sync across devices.
              </p>
            </div>
          )}
          
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Export Options</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Download your project files as a ZIP archive.
            </p>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors">
              Download Project
            </button>
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
          <div className="w-48 border-r border-gray-700">
            <nav className="p-4 space-y-1">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'account'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="user" className="w-4 h-4 inline mr-2" />
                Account
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'versions'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="history" className="w-4 h-4 inline mr-2" />
                Versions
              </button>
              <button
                onClick={() => setActiveTab('backups')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'backups'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="download" className="w-4 h-4 inline mr-2" />
                Backups
              </button>
            </nav>
          </div>

          <div className="flex-1 p-6">
            {activeTab === 'account' && renderAccountTab()}
            {activeTab === 'versions' && renderVersionsTab()}
            {activeTab === 'backups' && renderBackupsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;