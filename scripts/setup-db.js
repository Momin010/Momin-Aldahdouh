import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    }
  });
}

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    const sqlScript = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
    const statements = sqlScript.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await sql.query(statement);
        console.log('Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();