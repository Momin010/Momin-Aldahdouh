import { sql } from '../../lib/db';
import { comparePassword, createSession } from '../../lib/auth';
import type { User } from '../../types';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  try {
    const { rows } = await sql`SELECT email, password_hash FROM users WHERE email = ${email}`;
    const dbUser = rows[0];

    if (!dbUser) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const passwordMatch = await comparePassword(password, dbUser.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user: User = { email: dbUser.email };
    await createSession(user, res);

    res.status(200).json(user);
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
