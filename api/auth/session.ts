import { getUserFromRequest } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  const user = await getUserFromRequest(req);

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
}
