export interface GitHubCredentials {
  accessToken: string;
  user: {
    id: number;
    login: string;
    name: string;
    email: string;
    avatar_url: string;
  };
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  private: boolean;
  created_at: string;
  updated_at: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
}

class GitHubManager {
  private credentials: GitHubCredentials | null = null;
  private baseURL = 'https://api.github.com';

  setCredentials(credentials: GitHubCredentials): void {
    this.credentials = credentials;
  }

  getCredentials(): GitHubCredentials | null {
    return this.credentials;
  }

  isAuthenticated(): boolean {
    return this.credentials !== null;
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.credentials) {
      throw new Error('Not authenticated with GitHub');
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.credentials.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`GitHub API error: ${error.message}`);
    }

    return response.json();
  }

  // Get authenticated user info
  async getUser(): Promise<any> {
    return this.apiRequest('/user');
  }

  // Get user repositories
  async getUserRepos(): Promise<GitHubRepo[]> {
    return this.apiRequest('/user/repos?sort=updated&per_page=100');
  }

  // Create a new repository
  async createRepo(name: string, description: string = '', isPrivate: boolean = false): Promise<GitHubRepo> {
    return this.apiRequest('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true, // Create with README
      }),
    });
  }

  // Get repository contents
  async getRepoContents(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    return this.apiRequest(`/repos/${owner}/${repo}/contents/${path}`);
  }

  // Get file content
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const file = await this.apiRequest(`/repos/${owner}/${repo}/contents/${path}`);
    if (file.encoding === 'base64') {
      return atob(file.content.replace(/\n/g, ''));
    }
    return file.content;
  }

  // Create or update file
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<any> {
    const body: any = {
      message,
      content: btoa(content),
    };

    if (sha) {
      body.sha = sha;
    }

    return this.apiRequest(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // Upload multiple files to repository
  async uploadFiles(owner: string, repo: string, files: Record<string, string>): Promise<void> {
    const uploadPromises = Object.entries(files).map(async ([filePath, content]) => {
      try {
        // Check if file exists to get SHA
        let sha: string | undefined;
        try {
          const existingFile = await this.apiRequest(`/repos/${owner}/${repo}/contents/${filePath}`);
          sha = existingFile.sha;
        } catch (error) {
          // File doesn't exist, sha will be undefined
        }

        await this.createOrUpdateFile(
          owner,
          repo,
          filePath,
          content,
          `Add ${filePath}`,
          sha
        );
      } catch (error) {
        console.error(`Failed to upload ${filePath}:`, error);
        throw error;
      }
    });

    await Promise.all(uploadPromises);
  }

  // Delete repository
  async deleteRepo(owner: string, repo: string): Promise<void> {
    await this.apiRequest(`/repos/${owner}/${repo}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const githubManager = new GitHubManager();