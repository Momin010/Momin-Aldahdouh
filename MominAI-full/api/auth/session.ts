import { getUserFromRequest } from '../../lib/auth.js';
import { throwIfEnvInvalid } from '../../lib/env.js';

export default async function handler(req: any, res: any) {
  // Validate environment on every auth check to catch config issues early
  throwIfEnvInvalid();

  const user = await getUserFromRequest(req);

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
}