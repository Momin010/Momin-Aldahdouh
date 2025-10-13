import { NextApiRequest, NextApiResponse } from 'next';

const VERCEL_CLIENT_ID = process.env.VERCEL_CLIENT_ID;
const VERCEL_CLIENT_SECRET = process.env.VERCEL_CLIENT_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Handle OAuth callback from Vercel
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing authorization code or state' });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://api.vercel.com/v2/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: VERCEL_CLIENT_ID!,
          client_secret: VERCEL_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: `${BASE_URL}/api/vercel/auth`,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user info');
      }

      const userData = await userResponse.json();

      // Store tokens securely (in production, use proper session management)
      // For now, we'll return them to the client to store in localStorage
      // In production, you'd want to store this server-side

      const authData = {
        accessToken: tokenData.access_token,
        user: userData.user,
        team: userData.team,
        timestamp: new Date().toISOString(),
      };

      // Redirect back to the app with the auth data
      const redirectUrl = `${BASE_URL}/?vercel_auth=${encodeURIComponent(JSON.stringify(authData))}`;
      res.redirect(302, redirectUrl);

    } catch (error) {
      console.error('Vercel OAuth error:', error);
      res.redirect(302, `${BASE_URL}/?vercel_error=${encodeURIComponent('Authentication failed')}`);
    }

  } else if (req.method === 'POST') {
    // Initiate OAuth flow
    const authUrl = `https://vercel.com/oauth/authorize?${new URLSearchParams({
      client_id: VERCEL_CLIENT_ID!,
      scope: 'read write',
      response_type: 'code',
      redirect_uri: `${BASE_URL}/api/vercel/auth`,
      state: 'mominai_publish', // You can make this more secure
    })}`;

    res.status(200).json({ authUrl });

  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}