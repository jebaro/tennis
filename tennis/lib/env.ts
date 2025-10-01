// lib/env.ts

/**
 * Required environment variables for the application
 */
const requiredClientEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
] as const;

const requiredServerEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/**
 * Validate that all required environment variables are present
 * Call this in layout.tsx or middleware to fail fast on startup
 */
export function validateClientEnv() {
  const missing = requiredClientEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required client environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nPlease check your .env.local file.`
    );
  }
}

/**
 * Validate server-side environment variables
 * Call this in API routes or server components
 */
export function validateServerEnv() {
  const missing = requiredServerEnvVars.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required server environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nPlease check your .env.local file.`
    );
  }
}

/**
 * Get a typed environment variable with validation
 */
export function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  
  return value;
}

/**
 * Check if all environment variables are configured
 * Used in middleware to show setup instructions
 */
export function hasEnvVars(): boolean {
  return requiredClientEnvVars.every((key) => Boolean(process.env[key]));
}