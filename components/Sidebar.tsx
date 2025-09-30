import React from 'react';
import { Icon } from './Icon';
import type { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ projects, activeProjectId, onSelectProject, onNewProject, onDeleteProject }) => {
  return (
    <aside className="w-64 h-full bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <Icon name="logo" className="w-8 h-8 text-purple-400" />
        <h1 className="text-lg font-bold text-white">MominAI</h1>
      </div>
      <div className="p-2">
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
        >
          <Icon name="code" className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>
      <nav className="flex-grow overflow-y-auto p-2 space-y-1">
        <h2 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h2>
        <ul>
          {projects.map(project => (
            <li key={project.id}>
              <button
                onClick={() => onSelectProject(project.id)}
                className={`w-full text-left flex items-center justify-between gap-2 p-2 rounded-lg text-sm transition-colors group ${
                  activeProjectId === project.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="truncate">{project.projectName}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded transition-opacity"
                  aria-label={`Delete ${project.projectName}`}
                >
                  <Icon name="trash" className="w-4 h-4"/>
                </button>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;