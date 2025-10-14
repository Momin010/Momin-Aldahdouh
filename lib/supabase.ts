import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseCredentials {
  projectUrl: string;
  anonKey: string;
  serviceRoleKey?: string;
}

class SupabaseManager {
  private client: SupabaseClient | null = null;
  private credentials: SupabaseCredentials | null = null;

  // Initialize Supabase client with user credentials
  connect(credentials: SupabaseCredentials): SupabaseClient {
    this.credentials = credentials;
    this.client = createClient(credentials.projectUrl, credentials.anonKey);
    return this.client;
  }

  // Get current client
  getClient(): SupabaseClient | null {
    return this.client;
  }

  // Get credentials
  getCredentials(): SupabaseCredentials | null {
    return this.credentials;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { data, error } = await this.client
        .from('test_connection')
        .select('*')
        .limit(1);

      // Even if table doesn't exist, if we get a response (not auth error), connection works
      return !error || error.code !== 'PGRST116'; // PGRST116 is "relation does not exist"
    } catch (error) {
      return false;
    }
  }

  // Disconnect
  disconnect(): void {
    this.client = null;
    this.credentials = null;
  }

  // Check if connected
  isConnected(): boolean {
    return this.client !== null;
  }
}

// Export singleton instance
export const supabaseManager = new SupabaseManager();

// Helper function to get current Supabase client
export const getSupabaseClient = (): SupabaseClient | null => {
  return supabaseManager.getClient();
};

// Helper function to check connection status
export const isSupabaseConnected = (): boolean => {
  return supabaseManager.isConnected();
};

// Helper function to test connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  return await supabaseManager.testConnection();
};