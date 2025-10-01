import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import type { User } from '../types';

// The JWT_SECRET must be set in the environment variables.
// Do not provide a default fallback, as it's a security risk and hides configuration errors.
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_NAME = 'mominai_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 1 week

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: User, res: any) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set. Cannot create a session.');
    // This will cause the calling function to throw a 500 error,
    // and the Vercel logs will show this exact message.
    throw new Error('Server configuration error: JWT secret is missing.');
  }

  const payload = { sub: user.email, email: user.email };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `${MAX_AGE}s` });

  const cookie = serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });

  res.setHeader('Set-Cookie', cookie);
}

export function clearSession(res: any) {
  const cookie = serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: -1, // Expire the cookie immediately
  });

  res.setHeader('Set-Cookie', cookie);
}

export async function getUserFromRequest(req: any): Promise<User | null> {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[TOKEN_NAME];

  if (!token) {
    return null;
  }
  
  if (!JWT_SECRET) {
    // Log an error but don't throw, as this function is for checking sessions.
    // The user is simply not authenticated if the server can't verify the token.
    console.error('JWT_SECRET is not set. Cannot verify session token.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return { email: decoded.email };
  } catch (error) {
    // This will catch expired or malformed tokens, which is expected behavior.
    console.warn('Invalid JWT token during verification:', error);
    return null;
  }
}
