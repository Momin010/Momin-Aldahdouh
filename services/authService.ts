
import type { User } from '../types';
import { apiRequest } from './apiUtils';

export function signUp(email: string, password:string): Promise<User> {
  return apiRequest<User>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signIn(email: string, password: string): Promise<User> {
  return apiRequest<User>('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signOut(): Promise<void> {
  return apiRequest<void>('/api/auth/signout', { method: 'POST' });
}

export function getCurrentUser(): Promise<User | null> {
  return apiRequest<User | null>('/api/auth/session').catch(error => {
    // Any error during session check (e.g., 401 Unauthorized) means no user is logged in.
    console.warn('Session check failed, assuming user is logged out:', error.message);
    return null;
  });
}
