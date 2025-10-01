import type { User, Workspace } from '../types';

const DATA_KEY = 'mominai_data';
const SESSION_KEY = 'mominai_session';

interface AppData {
  users: { [email: string]: string }; // email: password_hash (plain text for now)
  workspaces: { [email: string]: Workspace };
}

function getAppData(): AppData {
  try {
    const data = localStorage.getItem(DATA_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure the structure is valid
      return {
        users: parsed.users || {},
        workspaces: parsed.workspaces || {}
      };
    }
  } catch (e) {
    console.error("Failed to parse app data from localStorage", e);
  }
  return { users: {}, workspaces: {} };
}

function saveAppData(data: AppData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function signUp(email: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network latency
      if (!email || !password) {
        return reject(new Error('Email and password are required.'));
      }
      if (password.length < 6) {
        return reject(new Error('Password must be at least 6 characters.'));
      }

      const data = getAppData();
      if (data.users[email]) {
        return reject(new Error('An account with this email already exists.'));
      }

      data.users[email] = password; // In a real app, hash the password
      saveAppData(data);

      const user = { email };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      resolve(user);
    }, 500);
  });
}

export function signIn(email: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network latency
      const data = getAppData();
      if (!data.users[email] || data.users[email] !== password) {
        return reject(new Error('Invalid email or password.'));
      }

      const user = { email };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      resolve(user);
    }, 500);
  });
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch (e) {
    return null;
  }
}

export function getAllWorkspaces(): { [email: string]: Workspace } {
    const data = getAppData();
    return data.workspaces;
}

export function saveAllWorkspaces(workspaces: { [email: string]: Workspace }) {
    const data = getAppData();
    data.workspaces = workspaces;
    saveAppData(data);
}
