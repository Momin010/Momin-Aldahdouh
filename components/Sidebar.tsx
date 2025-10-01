import React from 'react';
import { Icon } from './Icon';
import { Logo } from './Logo';
import type { Project, User } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  user: User;
  onSignOut: () => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ projects, activeProjectId, onSelectProject, onNewProject, onDeleteProject, user, onSignOut, isMobile, onClose }) => {
  return (
    <aside className="w-64 h-full bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <Logo className="w-auto h-8" />
        {isMobile && (
            <button onClick={onClose} className="p-2 -mr-2 rounded-full text-gray-300 hover:bg-white/10" aria-label="Close sidebar">
              <Icon name="close" className="w-5 h-5" />
            </button>
        )}
      </div>
      <div className="p-2">
        <button
          onClick={() => onNewProject()}
          title="New Project"
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors justify-start"
        >
          <Icon name="code" className="w-4 h-4 flex-shrink-0" />
          <span>New Project</span>
        </button>
      </div>
      <nav className="flex-grow overflow-y-auto overflow-x-hidden p-2 space-y-1">
        <h2 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h2>
        <ul>
          {projects.map(project => (
            <li key={project.id} title={project.projectName}>
              <button
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-left flex items-center justify-between gap-2 p-3 rounded-lg text-sm transition-colors group ${
                  activeProjectId === project.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                   {/* You can add project-specific icons here later if desired */}
                  <span className="truncate">{project.projectName}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded transition-opacity flex-shrink-0"
                  aria-label={`Delete ${project.projectName}`}
                >
                  <Icon name="trash" className="w-4 h-4"/>
                </button>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-white/10 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm flex-shrink-0" title={user.email}>
                    {user.email.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm text-gray-300 truncate">{user.email}</p>
            </div>
            <button onClick={onSignOut} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0" aria-label="Sign out">
                <Icon name="logout" className="w-5 h-5" />
            </button>
          </div>
      </div>
    </aside>
  );
};

export default Sidebar;