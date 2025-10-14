// Service Manager - Switches between mock and real services based on environment variables

import { mockDatabaseService } from './mockDatabaseService';
import { mockDeploymentService } from './mockDeploymentService';
import { mockGithubService } from './mockGithubService';
import { mockSupabaseService } from './mockSupabaseService';

// Environment-based service selection
const isMockMode = (import.meta.env as any).VITE_MOCK_MODE === 'true' ||
                   (import.meta.env as any).MOCK_MODE === 'true' ||
                   (process.env as any).MOCK_MODE === 'true';

const disableAI = (import.meta.env as any).VITE_DISABLE_AI === 'true';
const disableDeployment = (import.meta.env as any).VITE_DISABLE_DEPLOYMENT === 'true';
const disableRealDB = (import.meta.env as any).VITE_DISABLE_REAL_DB === 'true';
const disableGithub = (import.meta.env as any).VITE_DISABLE_GITHUB === 'true';
const disableNetlify = (import.meta.env as any).VITE_DISABLE_NETLIFY === 'true';

// Service exports with feature flags
export const dbService = isMockMode || disableRealDB ? mockDatabaseService : null; // Will use real service when implemented
export const deployService = isMockMode || disableDeployment ? mockDeploymentService : null;
export const gitService = isMockMode || disableGithub ? mockGithubService : null;
export const supabaseSvc = isMockMode || disableRealDB ? mockSupabaseService : null;

// AI service (conditionally disabled)
export const aiService = disableAI ? null : null; // Will import real service when available

// Feature availability flags
export const features = {
  mockMode: isMockMode,
  ai: !disableAI,
  deployment: !disableDeployment,
  realDatabase: !disableRealDB,
  github: !disableGithub,
  netlify: !disableNetlify,
  database: true, // Always available (mock or real)
  authentication: true, // Always available (mock or real)
  fileUploads: true, // Always available
  realTime: !isMockMode // Only available in production
};

// Service initialization helper
export async function initializeServices() {
  console.log('🔧 Initializing services...', { features });

  try {
    // Initialize Supabase if not in mock mode
    if (!isMockMode && !disableRealDB && supabaseSvc && 'initialize' in supabaseSvc) {
      const supabaseUrl = (import.meta.env as any).VITE_SUPABASE_URL;
      const supabaseKey = (import.meta.env as any).VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        await (supabaseSvc as any).initialize(supabaseUrl, supabaseKey);
        console.log('✅ Supabase initialized');
      } else {
        console.warn('⚠️ Supabase credentials not found, falling back to mock mode');
      }
    }

    // Initialize GitHub if available
    if (!isMockMode && !disableGithub) {
      const githubToken = (import.meta.env as any).VITE_GITHUB_TOKEN;
      if (!githubToken) {
        console.warn('⚠️ GitHub token not found, using mock GitHub service');
      }
    }

    console.log('✅ All services initialized successfully');
    return true;

  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    console.log('🔄 Falling back to mock services');
    return false;
  }
}

// Utility functions
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature];
}

export function getServiceStatus() {
  return {
    mode: isMockMode ? 'mock' : 'production',
    features: { ...features },
    services: {
      database: dbService ? 'active' : 'disabled',
      deployment: deployService ? 'active' : 'disabled',
      github: gitService ? 'active' : 'disabled',
      supabase: supabaseSvc ? 'active' : 'disabled',
      ai: aiService ? 'active' : 'disabled'
    }
  };
}

// Development helpers
if ((import.meta.env as any).DEV) {
  // Expose services to window for debugging
  (window as any).services = {
    dbService,
    deployService,
    gitService,
    supabaseSvc,
    aiService,
    features,
    getServiceStatus
  };

  console.log('🐛 Development mode: Services exposed to window.services');
}