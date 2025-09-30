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
    <aside className="w-64 h-full bg-white/20 backdrop-blur-2xl border-r border-white/30 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-black/10 flex items-center gap-3">
        <Icon name="logo" className="w-8 h-8 text-purple-600" />
        <h1 className="text-lg font-bold text-gray-800">MominAI</h1>
      </div>
      <div className="p-2">
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors"
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
                  activeProjectId === project.id ? 'bg-black/10 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'
                }`}
              >
                <span className="truncate">{project.projectName}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500 p-1 rounded transition-opacity"
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