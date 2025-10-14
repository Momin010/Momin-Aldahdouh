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