import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'lab_shift_supabase_url';
const STORAGE_KEY_KEY = 'lab_shift_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean;
}

// Default Supabase Credentials RSUD SMJ I (provided by user)
export const DEFAULT_SUPABASE_URL = 'https://vmmhkzyafjbrgzcmtnqg.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbWhrenlhZmpicmd6Y210bnFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NDgxMzQsImV4cCI6MjEwNzEyNDEzNH0.cuy5ojMeag3caf7P815WfW270iVtaY0e3akNDRVgvOA';

export function getStoredSupabaseConfig(): SupabaseConfig {
  const customUrl = localStorage.getItem(STORAGE_KEY_URL);
  const customKey = localStorage.getItem(STORAGE_KEY_KEY);

  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (customUrl && customKey) {
    return {
      url: customUrl.trim(),
      anonKey: customKey.trim(),
      isCustom: true,
    };
  }

  // Use environment variables if configured, otherwise fallback to the connected Supabase instance
  const effectiveUrl = (envUrl || DEFAULT_SUPABASE_URL).trim();
  const effectiveKey = (envKey || DEFAULT_SUPABASE_ANON_KEY).trim();

  return {
    url: effectiveUrl,
    anonKey: effectiveKey,
    isCustom: false,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

let cachedClient: SupabaseClient | null = null;
let currentConfigSig = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const sig = `${config.url}::${config.anonKey}`;
  if (cachedClient && currentConfigSig === sig) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfigSig = sig;
    return cachedClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  tablesFound?: string[];
  missingTables?: string[];
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Kredensial Supabase URL dan Anon Key belum dikonfigurasi.',
    };
  }

  try {
    // Test staff table query
    const { data, error } = await client.from('staff').select('staff_id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Terkoneksi ke Supabase, namun tabel belum dibuat. Silakan salin & jalankan skrip SQL di Supabase SQL Editor.',
        };
      }
      return {
        success: false,
        message: `Koneksi gagal: ${error.message}`,
      };
    }

    return {
      success: true,
      message: 'Berhasil terhubung ke Supabase Database!',
      tablesFound: ['staff'],
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi server Supabase: ${err.message || String(err)}`,
    };
  }
}
