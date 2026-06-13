import { createClient, PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import {
  getSupabaseAdminKey,
  getSupabasePublicKey,
  getSupabaseUrl,
  isSupabaseEnvConfigured,
  isValidSupabaseKey,
} from '@/lib/supabase-env';

const supabaseUrl = getSupabaseUrl();
const supabasePublicKey = getSupabasePublicKey();
const supabaseAdminKey = getSupabaseAdminKey();

export const isSupabaseConfigured = isSupabaseEnvConfigured();

export const BUCKET_NAME = 'astra-bucket';
export const LANDING_PAGE_SLUG = 'main';

export type SupabaseContentErrorCode =
  | 'NOT_CONFIGURED'
  | 'NOT_FOUND'
  | 'TABLE_NOT_SETUP'
  | 'INVALID_KEY';

export class SupabaseContentError extends Error {
  code: SupabaseContentErrorCode;
  details?: string;

  constructor(code: SupabaseContentErrorCode, message: string, details?: string) {
    super(message);
    this.name = 'SupabaseContentError';
    this.code = code;
    this.details = details;
  }
}

function formatPostgrestError(error: PostgrestError): string {
  return [error.message, error.code && `code=${error.code}`, error.details, error.hint]
    .filter(Boolean)
    .join(' | ');
}

function mapPostgrestError(error: PostgrestError): SupabaseContentError {
  if (error.code === 'PGRST116') {
    return new SupabaseContentError('NOT_FOUND', 'Landing page row not found in landing_page table');
  }

  if (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    /relation .* does not exist/i.test(error.message)
  ) {
    return new SupabaseContentError(
      'TABLE_NOT_SETUP',
      'landing_page table is missing. Run scripts/supabase-full-setup.sql in Supabase SQL Editor.',
      formatPostgrestError(error)
    );
  }

  if (
    error.code === 'PGRST301' ||
    /invalid.*jwt|jwt.*invalid|invalid api key|invalid.*key/i.test(error.message)
  ) {
    return new SupabaseContentError(
      'INVALID_KEY',
      'Invalid Supabase API key. Check NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.',
      formatPostgrestError(error)
    );
  }

  return new SupabaseContentError(
    'NOT_FOUND',
    'Unable to load landing page from Supabase',
    formatPostgrestError(error)
  );
}

function createSupabaseClient(key: string): SupabaseClient | null {
  if (!supabaseUrl || !key || !isValidSupabaseKey(key)) return null;

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    },
  });
}

/** Public client — used for reads */
export const supabase = isSupabaseConfigured
  ? createSupabaseClient(supabasePublicKey)
  : null;

/** Admin client — used for CMS writes */
export const supabaseAdmin =
  createSupabaseClient(supabaseAdminKey) ?? supabase;

export function buildPublicStorageUrl(filePath: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  // Ensure filePath doesn't start with a slash
  const cleanPath = filePath.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}

export function getPublicUrl(filePath: string): string {
  if (!supabaseUrl) {
    throw new SupabaseContentError("NOT_CONFIGURED", "Supabase URL is not configured");
  }

  // Ensure filePath doesn't start with a slash
  const cleanPath = filePath.replace(/^\/+/, "");

  if (supabase) {
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(cleanPath);
    if (data.publicUrl) {
      // Ensure the URL is properly formatted
      return data.publicUrl;
    }
  }

  return buildPublicStorageUrl(cleanPath);
}

export async function uploadFile(file: File, filePath: string) {
  const client = supabaseAdmin;
  if (!client) {
    throw new SupabaseContentError(
      'NOT_CONFIGURED',
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  // Ensure filePath doesn't start with a slash
  const cleanPath = filePath.replace(/^\/+/, "");

  // Determine the correct content type
  const contentType = file.type || 'application/octet-stream';

  const { error } = await client.storage
    .from(BUCKET_NAME)
    .upload(cleanPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType,
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }

  return getPublicUrl(cleanPath);
}

export async function deleteFile(filePath: string) {
  const client = supabaseAdmin;
  if (!client) {
    throw new SupabaseContentError('NOT_CONFIGURED', 'Supabase is not configured');
  }

  const { error } = await client.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    throw error;
  }
}

export async function listFiles(folder: string = '') {
  if (!supabase) {
    throw new SupabaseContentError('NOT_CONFIGURED', 'Supabase is not configured');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function getLandingPageFromSupabase() {
  if (!supabase) {
    if (supabaseUrl && supabasePublicKey && !isValidSupabaseKey(supabasePublicKey)) {
      throw new SupabaseContentError(
        'INVALID_KEY',
        'Supabase public key is invalid. Use sb_publishable_... from Supabase → Project Settings → API.'
      );
    }

    throw new SupabaseContentError(
      'NOT_CONFIGURED',
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  const { data, error } = await supabase
    .from('landing_page')
    .select('content')
    .eq('slug', LANDING_PAGE_SLUG)
    .maybeSingle();

  if (error) {
    throw mapPostgrestError(error);
  }

  if (!data?.content) {
    throw new SupabaseContentError(
      'NOT_FOUND',
      'No row found for slug "main" in landing_page table. Run scripts/supabase-full-setup.sql.'
    );
  }

  return data.content;
}

export async function updateLandingPageInSupabase(content: unknown) {
  const client = supabaseAdmin;
  if (!client) {
    throw new SupabaseContentError('NOT_CONFIGURED', 'Supabase not configured');
  }

  const { data, error } = await client
    .from('landing_page')
    .upsert(
      {
        slug: LANDING_PAGE_SLUG,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
    .select()
    .single();

  if (error) {
    throw mapPostgrestError(error);
  }

  return data;
}

/** @deprecated Use getLandingPageFromSupabase */
export const getSiteContentFromSupabase = getLandingPageFromSupabase;

/** @deprecated Use updateLandingPageInSupabase */
export const updateSiteContentInSupabase = updateLandingPageInSupabase;

export function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.indexOf('public');

    if (bucketIndex === -1 || bucketIndex >= pathParts.length - 2) {
      return null;
    }

    const filePath = pathParts.slice(bucketIndex + 2).join('/');
    return filePath || null;
  } catch {
    return null;
  }
}

export async function deleteFileByUrl(url: string): Promise<boolean> {
  const filePath = extractFilePathFromUrl(url);

  if (!filePath) {
    console.warn('Could not extract file path from URL:', url);
    return false;
  }

  try {
    await deleteFile(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
