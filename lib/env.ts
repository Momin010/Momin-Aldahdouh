/**
 * Environment variable validation utilities
 */

interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const requiredVars = [
    'JWT_SECRET',
    'GEMINI_API_KEY', // At least one GEMINI_API_KEY_n should be set
  ];

  const optionalVarGroups = [
    {
      name: 'GitHub OAuth',
      vars: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
      description: 'GitHub OAuth credentials for publishing projects to GitHub. Optional - GitHub publishing will be disabled if not configured.'
    }
  ];

  const missingVars: string[] = [];
  const errors: string[] = [];

  // Check JWT_SECRET
  if (!process.env.JWT_SECRET) {
    missingVars.push('JWT_SECRET');
    errors.push('JWT_SECRET is required for authentication. Please set it in your environment variables.');
  }

  // Check for at least one GEMINI_API_KEY
  const hasGeminiKey = Object.keys(process.env).some(key =>
    key.startsWith('GEMINI_API_KEY') && process.env[key]?.trim()
  );

  if (!hasGeminiKey) {
    missingVars.push('GEMINI_API_KEY');
    errors.push('At least one GEMINI_API_KEY environment variable is required. Please set GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.');
  }

  // Check optional GitHub OAuth variables (both should be set together)
  const hasGitHubClientId = process.env.GITHUB_CLIENT_ID?.trim();
  const hasGitHubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();

  if (hasGitHubClientId && !hasGitHubClientSecret) {
    errors.push('GITHUB_CLIENT_SECRET is required when GITHUB_CLIENT_ID is set.');
  }

  if (!hasGitHubClientId && hasGitHubClientSecret) {
    errors.push('GITHUB_CLIENT_ID is required when GITHUB_CLIENT_SECRET is set.');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    errors
  };
}

export function getEnvErrorMessage(): string {
  const validation = validateEnvironment();
  if (validation.isValid) return '';

  return `Environment configuration error:\n${validation.errors.join('\n')}\n\nPlease check your Vercel project settings or .env file.`;
}

export function throwIfEnvInvalid(): void {
  const validation = validateEnvironment();
  if (!validation.isValid) {
    throw new Error(getEnvErrorMessage());
  }
}