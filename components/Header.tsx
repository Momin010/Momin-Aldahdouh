import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  onDownloadProject: () => void;
  onPublish: () => void;
  onSettings: () => void;
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
    <header className="relative z-30 flex items-center justify-between py-2 px-4 bg-black/20 backdrop-blur-lg border-b border-white/10 flex-shrink-0">
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
                className="bg-white/20 text-white font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </form>
          ) : (
             <h1 
                onDoubleClick={() => setRenaming(true)} 
                className="font-semibold text-lg cursor-pointer ml-2 truncate"
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
            <button onClick={onToggleView} className="px-3 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors flex items-center gap-2">
              {mobileView === 'chat' ? (
                <>
                  <Icon name="eye" className="w-4 h-4" />
                  <span>View</span>
                </>
              ) : (
                <>
                   <Icon name="chat" className="w-4 h-4" />
                  <span>Chat</span>
                </>
              )}
            </button>
          </div>
        )}
       
        <div className="hidden md:flex items-center gap-4">
          <a 
            href="https://github.com/Momin-Ai/Momin-AI-IDE" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" 
            aria-label="View on GitHub"
          >
            <Icon name="github" className="w-6 h-6" />
          </a>
          <button 
            onClick={onSettings}
            disabled={!isProjectLoaded}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
            aria-label="Settings"
          >
            <Icon name="settings" className="w-5 h-5" />
          </button>
          <button 
            onClick={onPublish}
            disabled={!isProjectLoaded}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
            Publish
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;