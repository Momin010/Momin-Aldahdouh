import type { DeploymentPlatform, DeploymentConfig, DeploymentResult, DeploymentStatus } from '../types';

// Mock deployment platforms
const MOCK_PLATFORMS: DeploymentPlatform[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    icon: '🚀',
    description: 'Deploy to Vercel with global CDN',
    features: ['Global CDN', 'Serverless Functions', 'SSL Certificate', 'Custom Domains'],
    pricing: 'Free tier available',
    status: 'available'
  },
  {
    id: 'netlify',
    name: 'Netlify',
    icon: '🌐',
    description: 'Static site hosting with form handling',
    features: ['Static Hosting', 'Form Handling', 'Build Hooks', 'Deploy Previews'],
    pricing: 'Free tier available',
    status: 'available'
  },
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    icon: '📄',
    description: 'Free hosting for static websites',
    features: ['Free Hosting', 'Custom Domain', 'HTTPS', 'Git Integration'],
    pricing: 'Completely free',
    status: 'available'
  },
  {
    id: 'railway',
    name: 'Railway',
    icon: '🚂',
    description: 'Full-stack deployment platform',
    features: ['Databases', 'Serverless', 'Custom Domains', 'Auto-scaling'],
    pricing: '$5/month starter',
    status: 'available'
  }
];

// Mock deployment history
const MOCK_DEPLOYMENTS: DeploymentResult[] = [
  {
    id: 'deploy_001',
    platform: 'vercel',
    projectName: 'My Awesome App',
    url: 'https://my-awesome-app.vercel.app',
    status: 'success',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    buildTime: 45000, // 45 seconds
    size: '2.3 MB'
  },
  {
    id: 'deploy_002',
    platform: 'netlify',
    projectName: 'Portfolio Site',
    url: 'https://amazing-portfolio.netlify.app',
    status: 'success',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    buildTime: 32000,
    size: '1.8 MB'
  }
];

class MockDeploymentService {
  private platforms: DeploymentPlatform[] = [...MOCK_PLATFORMS];
  private deployments: DeploymentResult[] = [...MOCK_DEPLOYMENTS];

  // Get available platforms
  async getPlatforms(): Promise<DeploymentPlatform[]> {
    console.log('📋 [MOCK] Getting deployment platforms');
    return this.platforms;
  }

  // Deploy project to platform
  async deployProject(
    files: any,
    config: DeploymentConfig,
    onProgress?: (progress: number, message: string) => void
  ): Promise<DeploymentResult> {
    console.log('🚀 [MOCK] Deploying project to:', config.platform);

    const platform = this.platforms.find(p => p.id === config.platform);
    if (!platform) {
      throw new Error('Platform not found');
    }

    // Simulate deployment process
    const steps = [
      'Initializing deployment...',
      'Building project...',
      'Optimizing assets...',
      'Uploading files...',
      'Configuring domain...',
      'Deployment complete!'
    ];

    for (let i = 0; i < steps.length; i++) {
      if (onProgress) {
        onProgress((i + 1) / steps.length * 100, steps[i]);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Create mock deployment result
    const deployment: DeploymentResult = {
      id: `deploy_${Date.now()}`,
      platform: config.platform,
      projectName: config.projectName,
      url: this.generateMockUrl(config.platform, config.projectName),
      status: 'success',
      createdAt: new Date().toISOString(),
      buildTime: Math.floor(Math.random() * 60000) + 20000, // 20-80 seconds
      size: `${(Math.random() * 5 + 1).toFixed(1)} MB`
    };

    this.deployments.unshift(deployment);
    return deployment;
  }

  // Get deployment history
  async getDeployments(): Promise<DeploymentResult[]> {
    console.log('📚 [MOCK] Getting deployment history');
    return this.deployments;
  }

  // Get deployment status
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    console.log('📊 [MOCK] Getting deployment status:', deploymentId);

    const deployment = this.deployments.find(d => d.id === deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    return {
      id: deployment.id,
      status: deployment.status,
      url: deployment.url,
      buildTime: deployment.buildTime,
      size: deployment.size,
      logs: [
        '[INFO] Build started',
        '[INFO] Installing dependencies...',
        '[INFO] Building project...',
        '[INFO] Optimizing assets...',
        '[INFO] Deployment successful!'
      ]
    };
  }

  // Redeploy project
  async redeployProject(deploymentId: string): Promise<DeploymentResult> {
    console.log('🔄 [MOCK] Redeploying project:', deploymentId);

    const existingDeployment = this.deployments.find(d => d.id === deploymentId);
    if (!existingDeployment) {
      throw new Error('Deployment not found');
    }

    // Simulate redeployment
    await new Promise(resolve => setTimeout(resolve, 3000));

    const redeployment: DeploymentResult = {
      ...existingDeployment,
      id: `redeploy_${Date.now()}`,
      createdAt: new Date().toISOString(),
      buildTime: Math.floor(Math.random() * 30000) + 15000 // 15-45 seconds
    };

    this.deployments.unshift(redeployment);
    return redeployment;
  }

  // Delete deployment
  async deleteDeployment(deploymentId: string): Promise<void> {
    console.log('🗑️ [MOCK] Deleting deployment:', deploymentId);

    const index = this.deployments.findIndex(d => d.id === deploymentId);
    if (index === -1) {
      throw new Error('Deployment not found');
    }

    this.deployments.splice(index, 1);
  }

  // Generate custom domain
  async setupCustomDomain(deploymentId: string, domain: string): Promise<void> {
    console.log('🌐 [MOCK] Setting up custom domain:', domain, 'for deployment:', deploymentId);

    const deployment = this.deployments.find(d => d.id === deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    // Simulate DNS setup
    await new Promise(resolve => setTimeout(resolve, 2000));

    deployment.url = `https://${domain}`;
    console.log('✅ [MOCK] Custom domain configured successfully');
  }

  // Get platform-specific config
  async getPlatformConfig(platformId: string): Promise<any> {
    console.log('⚙️ [MOCK] Getting platform config for:', platformId);

    const platform = this.platforms.find(p => p.id === platformId);
    if (!platform) {
      throw new Error('Platform not found');
    }

    return {
      platform: platform,
      requiredEnvVars: this.getRequiredEnvVars(platformId),
      buildSettings: {
        buildCommand: 'npm run build',
        outputDir: 'dist',
        nodeVersion: '18'
      }
    };
  }

  // Private helper methods
  private generateMockUrl(platform: string, projectName: string): string {
    const cleanName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const randomId = Math.random().toString(36).substring(2, 8);

    switch (platform) {
      case 'vercel':
        return `https://${cleanName}-${randomId}.vercel.app`;
      case 'netlify':
        return `https://${cleanName}-${randomId}.netlify.app`;
      case 'github-pages':
        return `https://${randomId}.github.io/${cleanName}`;
      case 'railway':
        return `https://${cleanName}-${randomId}.up.railway.app`;
      default:
        return `https://${cleanName}-${randomId}.mock.app`;
    }
  }

  private getRequiredEnvVars(platformId: string): string[] {
    const baseVars = ['NODE_ENV'];

    switch (platformId) {
      case 'vercel':
        return [...baseVars, 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
      case 'netlify':
        return [...baseVars, 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
      case 'railway':
        return [...baseVars, 'DATABASE_URL', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
      default:
        return baseVars;
    }
  }
}

export const mockDeploymentService = new MockDeploymentService();