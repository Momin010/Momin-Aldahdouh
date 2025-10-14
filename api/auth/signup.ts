import { db } from '../../lib/db.js';
import { hashPassword, createSession } from '../../lib/auth.js';
import type { User, Project, AppState } from '../../types.js';
import { INITIAL_CHAT_MESSAGE } from '../../constants.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Invalid email or password must be at least 6 characters long.' });
  }
  
  const client = await db.connect();

  try {
    // 1. Ensure tables exist before executing any queries against them.
    // This is idempotent and safe to run on every request.
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.sql`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY,
        user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
        project_name TEXT NOT NULL,
        history JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Check if user already exists.
    const { rows: existingUsers } = await client.sql`SELECT email FROM users WHERE email = ${email}`;
    if (existingUsers.length > 0) {
      client.release();
      return res.status(409).json({ message: 'User with this email already exists.' });
    }
    
    // 3. Start a transaction for the multi-step signup process.
    await client.sql`BEGIN`;
    
    const hashedPassword = await hashPassword(password);
    
    // Insert new user
    await client.sql`INSERT INTO users (email, password_hash) VALUES (${email}, ${hashedPassword})`;
    
    // Create a default project for the new user
    const initialAppState: AppState = {
        files: {},
        previewHtml: '',
        standaloneHtml: '',
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
    
    await client.sql`
        INSERT INTO projects (id, user_email, project_name, history)
        VALUES (${newProject.id}, ${email}, ${newProject.projectName}, ${JSON.stringify(newProject.history)});
    `;

    // If all database operations succeed, commit the transaction.
    await client.sql`COMMIT`;
    
    const user: User = { email };
    await createSession(user, res);
    
    res.status(201).json(user);
  } catch (error) {
    // If any step fails, attempt to roll back the transaction.
    await client.sql`ROLLBACK`.catch(err => console.warn("Rollback failed or not needed:", err));
    console.error('Signup transaction error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    // Always release the client connection.
    client.release();
  }
}