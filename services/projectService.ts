
import type { Workspace, Project } from '../types';
import { apiRequest } from './apiUtils';

export function getWorkspace(): Promise<Workspace> {
    return apiRequest<Workspace>('/api/projects');
}

export function createProject(projectName: string): Promise<Project> {
    return apiRequest<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ projectName }),
    });
}

// NOTE: This updates a single project, not the whole workspace.
// The backend will handle updating the project within the user's workspace.
export function updateProject(project: Project): Promise<void> {
    return apiRequest<void>(`/api/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify(project),
    });
}

export function deleteProject(projectId: string): Promise<void> {
    return apiRequest<void>(`/api/projects/${projectId}`, {
        method: 'DELETE',
    });
}
