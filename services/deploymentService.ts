import { githubManager, GitHubRepo } from '../lib/github';
import { netlifyManager, NetlifySite, NetlifyDeploy } from '../lib/netlify';

export interface DeploymentConfig {
  projectName: string;
  files: Record<string, string>;
  userEmail?: string;
  projectId?: string;
}

export interface DeploymentResult {
  success: boolean;
  githubRepo?: GitHubRepo;
  netlifySite?: NetlifySite;
  deployment?: NetlifyDeploy;
  error?: string;
}

export interface DeploymentStatus {
  step: 'connecting' | 'creating-repo' | 'uploading-files' | 'creating-site' | 'connecting-repo' | 'deploying' | 'completed' | 'error';
  message: string;
  progress: number;
  githubRepo?: GitHubRepo;
  netlifySite?: NetlifySite;
  deployment?: NetlifyDeploy;
  error?: string;
}

class DeploymentService {
  private statusCallback?: (status: DeploymentStatus) => void;

  setStatusCallback(callback: (status: DeploymentStatus) => void) {
    this.statusCallback = callback;
  }

  private updateStatus(status: Partial<DeploymentStatus>) {
    if (this.statusCallback) {
      this.statusCallback(status as DeploymentStatus);
    }
  }

  // Main deployment workflow
  async deployProject(config: DeploymentConfig): Promise<DeploymentResult> {
    try {
      // Step 1: Check connections
      this.updateStatus({
        step: 'connecting',
        message: 'Checking connections...',
        progress: 10
      });

      if (!githubManager.isAuthenticated()) {
        throw new Error('GitHub not connected. Please connect your GitHub account first.');
      }

      if (!netlifyManager.isAuthenticated()) {
        throw new Error('Netlify not connected. Please connect your Netlify account first.');
      }

      // Step 2: Create GitHub repository
      this.updateStatus({
        step: 'creating-repo',
        message: 'Creating GitHub repository...',
        progress: 20
      });

      const repoName = this.generateRepoName(config.projectName);
      const githubRepo = await githubManager.createRepo(
        repoName,
        `MominAI generated project: ${config.projectName}`,
        false
      );

      this.updateStatus({
        step: 'creating-repo',
        message: 'GitHub repository created successfully',
        progress: 30,
        githubRepo
      });

      // Step 3: Upload files to GitHub
      this.updateStatus({
        step: 'uploading-files',
        message: 'Uploading files to GitHub...',
        progress: 40,
        githubRepo
      });

      await githubManager.uploadFiles(
        githubRepo.full_name.split('/')[0], // owner
        githubRepo.name,
        config.files
      );

      this.updateStatus({
        step: 'uploading-files',
        message: 'Files uploaded to GitHub successfully',
        progress: 50,
        githubRepo
      });

      // Step 4: Create Netlify site
      this.updateStatus({
        step: 'creating-site',
        message: 'Creating Netlify site...',
        progress: 60,
        githubRepo
      });

      const siteName = this.generateSiteName(config.projectName);
      const netlifySite = await netlifyManager.createSite(siteName);

      this.updateStatus({
        step: 'creating-site',
        message: 'Netlify site created successfully',
        progress: 70,
        githubRepo,
        netlifySite
      });

      // Step 5: Connect repository to site
      this.updateStatus({
        step: 'connecting-repo',
        message: 'Connecting GitHub repository to Netlify...',
        progress: 80,
        githubRepo,
        netlifySite
      });

      await netlifyManager.connectSiteToRepo(netlifySite.id, {
        provider: 'github',
        repo_path: githubRepo.full_name,
        repo_branch: 'main'
      });

      this.updateStatus({
        step: 'connecting-repo',
        message: 'Repository connected successfully',
        progress: 90,
        githubRepo,
        netlifySite
      });

      // Step 6: Trigger initial deployment
      this.updateStatus({
        step: 'deploying',
        message: 'Starting initial deployment...',
        progress: 95,
        githubRepo,
        netlifySite
      });

      // The connection should trigger an automatic deployment
      // Wait a moment for deployment to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get deployment status
      const deploys = await netlifyManager.getSiteDeploys(netlifySite.id);
      const latestDeploy = deploys[0];

      this.updateStatus({
        step: 'completed',
        message: 'Deployment initiated successfully!',
        progress: 100,
        githubRepo,
        netlifySite,
        deployment: latestDeploy
      });

      return {
        success: true,
        githubRepo,
        netlifySite,
        deployment: latestDeploy
      };

    } catch (error: any) {
      const errorMessage = error.message || 'Deployment failed';

      this.updateStatus({
        step: 'error',
        message: errorMessage,
        progress: 0,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Generate unique repository name
  private generateRepoName(projectName: string): string {
    const baseName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const timestamp = Date.now();
    return `${baseName}-${timestamp}`;
  }

  // Generate unique site name
  private generateSiteName(projectName: string): string {
    const baseName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const timestamp = Date.now();
    return `${baseName}-${timestamp}`;
  }

  // Get deployment status for a site
  async getDeploymentStatus(siteId: string): Promise<NetlifyDeploy | null> {
    try {
      const deploys = await netlifyManager.getSiteDeploys(siteId);
      return deploys[0] || null;
    } catch (error) {
      console.error('Failed to get deployment status:', error);
      return null;
    }
  }

  // Check if deployment is complete
  isDeploymentComplete(deploy: NetlifyDeploy): boolean {
    return ['ready', 'error'].includes(deploy.state);
  }

  // Get deployment URL
  getDeploymentUrl(deploy: NetlifyDeploy): string {
    return deploy.url || '';
  }
}

export const deploymentService = new DeploymentService();