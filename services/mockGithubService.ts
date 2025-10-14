import type { GitRepository, GitCommit, GitBranch } from '../types';

// Mock GitHub repositories
const MOCK_REPOSITORIES: GitRepository[] = [
  {
    id: 'repo_001',
    name: 'my-awesome-app',
    fullName: 'johndoe/my-awesome-app',
    description: 'An awesome web application built with MominAI',
    url: 'https://github.com/johndoe/my-awesome-app',
    cloneUrl: 'https://github.com/johndoe/my-awesome-app.git',
    defaultBranch: 'main',
    isPrivate: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'repo_002',
    name: 'portfolio-site',
    fullName: 'johndoe/portfolio-site',
    description: 'Personal portfolio website',
    url: 'https://github.com/johndoe/portfolio-site',
    cloneUrl: 'https://github.com/johndoe/portfolio-site.git',
    defaultBranch: 'main',
    isPrivate: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock commits
const MOCK_COMMITS: GitCommit[] = [
  {
    id: 'commit_001',
    message: 'Initial commit - MominAI generated project',
    author: {
      name: 'MominAI',
      email: 'ai@mominai.com'
    },
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    url: 'https://github.com/johndoe/my-awesome-app/commit/abc123'
  },
  {
    id: 'commit_002',
    message: 'Add responsive design and mobile optimization',
    author: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    url: 'https://github.com/johndoe/my-awesome-app/commit/def456'
  }
];

// Mock branches
const MOCK_BRANCHES: GitBranch[] = [
  {
    name: 'main',
    commit: {
      sha: 'abc123def456',
      message: 'Add responsive design and mobile optimization'
    },
    protected: true
  },
  {
    name: 'develop',
    commit: {
      sha: 'ghi789jkl012',
      message: 'Work in progress - new features'
    },
    protected: false
  },
  {
    name: 'feature/auth',
    commit: {
      sha: 'mno345pqr678',
      message: 'Implement user authentication'
    },
    protected: false
  }
];

class MockGithubService {
  private repositories: GitRepository[] = [...MOCK_REPOSITORIES];
  private commits: GitCommit[] = [...MOCK_COMMITS];
  private branches: GitBranch[] = [...MOCK_BRANCHES];

  // Authenticate with GitHub
  async authenticate(): Promise<any> {
    console.log('🔐 [MOCK] Authenticating with GitHub');

    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      user: {
        id: 'user_001',
        login: 'johndoe',
        name: 'John Doe',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345678?v=4',
        html_url: 'https://github.com/johndoe'
      },
      token: 'mock_github_token_12345'
    };
  }

  // Get user repositories
  async getRepositories(): Promise<GitRepository[]> {
    console.log('📚 [MOCK] Getting user repositories');
    return this.repositories;
  }

  // Create new repository
  async createRepository(name: string, options: {
    description?: string;
    private?: boolean;
    template?: string;
  } = {}): Promise<GitRepository> {
    console.log('➕ [MOCK] Creating repository:', name, options);

    // Simulate repository creation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newRepo: GitRepository = {
      id: `repo_${Date.now()}`,
      name: name,
      fullName: `johndoe/${name}`,
      description: options.description || 'A new repository created with MominAI',
      url: `https://github.com/johndoe/${name}`,
      cloneUrl: `https://github.com/johndoe/${name}.git`,
      defaultBranch: 'main',
      isPrivate: options.private || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.repositories.push(newRepo);
    return newRepo;
  }

  // Get repository details
  async getRepository(owner: string, name: string): Promise<GitRepository> {
    console.log('📖 [MOCK] Getting repository:', `${owner}/${name}`);

    const repo = this.repositories.find(r => r.fullName === `${owner}/${name}`);
    if (!repo) {
      throw new Error('Repository not found');
    }

    return repo;
  }

  // Push code to repository
  async pushToRepository(repoName: string, files: any, commitMessage: string): Promise<GitCommit> {
    console.log('⬆️ [MOCK] Pushing code to repository:', repoName);

    // Simulate git operations
    await new Promise(resolve => setTimeout(resolve, 3000));

    const newCommit: GitCommit = {
      id: `commit_${Date.now()}`,
      message: commitMessage,
      author: {
        name: 'MominAI',
        email: 'ai@mominai.com'
      },
      date: new Date().toISOString(),
      url: `https://github.com/johndoe/${repoName}/commit/${Math.random().toString(36).substring(2, 11)}`
    };

    this.commits.unshift(newCommit);
    return newCommit;
  }

  // Get repository commits
  async getCommits(owner: string, repo: string, branch?: string): Promise<GitCommit[]> {
    console.log('📝 [MOCK] Getting commits for:', `${owner}/${repo}`, branch || 'default');
    return this.commits.slice(0, 10); // Return last 10 commits
  }

  // Get repository branches
  async getBranches(owner: string, repo: string): Promise<GitBranch[]> {
    console.log('🌿 [MOCK] Getting branches for:', `${owner}/${repo}`);
    return this.branches;
  }

  // Create new branch
  async createBranch(owner: string, repo: string, branchName: string, fromBranch: string = 'main'): Promise<GitBranch> {
    console.log('🌱 [MOCK] Creating branch:', branchName, 'from:', fromBranch);

    const sourceBranch = this.branches.find(b => b.name === fromBranch);
    if (!sourceBranch) {
      throw new Error('Source branch not found');
    }

    const newBranch: GitBranch = {
      name: branchName,
      commit: { ...sourceBranch.commit },
      protected: false
    };

    this.branches.push(newBranch);
    return newBranch;
  }

  // Delete repository
  async deleteRepository(owner: string, repo: string): Promise<void> {
    console.log('🗑️ [MOCK] Deleting repository:', `${owner}/${repo}`);

    const index = this.repositories.findIndex(r => r.fullName === `${owner}/${repo}`);
    if (index === -1) {
      throw new Error('Repository not found');
    }

    this.repositories.splice(index, 1);
  }

  // Get repository contents
  async getContents(owner: string, repo: string, path: string = '', branch?: string): Promise<any[]> {
    console.log('📁 [MOCK] Getting contents for:', `${owner}/${repo}/${path}`);

    // Mock file structure
    if (path === '') {
      return [
        {
          name: 'src',
          path: 'src',
          type: 'dir',
          url: `https://api.github.com/repos/${owner}/${repo}/contents/src`
        },
        {
          name: 'package.json',
          path: 'package.json',
          type: 'file',
          size: 1024,
          url: `https://api.github.com/repos/${owner}/${repo}/contents/package.json`
        },
        {
          name: 'README.md',
          path: 'README.md',
          type: 'file',
          size: 512,
          url: `https://api.github.com/repos/${owner}/${repo}/contents/README.md`
        }
      ];
    }

    return [];
  }

  // Create pull request
  async createPullRequest(owner: string, repo: string, options: {
    title: string;
    head: string;
    base: string;
    body?: string;
  }): Promise<any> {
    console.log('🔀 [MOCK] Creating pull request:', options.title);

    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      id: `pr_${Date.now()}`,
      number: Math.floor(Math.random() * 1000) + 1,
      title: options.title,
      head: options.head,
      base: options.base,
      body: options.body,
      state: 'open',
      html_url: `https://github.com/${owner}/${repo}/pull/${Math.floor(Math.random() * 1000) + 1}`,
      created_at: new Date().toISOString()
    };
  }

  // Get repository statistics
  async getRepositoryStats(owner: string, repo: string): Promise<any> {
    console.log('📊 [MOCK] Getting repository stats');

    return {
      stars: Math.floor(Math.random() * 500) + 10,
      forks: Math.floor(Math.random() * 100) + 5,
      watchers: Math.floor(Math.random() * 200) + 20,
      issues: {
        open: Math.floor(Math.random() * 50) + 5,
        closed: Math.floor(Math.random() * 200) + 20
      },
      pullRequests: {
        open: Math.floor(Math.random() * 20) + 2,
        closed: Math.floor(Math.random() * 100) + 10
      }
    };
  }

  // Check if repository exists
  async repositoryExists(owner: string, repo: string): Promise<boolean> {
    console.log('🔍 [MOCK] Checking if repository exists:', `${owner}/${repo}`);
    return this.repositories.some(r => r.fullName === `${owner}/${repo}`);
  }

  // Get user information
  async getUser(): Promise<any> {
    console.log('👤 [MOCK] Getting user information');

    return {
      id: 'user_001',
      login: 'johndoe',
      name: 'John Doe',
      avatar_url: 'https://avatars.githubusercontent.com/u/12345678?v=4',
      html_url: 'https://github.com/johndoe',
      bio: 'Full-stack developer passionate about AI and web development',
      location: 'San Francisco, CA',
      company: 'Tech Startup',
      public_repos: 42,
      followers: 156,
      following: 89
    };
  }
}

export const mockGithubService = new MockGithubService();