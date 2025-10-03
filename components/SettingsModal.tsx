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

type SettingsTab = 'account' | 'versions' | 'backups' | 'notifications' | 'security' | 'themes' | 'api' | 'language' | 'data' | 'about';

const SettingsModal: React.FC<SettingsModalProps> = ({ user, project, onClose, onRestoreVersion, onDownloadProject }) => {
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
                <Icon name="history" className="w-4 h-4 text-gray-400" />
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
            <button 
              onClick={onDownloadProject}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Download Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Notification Preferences</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-600">
          <div>
            <span className="font-medium text-white">Build Notifications</span>
            <p className="text-sm text-gray-400">Get notified when builds complete</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded" />
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-600">
          <div>
            <span className="font-medium text-white">Error Alerts</span>
            <p className="text-sm text-gray-400">Alert when errors occur</p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded" />
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-600">
          <div>
            <span className="font-medium text-white">Project Updates</span>
            <p className="text-sm text-gray-400">Notifications for project changes</p>
          </div>
          <input type="checkbox" className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded" />
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="font-medium text-white">Two-Factor Authentication</span>
          <p className="text-sm text-gray-400 mb-3">Add an extra layer of security</p>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors">
            Enable 2FA
          </button>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="font-medium text-white">Session Management</span>
          <p className="text-sm text-gray-400 mb-3">Manage active sessions</p>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors">
            Sign Out All Devices
          </button>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="font-medium text-white">Privacy Mode</span>
          <p className="text-sm text-gray-400 mb-3">Hide sensitive information</p>
          <input type="checkbox" className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded" />
        </div>
      </div>
    </div>
  );

  const renderThemesTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="font-medium text-white mb-3 block">Theme</span>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-900 border-2 border-purple-500 rounded-lg cursor-pointer">
              <div className="w-full h-8 bg-gray-800 rounded mb-2"></div>
              <span className="text-xs text-white">Dark</span>
            </div>
            <div className="p-3 bg-white border-2 border-gray-600 rounded-lg cursor-pointer">
              <div className="w-full h-8 bg-gray-200 rounded mb-2"></div>
              <span className="text-xs text-gray-800">Light</span>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-900 to-blue-900 border-2 border-gray-600 rounded-lg cursor-pointer">
              <div className="w-full h-8 bg-purple-800 rounded mb-2"></div>
              <span className="text-xs text-white">Cosmic</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="font-medium text-white">Font Size</span>
          <input type="range" min="12" max="18" defaultValue="14" className="w-full mt-2" />
        </div>
      </div>
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">API Configuration</h3>
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <label className="block text-sm font-medium text-gray-300 mb-2">Gemini API Key</label>
          <div className="flex gap-2">
            <input type="password" placeholder="Enter your API key" className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors">
              Save
            </button>
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="font-medium text-white">API Usage</span>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Requests this month</span>
              <span className="text-white">1,247 / 10,000</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{width: '12.47%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLanguageTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Language & Region</h3>
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <label className="block text-sm font-medium text-gray-300 mb-2">Interface Language</label>
          <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Japanese</option>
          </select>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <label className="block text-sm font-medium text-gray-300 mb-2">Time Zone</label>
          <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
            <option>UTC-8 (Pacific)</option>
            <option>UTC-5 (Eastern)</option>
            <option>UTC+0 (GMT)</option>
            <option>UTC+1 (CET)</option>
            <option>UTC+9 (JST)</option>
          </select>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
          <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="font-medium text-white">Storage Usage</span>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Projects</span>
              <span className="text-white">2.4 MB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Chat History</span>
              <span className="text-white">1.8 MB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Used</span>
              <span className="text-white">4.2 MB / 100 MB</span>
            </div>
          </div>
        </div>
        <div className="p-4 bg-red-900/20 rounded-lg border border-red-600">
          <span className="font-medium text-red-300">Danger Zone</span>
          <p className="text-sm text-red-200 mb-3">These actions cannot be undone</p>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors">
              Clear All Chat History
            </button>
            <button className="w-full px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
              Delete All Projects
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAboutTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white mb-4">About AI Studio</h3>
      <div className="space-y-4">
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <div className="flex items-center gap-3 mb-3">
            <Icon name="brain" className="w-8 h-8 text-purple-400" />
            <div>
              <span className="font-medium text-white">AI Studio</span>
              <p className="text-sm text-gray-400">Version 2.1.0</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            Build and deploy AI-powered applications with ease. Powered by Google's Gemini AI.
          </p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="font-medium text-white mb-3 block">Links</span>
          <div className="space-y-2">
            <a href="#" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm">
              <Icon name="github" className="w-4 h-4" />
              GitHub Repository
            </a>
            <a href="#" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm">
              <Icon name="help" className="w-4 h-4" />
              Documentation
            </a>
            <a href="#" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm">
              <Icon name="discord" className="w-4 h-4" />
              Discord Community
            </a>
          </div>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
          <span className="font-medium text-white">System Info</span>
          <div className="mt-2 space-y-1 text-sm text-gray-400">
            <div>Browser: Chrome 120.0.0</div>
            <div>Platform: {navigator.platform}</div>
            <div>Last Updated: Dec 15, 2024</div>
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
            <nav className="p-4 space-y-1 max-h-96 overflow-y-auto">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'account'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="user" className="w-3 h-3 inline mr-2" />
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
                <Icon name="history" className="w-3 h-3 inline mr-2" />
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
                <Icon name="download" className="w-3 h-3 inline mr-2" />
                Backups
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="bell" className="w-3 h-3 inline mr-2" />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="shield" className="w-3 h-3 inline mr-2" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('themes')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'themes'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="palette" className="w-3 h-3 inline mr-2" />
                Themes
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'api'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="key" className="w-3 h-3 inline mr-2" />
                API Keys
              </button>
              <button
                onClick={() => setActiveTab('language')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'language'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="globe" className="w-3 h-3 inline mr-2" />
                Language
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'data'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="database" className="w-3 h-3 inline mr-2" />
                Data
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'about'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon name="info" className="w-3 h-3 inline mr-2" />
                About
              </button>
            </nav>
          </div>

          <div className="flex-1 p-6">
            {activeTab === 'account' && renderAccountTab()}
            {activeTab === 'versions' && renderVersionsTab()}
            {activeTab === 'backups' && renderBackupsTab()}
            {activeTab === 'notifications' && renderNotificationsTab()}
            {activeTab === 'security' && renderSecurityTab()}
            {activeTab === 'themes' && renderThemesTab()}
            {activeTab === 'api' && renderApiTab()}
            {activeTab === 'language' && renderLanguageTab()}
            {activeTab === 'data' && renderDataTab()}
            {activeTab === 'about' && renderAboutTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;