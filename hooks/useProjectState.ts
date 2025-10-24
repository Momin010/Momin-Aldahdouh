import { useState, useCallback } from 'react';
import type { Workspace, Project, AppState } from '../types';

interface UseProjectStateReturn {
  workspace: Workspace;
  setWorkspace: React.Dispatch<React.SetStateAction<Workspace>>;
  updateProjectById: (projectId: string, updater: (project: Project) => Project) => void;
  addHistoryStateForProject: (projectId: string, updater: (prevState: AppState) => AppState) => void;
}

export function useProjectState(initialWorkspace: Workspace): UseProjectStateReturn {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);

  const updateProjectById = useCallback((projectId: string, updater: (project: Project) => Project) => {
    setWorkspace(prevWorkspace => {
        if (!prevWorkspace) return prevWorkspace;
        const newProjects = prevWorkspace.projects.map(p => {
            if (p.id === projectId) {
                return updater(p);
            }
            return p;
        });
        return { ...prevWorkspace, projects: newProjects };
    });
  }, []);

  const addHistoryStateForProject = useCallback((projectId: string, updater: (prevState: AppState) => AppState) => {
    updateProjectById(projectId, project => {
        const currentVersion = project.history.versions[project.history.currentIndex];
        const newVersion = updater(currentVersion);

        const newVersions = project.history.versions.slice(0, project.history.currentIndex + 1);
        newVersions.push(newVersion);

        if (newVersions.length > 20) newVersions.splice(0, newVersions.length - 20);

        const newHistory = {
            versions: newVersions,
            currentIndex: newVersions.length - 1,
        };
        return { ...project, history: newHistory, projectName: newVersion.projectName };
    });
  }, [updateProjectById]);

  return {
    workspace,
    setWorkspace,
    updateProjectById,
    addHistoryStateForProject,
  };
}