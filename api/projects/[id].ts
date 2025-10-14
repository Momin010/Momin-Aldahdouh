
import { sql } from '../../lib/db.js';
import { getUserFromRequest } from '../../lib/auth.js';
import type { Project } from '../../types.js';

export default async function handler(req: any, res: any) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  const { id } = req.query;
  console.log(`${req.method} request for project ${id} by user ${user.email}`);

  try {
    // First, verify the project belongs to the user for all methods
    const { rows } = await sql`SELECT id FROM projects WHERE id = ${id} AND user_email = ${user.email}`;
    console.log(`Found ${rows.length} matching projects for ID ${id} and user ${user.email}`);
    if (rows.length === 0) {
         return res.status(404).json({ message: 'Project not found or you do not have permission to access it.' });
    }

    if (req.method === 'PUT') {
      const project: Project = req.body;
      
      if (project.id !== id) {
        return res.status(400).json({ message: 'Project ID mismatch in request body and URL.' });
      }

      await sql`
        UPDATE projects
        SET project_name = ${project.projectName}, history = ${JSON.stringify(project.history)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_email = ${user.email}
      `;

      return res.status(204).end();
    }
    
    if (req.method === 'DELETE') {
      await sql`
        DELETE FROM projects
        WHERE id = ${id} AND user_email = ${user.email}
      `;
      
      return res.status(204).end();
    }
    
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error(`Project API error for ID ${id}:`, error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
