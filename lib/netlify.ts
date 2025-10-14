export interface NetlifyCredentials {
  accessToken: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export interface NetlifySite {
  id: string;
  name: string;
  url: string;
  admin_url: string;
  screenshot_url?: string;
  created_at: string;
  updated_at: string;
  published_deploy?: {
    id: string;
    url: string;
    created_at: string;
  };
}

export interface NetlifyDeploy {
  id: string;
  url: string;
  created_at: string;
  published_at?: string;
  state: 'new' | 'uploading' | 'uploaded' | 'preparing' | 'prepared' | 'building' | 'ready' | 'error';
  error_message?: string;
  branch: string;
}

class NetlifyManager {
  private credentials: NetlifyCredentials | null = null;
  private baseURL = 'https://api.netlify.com/api/v1';

  setCredentials(credentials: NetlifyCredentials): void {
    this.credentials = credentials;
  }

  getCredentials(): NetlifyCredentials | null {
    return this.credentials;
  }

  isAuthenticated(): boolean {
    return this.credentials !== null;
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.credentials) {
      throw new Error('Not authenticated with Netlify');
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Netlify API error: ${error.message}`);
    }

    return response.json();
  }

  // Get authenticated user info
  async getUser(): Promise<any> {
    return this.apiRequest('/user');
  }

  // Get user sites
  async getSites(): Promise<NetlifySite[]> {
    return this.apiRequest('/sites');
  }

  // Create a new site
  async createSite(name: string, repo?: { provider: string; repo_path: string; repo_branch: string }): Promise<NetlifySite> {
    const body: any = {
      name,
    };

    if (repo) {
      body.repo = repo;
    }

    return this.apiRequest('/sites', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Connect existing site to repository
  async connectSiteToRepo(siteId: string, repo: { provider: string; repo_path: string; repo_branch: string }): Promise<NetlifySite> {
    return this.apiRequest(`/sites/${siteId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        repo,
      }),
    });
  }

  // Deploy files directly (without Git)
  async deployFiles(siteId: string, files: Record<string, string>, message: string = 'Deploy from MominAI'): Promise<NetlifyDeploy> {
    // Prepare files for deployment
    const deployFiles: Record<string, { content: string; encoding: string }> = {};

    Object.entries(files).forEach(([path, content]) => {
      deployFiles[path] = {
        content: btoa(content),
        encoding: 'base64',
      };
    });

    return this.apiRequest(`/sites/${siteId}/deploys`, {
      method: 'POST',
      body: JSON.stringify({
        files: deployFiles,
        message,
        draft: false,
      }),
    });
  }

  // Get site deploys
  async getSiteDeploys(siteId: string): Promise<NetlifyDeploy[]> {
    return this.apiRequest(`/sites/${siteId}/deploys`);
  }

  // Get specific deploy
  async getDeploy(siteId: string, deployId: string): Promise<NetlifyDeploy> {
    return this.apiRequest(`/sites/${siteId}/deploys/${deployId}`);
  }

  // Delete site
  async deleteSite(siteId: string): Promise<void> {
    await this.apiRequest(`/sites/${siteId}`, {
      method: 'DELETE',
    });
  }

  // Get site build hooks
  async getBuildHooks(siteId: string): Promise<any[]> {
    return this.apiRequest(`/sites/${siteId}/build_hooks`);
  }

  // Create build hook
  async createBuildHook(siteId: string, title: string, branch: string = 'main'): Promise<any> {
    return this.apiRequest(`/sites/${siteId}/build_hooks`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        branch,
      }),
    });
  }
}

// Export singleton instance
export const netlifyManager = new NetlifyManager();