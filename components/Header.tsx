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
  onToggleSidebar
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
    <header className="relative z-30 flex items-center justify-between py-2 px-3 md:px-4 bg-white/10 backdrop-blur-xl border-b border-white/20 flex-shrink-0 shadow-lg">
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-lg md:hidden text-gray-300 hover:bg-white/10" aria-label="Toggle sidebar">
            <Icon name="menu" className="w-6 h-6" />
        </button>
         {isRenaming ? (
            <form onSubmit={handleRenameSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRenameSubmit}
                className="bg-white/10 backdrop-blur-xl text-white font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/20"
              />
            </form>
          ) : (
             <h1 
                onDoubleClick={() => setRenaming(true)} 
                className="font-semibold text-base md:text-lg cursor-pointer ml-1 md:ml-2 truncate"
                title="Double-click to rename"
              >
                {projectName}
            </h1>
          )}
      </div>
      
      <div className="hidden md:flex flex-1 justify-center items-center gap-2">
        {/* Center space for future features */}
      </div>

      <div className="flex-1 flex justify-end items-center gap-4">
        {isProjectLoaded && (
           <div className="md:hidden">
            <button onClick={onToggleView} className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-white/20 backdrop-blur-xl hover:bg-white/30 transition-colors flex items-center gap-1 border border-white/20">
              {mobileView === 'chat' ? (
                <>
                  <Icon name="eye" className="w-3 h-3" />
                  <span>View</span>
                </>
              ) : (
                <>
                   <Icon name="chat" className="w-3 h-3" />
                  <span>Chat</span>
                </>
              )}
            </button>
          </div>
        )}
       
        <div className="hidden md:flex items-center gap-2 md:gap-4">
          <a
            href="https://github.com/Momin-Ai/Momin-AI-IDE"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 backdrop-blur-xl border border-white/20 transition-colors"
            aria-label="View on GitHub"
          >
            <Icon name="github" className="w-6 h-6" />
          </a>
          {onCheckErrors && (
            <button
              onClick={onCheckErrors}
              disabled={!isProjectLoaded}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/20 bg-white/10 backdrop-blur-xl border border-white/20 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
              aria-label="Check for Errors"
            >
              <Icon name="bug" className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onSettings}
            disabled={!isProjectLoaded}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/20 bg-white/10 backdrop-blur-xl border border-white/20 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
            aria-label="Settings"
          >
            <Icon name="settings" className="w-5 h-5" />
          </button>
          <button
            onClick={onPublish}
            disabled={!isProjectLoaded}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/20 backdrop-blur-xl hover:bg-white/30 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed border border-white/20">
            Publish
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;