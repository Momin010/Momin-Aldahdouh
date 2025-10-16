import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BASE_URL = 'https://mominai-4.vercel.app'; // Updated to use correct domain

export default async function handler(req: any, res: any) {
  // Handle OAuth initiation (GET request without code/state)
  if (req.method === 'GET' && !req.query.code) {
    if (!GITHUB_CLIENT_ID) {
      return res.status(500).json({
        message: 'GitHub OAuth not configured. Missing GITHUB_CLIENT_ID environment variable.'
      });
    }

    try {
      // Generate a random state for CSRF protection
      const state = Math.random().toString(36).substring(2, 15);

      // Store state in a cookie for verification on callback
      res.setHeader('Set-Cookie', [
        `github_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
        `github_oauth_flow=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
      ]);

      // GitHub OAuth authorization URL
      const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
      githubAuthUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
      githubAuthUrl.searchParams.set('redirect_uri', `${BASE_URL}/api/auth/github`);
      githubAuthUrl.searchParams.set('scope', 'repo,public_repo');
      githubAuthUrl.searchParams.set('state', state);
      githubAuthUrl.searchParams.set('response_type', 'code');

      // Redirect to GitHub
      res.redirect(githubAuthUrl.toString());

    } catch (error) {
      console.error('GitHub OAuth initiation error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }

    return;
  }

  // Handle OAuth callback (GET request with code/state)
  if (req.method === 'GET' && req.query.code) {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ message: 'Missing code or state parameter' });
    }

    try {
      // Verify state parameter for CSRF protection
      const cookies = cookie.parse(req.headers.cookie || '');
      const storedState = cookies.github_oauth_state;

      if (state !== storedState) {
        return res.status(403).json({ message: 'Invalid state parameter' });
      }

      if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.status(500).json({
          message: 'GitHub OAuth not configured. Missing client credentials.'
        });
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          state,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(`OAuth error: ${tokenData.error_description || tokenData.error}`);
      }

      const { access_token } = tokenData;

      // Get user info from GitHub
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MominAI-App',
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data from GitHub');
      }

      const githubUser = await userResponse.json();

      // Create JWT token with GitHub access token and user info
      const sessionToken = jwt.sign(
        {
          githubAccessToken: access_token,
          githubUser: {
            id: githubUser.id,
            login: githubUser.login,
            name: githubUser.name,
            email: githubUser.email,
            avatar_url: githubUser.avatar_url,
          },
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set session cookie
      res.setHeader('Set-Cookie', [
        `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
        'github_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'github_oauth_flow=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      ]);

      // Redirect to the app with success state
      res.redirect(`${BASE_URL}?github_auth=success`);

    } catch (error) {
      console.error('GitHub OAuth callback error:', error);

      // Clear any existing cookies on error
      res.setHeader('Set-Cookie', [
        'github_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'github_oauth_flow=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      ]);

      // Redirect to the app with error state
      const errorMessage = encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed');
      res.redirect(`${BASE_URL}?github_auth=error&message=${errorMessage}`);
    }

    return;
  }

  // Method not allowed for other request types
  return res.status(405).json({ message: 'Method Not Allowed' });
}