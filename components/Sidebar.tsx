import React from 'react';
import { Icon } from './Icon';
import { Logo } from './Logo';
import type { Project, User } from '../types';

interface SidebarProps {
  isExpanded: boolean;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  user: User;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isExpanded, projects, activeProjectId, onSelectProject, onNewProject, onDeleteProject, user, onSignOut }) => {
  return (
    <aside className={`h-full bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}>
      <div className={`p-4 border-b border-white/10 flex items-center ${isExpanded ? 'justify-start' : 'justify-center'}`}>
        <Logo className="w-auto h-8" iconOnly={!isExpanded} />
      </div>
      <div className="p-2">
        <button
          onClick={() => onNewProject()}
          title="New Project"
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors ${isExpanded ? 'justify-start' : 'justify-center'}`}
        >
          <Icon name="code" className="w-4 h-4 flex-shrink-0" />
          {isExpanded && <span>New Project</span>}
        </button>
      </div>
      <nav className="flex-grow overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {isExpanded && <h2 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h2>}
        <ul>
          {projects.map(project => (
            <li key={project.id} title={project.projectName}>
              <button
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-left flex items-center justify-between gap-2 p-3 rounded-lg text-sm transition-colors group ${
                  activeProjectId === project.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                } ${!isExpanded ? 'justify-center' : ''}`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                   {/* You can add project-specific icons here later if desired */}
                  <span className={`truncate ${!isExpanded ? 'sr-only' : ''}`}>{project.projectName}</span>
                </div>
                {isExpanded && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded transition-opacity flex-shrink-0"
                      aria-label={`Delete ${project.projectName}`}
                    >
                      <Icon name="trash" className="w-4 h-4"/>
                    </button>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 border-t border-white/10 mt-auto">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 overflow-hidden ${!isExpanded ? 'w-full justify-center' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm flex-shrink-0" title={user.email}>
                    {user.email.charAt(0).toUpperCase()}
                </div>
                {isExpanded && <p className="text-sm text-gray-300 truncate">{user.email}</p>}
            </div>
            {isExpanded && (
                <button onClick={onSignOut} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0" aria-label="Sign out">
                    <Icon name="logout" className="w-5 h-5" />
                </button>
            )}
          </div>
      </div>
    </aside>
  );
};

export default Sidebar;
