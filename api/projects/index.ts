
import { sql } from '../../lib/db.js';
import { getUserFromRequest } from '../../lib/auth.js';
import type { Project, Workspace, AppState } from '../../types.js';
import { v4 as uuidv4 } from 'uuid';
import { INITIAL_CHAT_MESSAGE } from '../../constants.js';


export default async function handler(req: any, res: any) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      console.log(`Fetching projects for user: ${user.email}`);
      const { rows } = await sql`
        SELECT id, project_name, history FROM projects
        WHERE user_email = ${user.email}
        ORDER BY updated_at DESC
      `;

      console.log(`Found ${rows.length} projects for user ${user.email}`);
      const projects: Project[] = rows.map(row => ({
        id: row.id,
        projectName: row.project_name,
        history: row.history,
      }));
      
      const workspace: Workspace = {
        projects,
        activeProjectId: projects.length > 0 ? projects[0].id : null,
      };

      return res.status(200).json(workspace);
    }
    
    if (req.method === 'POST') {
      const { projectName } = req.body;
      if (!projectName || typeof projectName !== 'string') {
        return res.status(400).json({ message: 'Project name is required' });
      }

      console.log(`Creating new project "${projectName}" for user: ${user.email}`);

       const initialAppState: AppState = {
            files: {},
            previewHtml: '',
            frozenPrototypeHtml: null,
            projectPhase: 'planning',
            chatMessages: [INITIAL_CHAT_MESSAGE],
            hasGeneratedCode: false,
            projectName: projectName,
            projectPlan: null,
        };

      const newProject: Project = {
        id: uuidv4(),
        projectName: projectName,
        history: {
          versions: [initialAppState],
          currentIndex: 0,
        },
      };

      await sql`
        INSERT INTO projects (id, user_email, project_name, history)
        VALUES (${newProject.id}, ${user.email}, ${newProject.projectName}, ${JSON.stringify(newProject.history)})
      `;

      console.log(`Successfully created project with ID: ${newProject.id}`);
      return res.status(201).json(newProject);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error('Project API error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
