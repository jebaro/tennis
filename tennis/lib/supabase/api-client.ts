// lib/supabase/api-client.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for server-side API routes
 * This uses the service role key for admin operations
 * NEVER expose this client to the browser
 */
export function getServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Helper to handle API errors consistently
 */
export function handleApiError(error: unknown, fallbackMessage = 'An error occurred') {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    return {
      error: error.message,
      details: error.stack
    };
  }
  
  return {
    error: fallbackMessage,
    details: String(error)
  };
}

/**
 * Standard API response types
 */
export type ApiSuccessResponse<T = any> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
  details?: string;
};

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;