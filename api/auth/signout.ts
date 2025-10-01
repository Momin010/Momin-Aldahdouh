import { clearSession } from '../../lib/auth.js';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  clearSession(res);
  res.status(204).end();
}