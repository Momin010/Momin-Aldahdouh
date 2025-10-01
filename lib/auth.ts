import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import type { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'a-secure-default-secret-for-development';
const TOKEN_NAME = 'mominai_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 1 week

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'a-secure-default-secret-for-development') {
  console.warn('WARNING: JWT_SECRET is not set in production. Using a default, insecure secret.');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: User, res: any) {
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

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return { email: decoded.email };
  } catch (error) {
    console.warn('Invalid JWT token:', error);
    return null;
  }
}
