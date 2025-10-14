import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { CreditService } from '../lib/creditService';
import { useTheme } from '../lib/themeContext';

interface ProjectActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onRenameProject: (name: string) => void;
  onDownloadProject: () => void;
  userEmail?: string;
}

const ProjectActionsModal: React.FC<ProjectActionsModalProps> = ({
  isOpen,
  onClose,
  projectName,
  onRenameProject,
  onDownloadProject,
  userEmail
}) => {
  const [isRenaming, setRenaming] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [credits, setCredits] = useState({ used: 0, max: 10, resetDate: '' });
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    if (userEmail) {
      const userCredits = CreditService.getUserCredits(userEmail);
      setCredits(userCredits);
    }
  }, [userEmail]);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onRenameProject(tempName.trim());
      setRenaming(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getResetTime = () => {
    if (!userEmail) return null;
    const resetDate = CreditService.getResetTime(userEmail);
    return resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={`relative max-w-md w-full rounded-2xl border shadow-2xl ${
        theme === 'light'
          ? 'bg-white border-gray-200 shadow-black/20'
          : 'bg-gray-900 border-gray-700 shadow-white/10'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          theme === 'light' ? 'border-gray-200' : 'border-gray-700'
        }`}>
          <h2 className={`text-xl font-bold ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Project Actions
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'light'
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Name Section */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'light' ? 'text-gray-700' : 'text-gray-300'
            }`}>
              Project Name
            </label>
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'light'
                      ? 'bg-white border-gray-300 text-gray-900'
                      : 'bg-gray-800 border-gray-600 text-white'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setRenaming(false)}
                  className="px-3 py-2 text-sm rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className={`text-lg font-semibold ${
                  theme === 'light' ? 'text-gray-900' : 'text-white'
                }`}>
                  {projectName}
                </span>
                <button
                  onClick={() => setRenaming(true)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'text-blue-600 hover:bg-blue-50'
                      : 'text-blue-400 hover:bg-blue-900/20'
                  }`}
                >
                  Rename
                </button>
              </div>
            )}
          </div>

          {/* Credits Section */}
          {userEmail && (
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}>
                Daily Credits
              </label>
              <div className={`p-4 rounded-lg border ${
                theme === 'light'
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-gray-800 border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    Messages Used Today
                  </span>
                  <span className={`text-sm font-bold ${
                    credits.used >= credits.max
                      ? 'text-red-500'
                      : theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {credits.used} / {credits.max}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className={`w-full h-2 rounded-full mb-2 ${
                  theme === 'light' ? 'bg-gray-200' : 'bg-gray-700'
                }`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      credits.used >= credits.max
                        ? 'bg-red-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((credits.used / credits.max) * 100, 100)}%` }}
                  />
                </div>

                <div className={`text-xs ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {credits.used >= credits.max ? (
                    <span className="text-red-500 font-medium">
                      Daily limit reached. Resets at {getResetTime()}
                    </span>
                  ) : (
                    <span>
                      {credits.max - credits.used} messages remaining today
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions Section */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onDownloadProject();
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Icon name="download" className="w-5 h-5" />
              Download Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectActionsModal;