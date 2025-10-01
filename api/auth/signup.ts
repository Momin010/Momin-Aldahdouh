import { sql } from '../../lib/db';
import { hashPassword, createSession } from '../../lib/auth';
import type { User, Workspace, Project, AppState } from '../../types';
import { INITIAL_CHAT_MESSAGE } from '../../constants';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Invalid email or password must be at least 6 characters long.' });
  }

  try {
    // Check if user already exists
    const { rows: existingUsers } = await sql`SELECT email FROM users WHERE email = ${email}`;
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }
    
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY,
        user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
        project_name TEXT NOT NULL,
        history JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const hashedPassword = await hashPassword(password);
    
    // Insert new user
    await sql`INSERT INTO users (email, password_hash) VALUES (${email}, ${hashedPassword})`;
    
    // Create a default project for the new user
    const initialAppState: AppState = {
        files: {},
        previewHtml: '',
        chatMessages: [INITIAL_CHAT_MESSAGE],
        hasGeneratedCode: false,
        projectName: 'Untitled Project',
        projectPlan: null,
    };
    
    const newProject: Project = {
        id: uuidv4(),
        projectName: 'Untitled Project',
        history: {
            versions: [initialAppState],
            currentIndex: 0,
        },
    };
    
    await sql`
        INSERT INTO projects (id, user_email, project_name, history)
        VALUES (${newProject.id}, ${email}, ${newProject.projectName}, ${JSON.stringify(newProject.history)});
    `;
    
    const user: User = { email };
    await createSession(user, res);
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
